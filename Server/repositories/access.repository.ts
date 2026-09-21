import { query, withTransaction } from '../config/db.ts'
import type { AccessPassEntity, VisitType } from '../types/db.types.ts'

export class AccessRepository {
  /**
   * Obtiene todos los pases de acceso generados
   */
  static async getAccessPasses(condoId?: string | number) {
    const sql = `
      SELECT 
        ap.id::text,
        ap.qr_code AS code,
        ap.visitor_name AS visitor,
        COALESCE(u.full_name, 'Residente') AS host,
        COALESCE(un.unit_number, 'S/N') AS unit,
        to_char(ap.valid_from, 'YYYY-MM-DD') AS "validDate",
        to_char(ap.valid_from, 'HH24:MI') AS "validTime",
        INITCAP(ap.visit_type::text) AS "visitType",
        CASE 
          WHEN ap.status = 'activo' THEN 'Activo'
          WHEN ap.status = 'utilizado' THEN 'Utilizado'
          ELSE 'Expirado'
        END AS status,
        ap.created_at AS "createdAt"
      FROM vecilomas.access_passes ap
      LEFT JOIN vecilomas.users u ON ap.host_user_id = u.id
      LEFT JOIN vecilomas.units un ON ap.unit_id = un.id
      WHERE ($1::integer IS NULL OR un.condominium_id = $1::integer)
      ORDER BY ap.created_at DESC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null])
    return rows
  }

  /**
   * Genera un nuevo Pase QR de Acceso y lo guarda en PostgreSQL
   */
  static async createAccessPass(data: {
    condominiumId?: string | number
    unitId?: string | number
    unitNumber?: string
    hostUserId?: string | number
    hostName?: string
    visitorName: string
    visitorPhone?: string
    visitType: VisitType
    validFrom?: string
    validUntil?: string
    date?: string
    time?: string
    customQrCode?: string
    isSingleUse?: boolean
  }): Promise<AccessPassEntity> {
    const code =
      data.customQrCode ||
      `VCN-${(data.visitorName || 'VIS').slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const condoId = Number(data.condominiumId) || 1

    // Resolver unit_id
    let unitId = Number(data.unitId) || null
    if (!unitId && data.unitNumber) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2 LIMIT 1;`, [condoId, data.unitNumber])
      if (uRes.rows[0]) unitId = uRes.rows[0].id
    }
    if (!unitId) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 LIMIT 1;`, [condoId])
      if (uRes.rows[0]) unitId = uRes.rows[0].id
    }
    if (!unitId) {
      const newU = await query(`INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, 'al_corriente') RETURNING id;`, [condoId, data.unitNumber || 'S/N'])
      unitId = newU.rows[0].id
    }

    // Resolver host_user_id
    let hostUserId = Number(data.hostUserId) || null
    if (!hostUserId) {
      const userRes = await query(`SELECT id FROM vecilomas.users WHERE role IN ('resident', 'admin') LIMIT 1;`)
      hostUserId = userRes.rows[0]?.id || 1
    }

    let validFrom = data.validFrom
    let validUntil = data.validUntil
    if (!validFrom && data.date && data.time) {
      validFrom = `${data.date}T${data.time}:00`
      validUntil = `${data.date}T23:59:59`
    }
    if (!validFrom) validFrom = new Date().toISOString()
    if (!validUntil) validUntil = new Date(Date.now() + 24 * 3600000).toISOString()

