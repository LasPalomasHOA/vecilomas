import { query, withTransaction } from '../config/db.ts'
import type { PaymentMethod, TicketPriority, TicketStatus, TicketCategory } from '../types/db.types.ts'

export interface FeeStatementListItem {
  id: string
  unit: string
  resident: string
  concept: string
  amount: number
  status: 'Pagada' | 'Pendiente' | 'Vencida'
  date: string
  dueDate: string
  paymentMethod?: string
}

export interface MaintenanceTicketListItem {
  id: string
  location: string
  reporter: string
  unit?: string
  issue: string
  priority: 'Alta' | 'Media' | 'Baja'
  status: 'Pendiente' | 'En Proceso' | 'Resuelto'
  date: string
  assignedTo?: string
  notes?: string
}

export class FinanceRepository {
  /**
   * Obtiene los estados de cuenta con los datos de residente y último método de pago
   */
  static async getFeeStatements(condoId?: string | number, unitId?: string | number): Promise<FeeStatementListItem[]> {
    const sql = `
      SELECT 
        fs.id::text,
        un.unit_number AS unit,
        COALESCE(
          (SELECT u.full_name FROM vecilomas.users u WHERE u.unit_id = un.id LIMIT 1),
          'Propietario / Sin asignar'
        ) AS resident,
        fs.description AS concept,
        fs.amount::float AS amount,
        CASE 
          WHEN lower(fs.status) LIKE 'pagad%' THEN 'Pagada'
          WHEN lower(fs.status) LIKE 'vencid%' THEN 'Vencida'
          ELSE 'Pendiente'
        END AS status,
        CASE 
          WHEN p.paid_at IS NOT NULL THEN to_char(p.paid_at, 'DD Mon YYYY')
          ELSE '—'
        END AS date,
        to_char(fs.due_date, 'DD Mon YYYY') AS "dueDate",
        CASE 
          WHEN p.payment_method IN ('spei', 'Transferencia SPEI') THEN 'Transferencia SPEI'
          WHEN p.payment_method IN ('tarjeta_debito', 'tarjeta_credito', 'Tarjeta de Débito / Crédito') THEN 'Tarjeta de Débito / Crédito'
          WHEN p.payment_method IN ('efectivo_oficina', 'Efectivo en Administración') THEN 'Efectivo en Administración'
          WHEN p.payment_method = 'cheque' THEN 'Cheque'
          ELSE p.payment_method
        END AS "paymentMethod"
      FROM vecilomas.fee_statements fs
      JOIN vecilomas.units un ON fs.unit_id = un.id
      LEFT JOIN LATERAL (
        SELECT payment_method, paid_at 
        FROM vecilomas.payments 
        WHERE fee_statement_id = fs.id 
        ORDER BY paid_at DESC 
        LIMIT 1
      ) p ON TRUE
      WHERE ($1::integer IS NULL OR un.condominium_id = $1::integer)
        AND ($2::integer IS NULL OR fs.unit_id = $2::integer)
      ORDER BY fs.due_date DESC, fs.id DESC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, unitId ? Number(unitId) : null])
    return rows
  }

  /**
   * Registra un pago de forma atómica:
   * 1. Inserta la transacción en `payments`
   * 2. Actualiza el estatus del cargo a 'pagada'
   * 3. Verifica si la unidad ya no tiene adeudos vencidos y la pone 'al_corriente'
   */
  static async registerPayment(data: {
    feeStatementId: string | number
    userId?: string | number
    amountPaid?: number
    paymentMethod?: string
    referenceNumber?: string
    voucherUrl?: string
    verifiedByUserId?: string | number
  }) {
    const feeId = Number(data.feeStatementId)

    return await withTransaction(async (client) => {
      // 1. Obtener estado de cuenta
      const feeRes = await client.query(
        'SELECT id, unit_id, amount FROM vecilomas.fee_statements WHERE id = $1',
        [feeId]
      )
      if (!feeRes.rows[0]) throw new Error(`Estado de cuenta con ID ${feeId} no encontrado.`)
      const fee = feeRes.rows[0]

      // 2. Resolver user_id
      let userId: number | null = null
      if (data.userId) {
        const uCheck = await client.query('SELECT id FROM vecilomas.users WHERE id = $1 LIMIT 1;', [Number(data.userId)])
        if (uCheck.rows[0]) userId = uCheck.rows[0].id
      }
      if (!userId && fee.unit_id) {
        const uRes = await client.query('SELECT id FROM vecilomas.users WHERE unit_id = $1 LIMIT 1;', [fee.unit_id])
        if (uRes.rows[0]) userId = uRes.rows[0].id
      }
      if (!userId) {
        const uFallback = await client.query(`SELECT id FROM vecilomas.users WHERE role IN ('resident', 'admin') LIMIT 1;`)
        userId = uFallback.rows[0]?.id || 1
      }

      // 3. Normalizar método de pago
      let method = data.paymentMethod || 'spei'
      if (method.includes('SPEI') || method.includes('Transferencia')) method = 'spei'
      else if (method.includes('Tarjeta') || method.includes('Débito') || method.includes('Crédito')) method = 'tarjeta_debito'
      else if (method.includes('Efectivo')) method = 'efectivo_oficina'
      else if (method.includes('Cheque')) method = 'cheque'

      const amountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : Number(fee.amount)

      // 4. Insertar pago
      const insertPaymentSql = `
        INSERT INTO vecilomas.payments (
          fee_statement_id, user_id, amount_paid, payment_method, reference_number, voucher_url, verified_by_user_id, verified_at, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'aprobado', NOW())
        RETURNING *;
      `
      const paymentRes = await client.query(insertPaymentSql, [
        feeId,
        userId,
        amountPaid,
        method,
        data.referenceNumber || null,
        data.voucherUrl || null,
        data.verifiedByUserId ? Number(data.verifiedByUserId) : null,
      ])

      // 5. Actualizar estado de cuenta a pagada
      const updateFeeSql = `
        UPDATE vecilomas.fee_statements
        SET status = 'pagada'
        WHERE id = $1
        RETURNING unit_id;
      `
      await client.query(updateFeeSql, [feeId])

      // 6. Revisar si quedan cuotas vencidas en la unidad
      if (fee.unit_id) {
        const checkPendingSql = `
          SELECT COUNT(*) as pending_count 
          FROM vecilomas.fee_statements 
          WHERE unit_id = $1 AND status = 'vencida';
        `
        const checkRes = await client.query(checkPendingSql, [fee.unit_id])
        if (Number(checkRes.rows[0]?.pending_count) === 0) {
          await client.query(`UPDATE vecilomas.units SET status = 'al_corriente' WHERE id = $1;`, [fee.unit_id])
        }
      }

      return paymentRes.rows[0]
    })
  }

  /**
   * Obtiene los tickets de mantenimiento con información agregada
   */
  static async getMaintenanceTickets(condoId?: string | number, unitId?: string | number): Promise<MaintenanceTicketListItem[]> {
    const sql = `
      SELECT 
        mt.ticket_number AS id,
        mt.location,
        COALESCE(u.full_name, 'Administración') AS reporter,
        un.unit_number AS unit,
        mt.description AS issue,
        CASE 
          WHEN mt.priority = 'alta' OR mt.priority = 'urgente' THEN 'Alta'
          WHEN mt.priority = 'media' THEN 'Media'
          ELSE 'Baja'
        END AS priority,
        CASE 
          WHEN mt.status = 'resuelto' THEN 'Resuelto'
          WHEN mt.status = 'en_proceso' THEN 'En Proceso'
          ELSE 'Pendiente'
        END AS status,
        to_char(mt.created_at, 'DD Mon YYYY') AS date,
        COALESCE(mt.assigned_to, '') AS "assignedTo",
        mt.title AS notes
      FROM vecilomas.maintenance_tickets mt
      LEFT JOIN vecilomas.users u ON mt.reported_by_user_id = u.id
      LEFT JOIN vecilomas.units un ON mt.unit_id = un.id
      WHERE ($1::integer IS NULL OR mt.condominium_id = $1::integer)
        AND ($2::integer IS NULL OR mt.unit_id = $2::integer)
      ORDER BY mt.created_at DESC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, unitId ? Number(unitId) : null])
    return rows
  }

  /**
   * Crea un nuevo ticket de soporte / falla
   */
  static async createTicket(data: {
    condominiumId?: string | number
    condoId?: string | number
    reportedByUserId?: string | number
    reporter?: string
    reporterName?: string
    unitId?: string | number
    unit?: string
    unitNumber?: string
    location: string
    category?: TicketCategory | string
    title?: string
    issue?: string
    description?: string
    priority?: TicketPriority | string
  }) {
    const condoId = Number(data.condominiumId || data.condoId) || 1

    // 1. Resolver unit_id si no viene directo
    let resolvedUnitId = data.unitId ? Number(data.unitId) : null
    const unitName = data.unit || data.unitNumber
    if (!resolvedUnitId && unitName) {
      const cleanUnit = unitName.replace(/[()]/g, '').trim()
      const unitRes = await query(
        `SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND (unit_number = $2 OR unit_number ILIKE $3) LIMIT 1;`,
        [condoId, cleanUnit, `%${cleanUnit}%`]
      )
      if (unitRes.rows.length > 0) {
        resolvedUnitId = unitRes.rows[0].id
      }
    }
    if (!resolvedUnitId) {
      const fallbackUnit = await query(
        `SELECT id FROM vecilomas.units WHERE condominium_id = $1 LIMIT 1;`,
        [condoId]
      )
      if (fallbackUnit.rows.length > 0) {
        resolvedUnitId = fallbackUnit.rows[0].id
      }
    }

    // 2. Resolver reported_by_user_id si no viene directo
    let resolvedUserId = data.reportedByUserId ? Number(data.reportedByUserId) : null
    const repName = data.reporter || data.reporterName
    if (!resolvedUserId && repName) {
      const cleanName = repName.split('(')[0].trim()
      const userRes = await query(
        `SELECT id FROM vecilomas.users WHERE full_name ILIKE $1 LIMIT 1;`,
        [`%${cleanName}%`]
      )
      if (userRes.rows.length > 0) {
        resolvedUserId = userRes.rows[0].id
      }
    }
    if (!resolvedUserId) {
      const fallbackUser = await query(`SELECT id FROM vecilomas.users ORDER BY id ASC LIMIT 1;`)
      resolvedUserId = fallbackUser.rows[0]?.id || 1
    }

    // 3. Generar número de ticket correlativo y único
    const countRes = await query(
      `SELECT count(*)::int as c FROM vecilomas.maintenance_tickets WHERE created_at >= date_trunc('year', NOW());`
    )
    const nextSeq = (countRes.rows[0]?.c || 0) + 1
    const currentYear = new Date().getFullYear()
    let ticketFolio = `TCK-${currentYear}-${String(nextSeq).padStart(3, '0')}`

    // Verificar si ya existe por alguna razón
    const checkExists = await query(
      `SELECT id FROM vecilomas.maintenance_tickets WHERE ticket_number = $1 LIMIT 1;`,
      [ticketFolio]
    )
    if (checkExists.rows.length > 0) {
      ticketFolio = `TCK-${currentYear}-${String(nextSeq + Math.floor(Math.random() * 900) + 10).padStart(3, '0')}`
    }

    // 4. Normalizar prioridad y textos
    const rawPriority = String(data.priority || 'media').toLowerCase()
    const dbPriority = (rawPriority.includes('alt') || rawPriority.includes('urg'))
      ? 'alta'
      : rawPriority.includes('baj')
      ? 'baja'
      : 'media'

    const title = data.title || data.issue || data.location || 'Reporte de Mantenimiento'
    const description = data.description || data.issue || data.title || 'Sin descripción detallada'
    const category = data.category || 'General'

    const sql = `
      INSERT INTO vecilomas.maintenance_tickets (
        ticket_number, condominium_id, unit_id, reported_by_user_id, location, category, title, description, priority, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente', NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      ticketFolio,
      condoId,
      resolvedUnitId,
      resolvedUserId,
      data.location || 'Áreas Comunes',
      category,
      title,
      description,
      dbPriority,
    ])

    const created = rows[0]
    return {
      id: created.ticket_number,
      location: created.location,
      reporter: repName || 'Administración General',
      unit: unitName || undefined,
      issue: created.description,
      priority: created.priority === 'alta' ? 'Alta' : created.priority === 'baja' ? 'Baja' : 'Media',
      status: 'Pendiente' as TicketStatus,
      date: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      assignedTo: created.assigned_to || '',
      notes: created.title,
    }
  }

  /**
   * Actualiza el estatus o asignación de un ticket
   */
  static async updateTicketStatus(
    ticketNumberOrId: string | number,
    status: TicketStatus | string,
    assignedTo?: string
  ) {
    const rawStatus = (status || '').toLowerCase()
    let dbStatus = 'pendiente'
    if (rawStatus.includes('proc') || rawStatus.includes('proceso') || rawStatus.includes('en_proceso')) {
      dbStatus = 'en_proceso'
    } else if (rawStatus.includes('resuel') || rawStatus.includes('resolv') || rawStatus.includes('resuelto')) {
      dbStatus = 'resuelto'
    } else if (rawStatus.includes('canc')) {
      dbStatus = 'cancelado'
    }

    const sql = `
      UPDATE vecilomas.maintenance_tickets
      SET status = $2::varchar,
          assigned_to = COALESCE($3::varchar, assigned_to),
          resolved_at = CASE WHEN $2::varchar = 'resuelto' THEN NOW() ELSE resolved_at END
      WHERE ticket_number = $1::varchar OR id::text = $1::varchar
      RETURNING *;
    `
    const { rows } = await query(sql, [String(ticketNumberOrId), dbStatus, assignedTo || null])
    return rows[0]
  }
}


