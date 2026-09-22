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
    condominiumId: string | number
    reportedByUserId: string | number
    unitId?: string | number
    location: string
    category: TicketCategory
    title: string
    description: string
    priority: TicketPriority
  }) {
    const ticketFolio = `TKT-${Math.floor(2025 + Math.random() * 500)}`

    const sql = `
      INSERT INTO vecilomas.maintenance_tickets (
        ticket_number, condominium_id, unit_id, reported_by_user_id, location, category, title, description, priority, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente', NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      ticketFolio,
      Number(data.condominiumId) || 1,
      data.unitId ? Number(data.unitId) : null,
      Number(data.reportedByUserId) || 1,
      data.location,
      data.category,
      data.title,
      data.description,
      data.priority,
    ])
    return rows[0]
  }

  /**
   * Actualiza el estatus o asignación de un ticket
   */
  static async updateTicketStatus(
    ticketNumber: string,
    status: TicketStatus,
    assignedTo?: string
  ) {
    const sql = `
      UPDATE vecilomas.maintenance_tickets
      SET status = $2,
          assigned_to = COALESCE($3, assigned_to),
          resolved_at = CASE WHEN $2 = 'resuelto' THEN NOW() ELSE resolved_at END
      WHERE ticket_number = $1
      RETURNING *;
    `
    const { rows } = await query(sql, [ticketNumber, status.toLowerCase(), assignedTo || null])
    return rows[0]
  }
}
