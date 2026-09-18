import { query, withTransaction } from '../config/db.ts'
import type { AccessPassEntity, VisitType, PassStatus } from '../types/db.types.ts'

export class AccessRepository {
  /**
   * Genera un nuevo Pase QR de Acceso
   */
  static async createAccessPass(data: {
    unitId: string
    hostUserId: string
    visitorName: string
    visitorPhone?: string
    visitType: VisitType
    validFrom: string
    validUntil: string
    customQrCode?: string
    isSingleUse?: boolean
  }): Promise<AccessPassEntity> {
    const code =
      data.customQrCode ||
      `VCN-${data.visitorName.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const sql = `
      INSERT INTO vecilomas.access_passes (
        unit_id, host_user_id, qr_code, visitor_name, visitor_phone, visit_type, valid_from, valid_until, is_single_use, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6::vecilomas.visit_type, $7, $8, $9, 'activo', NOW())
      RETURNING *;
    `
    const { rows } = await query<AccessPassEntity>(sql, [
      data.unitId,
      data.hostUserId,
      code,
      data.visitorName,
      data.visitorPhone || null,
      data.visitType.toLowerCase(),
      data.validFrom,
      data.validUntil,
      data.isSingleUse !== undefined ? data.isSingleUse : true,
    ])
    return rows[0]
  }

  /**
   * Validación instantánea de Código QR en la caseta de vigilancia
   */
  static async validateQRCode(qrCode: string) {
    const trimmed = qrCode.trim().toUpperCase()

    const sql = `
      SELECT 
        ap.id,
        ap.qr_code,
        ap.visitor_name,
        ap.visitor_phone,
        ap.visit_type,
        ap.valid_from,
        ap.valid_until,
        ap.status,
        u.full_name AS host_name,
        un.unit_number AS unit
      FROM vecilomas.access_passes ap
      JOIN vecilomas.users u ON ap.host_user_id = u.id
      JOIN vecilomas.units un ON ap.unit_id = un.id
      WHERE UPPER(ap.qr_code) = $1;
    `
    const { rows } = await query(sql, [trimmed])
    if (rows.length === 0) {
      return { valid: false, message: 'Código QR no registrado en el sistema.' }
    }

    const pass = rows[0]
    const now = new Date()

    if (pass.status === 'expirado' || now > new Date(pass.valid_until)) {
      return { valid: false, pass, message: 'El pase de acceso ha expirado.' }
    }
    if (pass.status === 'utilizado') {
      return { valid: false, pass, message: 'Este pase ya fue utilizado previamente.' }
    }
    if (pass.status === 'cancelado') {
      return { valid: false, pass, message: 'Este pase fue cancelado por el anfitrión.' }
    }

    return { valid: true, pass, message: 'Pase digital válido y verificado con éxito.' }
  }

  /**
   * Obtiene la bitácora de accesos con filtros por fecha, unidad o estatus
   */
  static async getVisitLogs(condoId?: string, status?: string) {
    const sql = `
      SELECT 
        vl.id,
        vl.visitor_name AS visitor,
        vl.host_name AS host,
        un.unit_number AS unit,
        to_char(vl.entry_timestamp, 'HH24:MI') AS entry,
        CASE WHEN vl.exit_timestamp IS NOT NULL THEN to_char(vl.exit_timestamp, 'HH24:MI') ELSE NULL END AS exit,
        to_char(vl.entry_timestamp, 'DD Mon YYYY') AS date,
        CASE 
          WHEN vl.status = 'en_instalaciones' THEN 'En Instalaciones'
          WHEN vl.status = 'completada' THEN 'Completada'
          ELSE 'Rechazada'
        END AS status,
        INITCAP(vl.visit_type::text) AS type,
        COALESCE(vl.vehicle_plate, '') AS plate
      FROM vecilomas.visit_logs vl
      JOIN vecilomas.units un ON vl.unit_id = un.id
      WHERE ($1::uuid IS NULL OR vl.condominium_id = $1::uuid)
        AND ($2::text IS NULL OR vl.status::text = $2::text)
      ORDER BY vl.entry_timestamp DESC
      LIMIT 100;
    `
    const { rows } = await query(sql, [condoId || null, status ? status.toLowerCase() : null])
    return rows
  }

  /**
   * Registro de Entrada en Caseta (Check-in)
   */
  static async checkInVisit(data: {
    condominiumId: string
    unitId: string
    visitorName: string
    hostName: string
    visitType: VisitType
    vehiclePlate?: string
    accessPassId?: string
    guardUserId?: string
    notes?: string
  }) {
    return await withTransaction(async (client) => {
      // Si venía de un Pase QR de un solo uso, marcarlo como utilizado
      if (data.accessPassId) {
        await client.query(
          `UPDATE vecilomas.access_passes 
           SET status = 'utilizado' 
           WHERE id = $1 AND is_single_use = TRUE`,
          [data.accessPassId]
        )
      }

      const sql = `
        INSERT INTO vecilomas.visit_logs (
          condominium_id, unit_id, access_pass_id, guard_user_id, visitor_name, host_name, visit_type, vehicle_plate, status, identification_notes, entry_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::vecilomas.visit_type, $8, 'en_instalaciones', $9, NOW())
        RETURNING *;
      `
      const res = await client.query(sql, [
        data.condominiumId,
        data.unitId,
        data.accessPassId || null,
        data.guardUserId || null,
        data.visitorName,
        data.hostName,
        data.visitType.toLowerCase(),
        data.vehiclePlate || null,
        data.notes || null,
      ])
      return res.rows[0]
    })
  }

  /**
   * Registro de Salida en Caseta (Check-out)
   */
  static async checkOutVisit(visitId: number) {
    const sql = `
      UPDATE vecilomas.visit_logs
      SET exit_timestamp = NOW(),
          status = 'completada'
      WHERE id = $1
      RETURNING *;
    `
    const { rows } = await query(sql, [visitId])
    return rows[0]
  }
}