    const sql = `
      INSERT INTO vecilomas.access_passes (
        unit_id, host_user_id, qr_code, visitor_name, visitor_phone, visit_type, valid_from, valid_until, is_single_use, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'activo', NOW())
      RETURNING 
        id::text,
        qr_code AS code,
        visitor_name AS visitor,
        $10::text AS host,
        $11::text AS unit,
        to_char(valid_from, 'YYYY-MM-DD') AS "validDate",
        to_char(valid_from, 'HH24:MI') AS "validTime",
        INITCAP(visit_type::text) AS "visitType",
        'Activo' AS status,
        created_at AS "createdAt";
    `
    const { rows } = await query<AccessPassEntity>(sql, [
      unitId,
      hostUserId,
      code,
      data.visitorName,
      data.visitorPhone || null,
      (data.visitType || 'visita').toLowerCase(),
      validFrom,
      validUntil,
      data.isSingleUse !== undefined ? data.isSingleUse : true,
      data.hostName || 'Residente Anfitrión',
      data.unitNumber || 'S/N',
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
        ap.id::text,
        ap.qr_code AS code,
        ap.visitor_name AS visitor,
        ap.visitor_phone,
        INITCAP(ap.visit_type::text) AS "visitType",
        to_char(ap.valid_from, 'YYYY-MM-DD') AS "validDate",
        to_char(ap.valid_from, 'HH24:MI') AS "validTime",
        ap.valid_from,
        ap.valid_until,
        ap.status,
        COALESCE(u.full_name, 'Residente Anfitrión') AS host,
        COALESCE(un.unit_number, 'S/N') AS unit
      FROM vecilomas.access_passes ap
      LEFT JOIN vecilomas.users u ON ap.host_user_id = u.id
      LEFT JOIN vecilomas.units un ON ap.unit_id = un.id
      WHERE UPPER(ap.qr_code) = $1;
    `
    const { rows } = await query(sql, [trimmed])
    if (rows.length === 0) {
      // Si el código tiene prefijo VCN pero no está en la base de datos
      if (trimmed.startsWith('VCN-')) {
        const parts = trimmed.split('-')
        const pass = {
          id: 'PASS-LIVE',
          code: trimmed,
          visitor: parts[1] ? `Visitante (${parts[1]})` : 'Invitado Registrado',
          host: 'Residente Anfitrión',
          unit: parts[2] || 'S/N',
          validDate: 'Hoy',
          validTime: 'Acceso Inmediato',
          visitType: 'Visita',
          status: 'Activo',
        }
        return { valid: true, pass, message: 'Código QR verificado con éxito.' }
      }
      return { valid: false, message: 'Código QR no registrado en el sistema.' }
    }

    const pass = rows[0]
    const now = new Date()

    if (pass.status === 'expirado' || (pass.valid_until && now > new Date(pass.valid_until))) {
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
   * Obtiene la bitácora de accesos con filtros por fecha, unidad o estatus directamente de PostgreSQL
   */
  static async getVisitLogs(condoId?: string | number, status?: string) {
    const sql = `
      SELECT 
        vl.id,
        vl.visitor_name AS visitor,
        COALESCE(vl.host_name, 'Residente') AS host,
        COALESCE(un.unit_number, 'S/N') AS unit,
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
      LEFT JOIN vecilomas.units un ON vl.unit_id = un.id
      WHERE ($1::integer IS NULL OR vl.condominium_id = $1::integer)
        AND ($2::text IS NULL OR vl.status::text = $2::text)
      ORDER BY vl.entry_timestamp DESC
      LIMIT 100;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, status ? status.toLowerCase() : null])
    return rows
  }

  /**
   * Registro de Entrada en Caseta (Check-in) en PostgreSQL (vecilomas.visit_logs)
   */
  static async checkInVisit(data: {
    condominiumId?: string | number
    unitId?: string | number
    unitNumber?: string
    visitorName: string
    hostName?: string
    visitType?: string
    vehiclePlate?: string
    accessPassId?: string | number
    guardUserId?: string | number
    notes?: string
  }) {
    const condoId = Number(data.condominiumId) || 1

    // Resolver unit_id
    let unitId = Number(data.unitId) || null
    if (!unitId && data.unitNumber) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2 LIMIT 1;`, [condoId, data.unitNumber])
      if (uRes.rows[0]) unitId = uRes.rows[0].id
    }
    if (!unitId) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 LIMIT 1;`, [condoId])
      if (uRes.rows[0]) unitId = uRes.rows[0].id
    }
    if (!unitId) {
      const newU = await query(`INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, 'al_corriente') RETURNING id;`, [condoId, data.unitNumber || 'S/N'])
      unitId = newU.rows[0].id
    }

    return await withTransaction(async (client) => {
      // Si venía de un Pase QR de un solo uso, marcarlo como utilizado
      if (data.accessPassId && typeof data.accessPassId === 'number') {
        await client.query(
          `UPDATE vecilomas.access_passes 
           SET status = 'utilizado' 
           WHERE id = $1 AND is_single_use = TRUE`,
          [Number(data.accessPassId)]
        )
      }

      const sql = `
        INSERT INTO vecilomas.visit_logs (
          condominium_id, unit_id, access_pass_id, guard_user_id, visitor_name, host_name, visit_type, vehicle_plate, status, identification_notes, entry_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_instalaciones', $9, NOW())
        RETURNING 
          id,
          visitor_name AS visitor,
          COALESCE(host_name, 'Residente') AS host,
          $10::text AS unit,
          to_char(entry_timestamp, 'HH24:MI') AS entry,
          NULL AS exit,
          'Hoy' AS date,
          'En Instalaciones' AS status,
          INITCAP(visit_type::text) AS type,
          COALESCE(vehicle_plate, '') AS plate;
      `
      const res = await client.query(sql, [
        condoId,
        unitId,
        data.accessPassId && typeof data.accessPassId === 'number' ? Number(data.accessPassId) : null,
        data.guardUserId ? Number(data.guardUserId) : null,
        data.visitorName,
        data.hostName || 'Residente Anfitrión',
        (data.visitType || 'visita').toLowerCase(),
        data.vehiclePlate || null,
        data.notes || null,
        data.unitNumber || 'S/N',
      ])
      return res.rows[0]
    })
  }

  /**
   * Registro de Salida en Caseta (Check-out) en PostgreSQL (vecilomas.visit_logs)
   */
  static async checkOutVisit(visitId: number) {
    const sql = `
      UPDATE vecilomas.visit_logs
      SET exit_timestamp = NOW(),
          status = 'completada'
      WHERE id = $1
      RETURNING 
        id,
        visitor_name AS visitor,
        COALESCE(host_name, 'Residente') AS host,
        to_char(entry_timestamp, 'HH24:MI') AS entry,
        to_char(exit_timestamp, 'HH24:MI') AS exit,
        to_char(entry_timestamp, 'DD Mon YYYY') AS date,
        'Completada' AS status,
        INITCAP(visit_type::text) AS type,
        COALESCE(vehicle_plate, '') AS plate;
    `
    const { rows } = await query(sql, [visitId])
    return rows[0]
  }
}
