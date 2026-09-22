import bcrypt from 'bcryptjs'
import { query, withTransaction } from '../config/db.ts'
import type { NoticeEntity, CommunityDocumentEntity, UserEntity } from '../types/db.types.ts'

export interface ResidentDirectoryItem {
  id: number
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
   * Obtiene la lista de condominios registrados
   */
  static async getCondominiums(): Promise<any[]> {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.address,
        c.postal_code AS "postalCode",
        c.city,
        c.currency,
        (SELECT count(*) FROM vecilomas.units u WHERE u.condominium_id = c.id)::int AS "unitsCount",
        (SELECT count(*) FROM vecilomas.users usr WHERE usr.condominium_id = c.id AND usr.role = 'resident')::int AS "residentsCount"
      FROM vecilomas.condominiums c
      ORDER BY c.id ASC;
    `
    const { rows } = await query(sql)
    return rows
  }

  /**
   * Crear nuevo condominio
   */
  static async createCondominium(data: {
    name: string
    address: string
    postalCode?: string
    city?: string
    currency?: string
  }) {
    const sql = `
      INSERT INTO vecilomas.condominiums (name, address, postal_code, city, currency, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, address, postal_code AS "postalCode", city, currency, 0 AS "unitsCount", 0 AS "residentsCount";
    `
    const { rows } = await query(sql, [
      data.name,
      data.address,
      data.postalCode || null,
      data.city || null,
      data.currency || 'MXN',
    ])
    return rows[0]
  }

  /**
   * Actualizar datos de un condominio
   */
  static async updateCondominium(id: number, data: {
    name: string
    address: string
    postalCode?: string
    city?: string
    currency?: string
  }) {
    const sql = `
      UPDATE vecilomas.condominiums
      SET name = $2, address = $3, postal_code = $4, city = $5, currency = $6
      WHERE id = $1
      RETURNING id, name, address, postal_code AS "postalCode", city, currency,
        (SELECT count(*) FROM vecilomas.units u WHERE u.condominium_id = $1)::int AS "unitsCount",
        (SELECT count(*) FROM vecilomas.users usr WHERE usr.condominium_id = $1 AND usr.role = 'resident')::int AS "residentsCount";
    `
    const { rows } = await query(sql, [
      id,
      data.name,
      data.address,
      data.postalCode || null,
      data.city || null,
      data.currency || 'MXN',
    ])
    return rows[0]
  }

  /**
   * Eliminar un condominio
   */
  static async deleteCondominium(id: number) {
    const sql = `DELETE FROM vecilomas.condominiums WHERE id = $1 RETURNING id;`
    const { rows } = await query(sql, [id])
    return rows[0]
  }

  /**
   * Obtiene el directorio residencial completo desde PostgreSQL
   * Vincula unidades y usuarios residentes sin perder unidades vacías o residentes sin unidad asignada.
   */
  static async getResidentsDirectory(condoId?: string | number): Promise<ResidentDirectoryItem[]> {
    const sql = `
      SELECT 
        COALESCE(u.id, un.id) AS id,
        un.unit_number AS unit,
        COALESCE(u.full_name, 'Unidad sin residente asignado') AS name,
        CASE 
          WHEN lower(COALESCE(u.resident_type, '')) = 'arrendatario' THEN 'Arrendatario'
          ELSE 'Propietario'
        END AS type,
        CASE 
          WHEN un.status = 'moroso' THEN 'Moroso'
          ELSE 'Al corriente'
        END AS status,
        COALESCE(u.phone, '') AS phone,
        COALESCE(u.email, '') AS email,
        COALESCE(
          (SELECT json_agg(v.plate_number) 
           FROM vecilomas.vehicles v 
           WHERE v.unit_id = un.id OR (u.id IS NOT NULL AND v.user_id = u.id)),
          '[]'::json
        ) AS vehicles
      FROM vecilomas.units un
      LEFT JOIN vecilomas.users u ON u.unit_id = un.id AND u.role = 'resident'
      WHERE ($1::integer IS NULL OR un.condominium_id = $1::integer)
      ORDER BY un.unit_number ASC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null])
    return rows
  }

  /**
   * Crea un residente y lo asocia a su unidad
   */
  static async createResident(data: {
    condominiumId: string | number
    unitNumber: string
    fullName: string
    email: string
    phone: string
    residentType: string
    password?: string
    status?: string
    vehicles?: string[]
  }) {
    return await withTransaction(async (client) => {
      const condoId = Number(data.condominiumId) || 1
      const unitStatus = data.status === 'Moroso' ? 'moroso' : 'al_corriente'

      const findUnitSql = `
        SELECT id FROM vecilomas.units 
        WHERE condominium_id = $1 AND unit_number = $2
      `
      const unitRes = await client.query(findUnitSql, [condoId, data.unitNumber])
      let unitId = unitRes.rows[0]?.id

      if (!unitId) {
        const createUnitSql = `
          INSERT INTO vecilomas.units (condominium_id, unit_number, status)
          VALUES ($1, $2, $3)
          RETURNING id;
        `
        const newUnit = await client.query(createUnitSql, [condoId, data.unitNumber, unitStatus])
        unitId = newUnit.rows[0].id
      } else {
        await client.query('UPDATE vecilomas.units SET status = $2 WHERE id = $1', [unitId, unitStatus])
      }

      const rType = (data.residentType || 'propietario').toLowerCase()

      // Manejar correo (si viene vacío, generar identificador único)
      let userEmail = (data.email || '').trim().toLowerCase()
      if (!userEmail) {
        const cleanName = (data.fullName || 'residente').toLowerCase().replace(/[^a-z0-9]/g, '')
        const cleanUnit = (data.unitNumber || 'sn').toLowerCase().replace(/[^a-z0-9]/g, '')
        userEmail = `${cleanName}.${cleanUnit}@laspalomas.mx`
      }

      // Manejar contraseña con bcrypt
      let passwordHash = '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG'
      if (data.password && data.password.trim()) {
        passwordHash = await bcrypt.hash(data.password.trim(), 10)
      }

      const insertUserSql = `
        INSERT INTO vecilomas.users (
          condominium_id, unit_id, email, password_hash, full_name, phone, role, resident_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'resident', $7, 'activo')
        ON CONFLICT (email) DO UPDATE 
        SET unit_id = EXCLUDED.unit_id,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            resident_type = EXCLUDED.resident_type,
            password_hash = CASE WHEN EXCLUDED.password_hash != '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG' THEN EXCLUDED.password_hash ELSE vecilomas.users.password_hash END
        RETURNING id, full_name, email;
      `
      const userRes = await client.query(insertUserSql, [
        condoId,
        unitId,
        userEmail,
        passwordHash,
        data.fullName,
        data.phone || '',
        rType,
      ])

      const userId = userRes.rows[0].id

      if (data.vehicles && data.vehicles.length > 0) {
        for (const plate of data.vehicles) {
          if (plate && plate.trim()) {
            await client.query(
              `INSERT INTO vecilomas.vehicles (unit_id, user_id, plate_number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
              [unitId, userId, plate.trim()]
            )
          }
        }
      }

      return userRes.rows[0]
    })
  }

  /**
   * Actualiza datos de un residente (nombre, email, teléfono, tipo, unidad, status, vehículos, contraseña)
   */
  static async updateResident(id: number, data: {
    unitNumber: string
    fullName: string
    email: string
    phone: string
    residentType: string
    password?: string
    status?: string
    vehicles?: string[]
  }) {
    return await withTransaction(async (client) => {
      const uRes = await client.query('SELECT condominium_id, unit_id FROM vecilomas.users WHERE id = $1', [id])
      if (uRes.rows.length === 0) throw new Error('Residente no encontrado')
      const { condominium_id: condoId, unit_id: currentUnitId } = uRes.rows[0]

      const unitStatus = data.status === 'Moroso' ? 'moroso' : 'al_corriente'
      let unitId = currentUnitId

      if (data.unitNumber) {
        const findUnit = await client.query(
          'SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2',
          [condoId, data.unitNumber]
        )
        if (findUnit.rows.length > 0) {
          unitId = findUnit.rows[0].id
          await client.query('UPDATE vecilomas.units SET status = $2 WHERE id = $1', [unitId, unitStatus])
        } else {
          const newU = await client.query(
            'INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, $3) RETURNING id',
            [condoId, data.unitNumber, unitStatus]
          )
          unitId = newU.rows[0].id
        }
      }

      const rType = (data.residentType || 'propietario').toLowerCase()

      let passwordHashUpdate = ''
      const params: any[] = [id, unitId, data.fullName, data.email, data.phone || '', rType]
      if (data.password && data.password.trim()) {
        const hashed = await bcrypt.hash(data.password.trim(), 10)
        params.push(hashed)
        passwordHashUpdate = `, password_hash = $${params.length}`
      }

      const updateSql = `
        UPDATE vecilomas.users
        SET unit_id = $2, full_name = $3, email = $4, phone = $5, resident_type = $6, updated_at = NOW() ${passwordHashUpdate}
        WHERE id = $1
        RETURNING id, full_name, email;
      `
      const resUser = await client.query(updateSql, params)


      if (data.vehicles !== undefined) {
        await client.query('DELETE FROM vecilomas.vehicles WHERE user_id = $1 OR unit_id = $2', [id, unitId])
        for (const plate of data.vehicles) {
          if (plate && plate.trim()) {
            await client.query(
              'INSERT INTO vecilomas.vehicles (unit_id, user_id, plate_number) VALUES ($1, $2, $3)',
              [unitId, id, plate.trim()]
            )
          }
        }
      }

      return resUser.rows[0]
    })
  }

  /**
   * Eliminar residente de la base de datos
   */
  static async deleteResident(id: number) {
    return await withTransaction(async (client) => {
      await client.query('DELETE FROM vecilomas.vehicles WHERE user_id = $1', [id])
      await client.query('DELETE FROM vecilomas.user_permissions WHERE user_id = $1', [id])
      const res = await client.query('DELETE FROM vecilomas.users WHERE id = $1 RETURNING id', [id])
      return res.rows[0]
    })
  }

  /**
   * Avisos y Comunicados ordenados cronológicamente
   */
  static async getNotices(condoId?: string | number): Promise<NoticeEntity[]> {
    const sql = `
      SELECT * FROM vecilomas.notices
      WHERE ($1::integer IS NULL OR condominium_id = $1::integer)
      ORDER BY is_urgent DESC, published_at DESC;
    `
    const { rows } = await query<NoticeEntity>(sql, [condoId ? Number(condoId) : null])
    return rows
  }

  static async createNotice(data: {
    condominiumId: string | number
    authorUserId: string | number
    title: string
    content: string
    noticeType: string
    isUrgent: boolean
  }) {
    const sql = `
      INSERT INTO vecilomas.notices (
        condominium_id, author_user_id, title, content, notice_type, is_urgent, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      Number(data.condominiumId) || 1,
      Number(data.authorUserId) || 1,
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
  static async getDocuments(condoId?: string | number): Promise<CommunityDocumentEntity[]> {
    const sql = `
      SELECT * FROM vecilomas.community_documents
      WHERE ($1::integer IS NULL OR condominium_id = $1::integer)
      ORDER BY created_at DESC;
    `
    const { rows } = await query<CommunityDocumentEntity>(sql, [condoId ? Number(condoId) : null])
    return rows
  }

  static async createDocument(data: {
    condominiumId: string | number
    name: string
    category: string
    fileUrl: string
    fileSizeBytes?: number
    mimeType?: string
    uploadedByUserId?: string | number
  }) {
    const sql = `
      INSERT INTO vecilomas.community_documents (
        condominium_id, name, category, file_url, file_size_bytes, mime_type, uploaded_by_user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      Number(data.condominiumId) || 1,
      data.name,
      data.category.toLowerCase(),
      data.fileUrl,
      data.fileSizeBytes || 0,
      data.mimeType || 'application/pdf',
      data.uploadedByUserId ? Number(data.uploadedByUserId) : null,
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
  static async getUsersWithPermissions(condoId?: string | number) {
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
      WHERE ($1::integer IS NULL OR u.condominium_id = $1::integer)
      ORDER BY u.created_at ASC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null])
    return rows
  }

  static async createUserWithPermissions(data: {
    condominiumId?: number
    fullName: string
    email: string
    role: string
    password?: string
    unitNumber?: string
    permissions?: string[]
  }) {
    return await withTransaction(async (client) => {
      let unitId = null
      // Solo asociar unidad si el rol es explícitamente residente
      if (data.role === 'resident' && data.unitNumber) {
        const u = await client.query('SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2', [data.condominiumId || 1, data.unitNumber])
        if (u.rows[0]) unitId = u.rows[0].id
      }

      let passwordHash = '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG'
      if (data.password && data.password.trim()) {
        passwordHash = await bcrypt.hash(data.password.trim(), 10)
      }

      const userRes = await client.query(`
        INSERT INTO vecilomas.users (condominium_id, unit_id, email, password_hash, full_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'activo')
        ON CONFLICT (email) DO UPDATE
        SET role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            unit_id = EXCLUDED.unit_id,
            password_hash = CASE WHEN EXCLUDED.password_hash != '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG' THEN EXCLUDED.password_hash ELSE vecilomas.users.password_hash END
        RETURNING id, full_name, email, role, status;
      `, [data.condominiumId || 1, unitId, data.email, passwordHash, data.fullName, data.role])


      const userId = userRes.rows[0].id

      if (data.permissions && data.permissions.length > 0) {
        for (const perm of data.permissions) {
          await client.query('INSERT INTO vecilomas.user_permissions (user_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, perm])
        }
      }

      return userRes.rows[0]
    })
  }

  static async deleteUserPermission(userId: number) {
    return await withTransaction(async (client) => {
      await client.query('DELETE FROM vecilomas.user_permissions WHERE user_id = $1', [userId])
      const res = await client.query('DELETE FROM vecilomas.users WHERE id = $1 RETURNING id', [userId])
      return res.rows[0]
    })
  }
}
