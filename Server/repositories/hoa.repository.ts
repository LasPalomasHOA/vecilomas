import { query } from '../config/db.ts'
import type { NoticeEntity, CommunityDocumentEntity, UserEntity } from '../types/db.types.ts'

export interface ResidentDirectoryItem {
  id: string
  unit: string
  name: string
  type: 'Propietario' | 'Arrendatario'
  status: 'Al corriente' | 'Moroso'
  phone: string
  email: string
  vehicles: string[]
}

export class HoaRepository {
  /**
   * Obtiene el directorio residencial completo optimizado en 1 sola consulta
   * usando JSON_AGG para evitar el problema de N+1 queries al traer los vehículos.
   */
  static async getResidentsDirectory(condoId?: string): Promise<ResidentDirectoryItem[]> {
    const sql = `
      SELECT 
        u.id,
        un.unit_number AS unit,
        u.full_name AS name,
        CASE 
          WHEN u.resident_type = 'propietario' THEN 'Propietario'
          ELSE 'Arrendatario'
        END AS type,
        CASE 
          WHEN un.status = 'al_corriente' THEN 'Al corriente'
          ELSE 'Moroso'
        END AS status,
        COALESCE(u.phone, '') AS phone,
        u.email,
        COALESCE(
          (SELECT json_agg(v.plate_number) 
           FROM vecilomas.vehicles v 
           WHERE v.unit_id = un.id),
          '[]'::json
        ) AS vehicles
      FROM vecilomas.users u
      JOIN vecilomas.units un ON u.unit_id = un.id
      WHERE u.role = 'resident'
        AND ($1::uuid IS NULL OR u.condominium_id = $1::uuid)
      ORDER BY un.unit_number ASC;
    `
    const { rows } = await query(sql, [condoId || null])
    return rows
  }

  /**
   * Crea un residente y lo asocia a su unidad
   */
  static async createResident(data: {
    condominiumId: string
    unitNumber: string
    fullName: string
    email: string
    phone: string
    residentType: 'propietario' | 'arrendatario'
    vehicles?: string[]
  }) {
    const findUnitSql = `
      SELECT id FROM vecilomas.units 
      WHERE condominium_id = $1 AND unit_number = $2
    `
    const unitRes = await query(findUnitSql, [data.condominiumId, data.unitNumber])
    let unitId = unitRes.rows[0]?.id

    if (!unitId) {
      const createUnitSql = `
        INSERT INTO vecilomas.units (condominium_id, unit_number, status)
        VALUES ($1, $2, 'al_corriente')
        RETURNING id;
      `
      const newUnit = await query(createUnitSql, [data.condominiumId, data.unitNumber])
      unitId = newUnit.rows[0].id
    }

    const insertUserSql = `
      INSERT INTO vecilomas.users (
        condominium_id, unit_id, email, password_hash, full_name, phone, role, resident_type, status
      ) VALUES ($1, $2, $3, 'temp_hash', $4, $5, 'resident', $6, 'activo')
      RETURNING id, full_name, email;
    `
    const userRes = await query(insertUserSql, [
      data.condominiumId,
      unitId,
      data.email,
      data.fullName,
      data.phone,
      data.residentType,
    ])

    const userId = userRes.rows[0].id

    if (data.vehicles && data.vehicles.length > 0) {
      for (const plate of data.vehicles) {
        if (plate.trim()) {
          await query(
            `INSERT INTO vecilomas.vehicles (unit_id, user_id, plate_number) VALUES ($1, $2, $3)`,
            [unitId, userId, plate.trim()]
          )
        }
      }
    }

    return userRes.rows[0]
  }

  /**
   * Avisos y Comunicados ordenados cronológicamente
   */
  static async getNotices(condoId?: string): Promise<NoticeEntity[]> {
    const sql = `
      SELECT * FROM vecilomas.notices
      WHERE ($1::uuid IS NULL OR condominium_id = $1::uuid)
      ORDER BY is_urgent DESC, published_at DESC;
    `
    const { rows } = await query<NoticeEntity>(sql, [condoId || null])
    return rows
  }

  static async createNotice(data: {
    condominiumId: string
    authorUserId: string
    title: string
    content: string
    noticeType: string
    isUrgent: boolean
  }) {
    const sql = `
      INSERT INTO vecilomas.notices (
        condominium_id, author_user_id, title, content, notice_type, is_urgent, published_at
      ) VALUES ($1, $2, $3, $4, $5::vecilomas.notice_type, $6, NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      data.condominiumId,
      data.authorUserId,
      data.title,
      data.content,
      data.noticeType.toLowerCase(),
      data.isUrgent,
    ])
    return rows[0]
  }

  static async deleteNotice(id: number) {
    const sql = `DELETE FROM vecilomas.notices WHERE id = $1 RETURNING id;`
    const { rows } = await query(sql, [id])
    return rows[0]
  }

  /**
   * Repositorio de Documentos comunitarios
   */
  static async getDocuments(condoId?: string): Promise<CommunityDocumentEntity[]> {
    const sql = `
      SELECT * FROM vecilomas.community_documents
      WHERE ($1::uuid IS NULL OR condominium_id = $1::uuid)
      ORDER BY created_at DESC;
    `
    const { rows } = await query<CommunityDocumentEntity>(sql, [condoId || null])
    return rows
  }

  static async createDocument(data: {
    condominiumId: string
    name: string
    category: string
    fileUrl: string
    fileSizeBytes?: number
    mimeType?: string
    uploadedByUserId?: string
  }) {
    const sql = `
      INSERT INTO vecilomas.community_documents (
        condominium_id, name, category, file_url, file_size_bytes, mime_type, uploaded_by_user_id, created_at
      ) VALUES ($1, $2, $3::vecilomas.document_category, $4, $5, $6, $7, NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      data.condominiumId,
      data.name,
      data.category.toLowerCase(),
      data.fileUrl,
      data.fileSizeBytes || 0,
      data.mimeType || 'application/pdf',
      data.uploadedByUserId || null,
    ])
    return rows[0]
  }

  static async deleteDocument(id: number) {
    const sql = `DELETE FROM vecilomas.community_documents WHERE id = $1 RETURNING id;`
    const { rows } = await query(sql, [id])
    return rows[0]
  }

  /**
   * Lista usuarios y sus permisos agregados
   */
  static async getUsersWithPermissions(condoId?: string) {
    const sql = `
      SELECT 
        u.id,
        u.full_name AS name,
        u.email,
        u.role,
        un.unit_number AS unit,
        CASE WHEN u.status = 'activo' THEN 'Activo' ELSE 'Inactivo' END AS status,
        COALESCE(
          (SELECT json_agg(up.permission_key) 
           FROM vecilomas.user_permissions up 
           WHERE up.user_id = u.id),
          '[]'::json
        ) AS permissions
      FROM vecilomas.users u
      LEFT JOIN vecilomas.units un ON u.unit_id = un.id
      WHERE ($1::uuid IS NULL OR u.condominium_id = $1::uuid)
      ORDER BY u.created_at ASC;
    `
    const { rows } = await query(sql, [condoId || null])
    return rows
  }
}
