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
  static async getFeeStatements(condoId?: string, unitId?: string): Promise<FeeStatementListItem[]> {
    const sql = `
      SELECT 
        fs.id,
        un.unit_number AS unit,
        COALESCE(u.full_name, 'Propietario / Sin asignar') AS resident,
        fs.description AS concept,
        fs.amount,
        CASE 
          WHEN fs.status = 'pagada' THEN 'Pagada'
          WHEN fs.status = 'vencida' THEN 'Vencida'
          ELSE 'Pendiente'
        END AS status,
        CASE 
          WHEN p.paid_at IS NOT NULL THEN to_char(p.paid_at, 'DD Mon YYYY')
          ELSE '—'
        END AS date,
        to_char(fs.due_date, 'DD Mon YYYY') AS "dueDate",
        CASE 
          WHEN p.payment_method = 'spei' THEN 'Transferencia SPEI'
          WHEN p.payment_method = 'tarjeta_debito' THEN 'Tarjeta de Débito'
          WHEN p.payment_method = 'tarjeta_credito' THEN 'Tarjeta de Crédito'
          WHEN p.payment_method = 'efectivo_oficina' THEN 'Efectivo en Oficina'
          ELSE NULL
        END AS "paymentMethod"
      FROM vecilomas.fee_statements fs
      JOIN vecilomas.units un ON fs.unit_id = un.id
      LEFT JOIN vecilomas.users u ON un.id = u.unit_id AND u.role = 'resident'
      LEFT JOIN LATERAL (
        SELECT payment_method, paid_at 
        FROM vecilomas.payments 
        WHERE fee_statement_id = fs.id 
        ORDER BY paid_at DESC 
        LIMIT 1
      ) p ON TRUE
      WHERE ($1::uuid IS NULL OR un.condominium_id = $1::uuid)
        AND ($2::uuid IS NULL OR fs.unit_id = $2::uuid)
      ORDER BY fs.due_date DESC;
    `
    const { rows } = await query(sql, [condoId || null, unitId || null])
    return rows
  }

  /**
   * Registra un pago de forma atómica:
   * 1. Inserta la transacción en `payments`
   * 2. Actualiza el estatus del cargo a 'pagada'
   * 3. Verifica si la unidad ya no tiene adeudos vencidos y la pone 'al_corriente'
   */
  static async registerPayment(data: {
    feeStatementId: string
    userId: string
    amountPaid: number
    paymentMethod: PaymentMethod
    referenceNumber?: string
    voucherUrl?: string
    verifiedByUserId?: string
  }) {
    return await withTransaction(async (client) => {
      // 1. Insertar pago
      const insertPaymentSql = `
        INSERT INTO vecilomas.payments (
          fee_statement_id, user_id, amount_paid, payment_method, reference_number, voucher_url, verified_by_user_id, verified_at, status, paid_at
        ) VALUES ($1, $2, $3, $4::vecilomas.payment_method, $5, $6, $7, NOW(), 'aprobado', NOW())
        RETURNING *;
      `
      const paymentRes = await client.query(insertPaymentSql, [
        data.feeStatementId,
        data.userId,
        data.amountPaid,
        data.paymentMethod,
        data.referenceNumber || null,
        data.voucherUrl || null,
        data.verifiedByUserId || null,
      ])

      // 2. Actualizar estado de cuenta a pagada
      const updateFeeSql = `
        UPDATE vecilomas.fee_statements
        SET status = 'pagada'
        WHERE id = $1
        RETURNING unit_id;
      `
      const feeRes = await client.query(updateFeeSql, [data.feeStatementId])
      const unitId = feeRes.rows[0]?.unit_id

      // 3. Revisar si quedan cuotas vencidas en la unidad
      if (unitId) {
        const checkPendingSql = `
          SELECT COUNT(*) as pending_count 
          FROM vecilomas.fee_statements 
          WHERE unit_id = $1 AND status = 'vencida';
        `
        const checkRes = await client.query(checkPendingSql, [unitId])
        if (Number(checkRes.rows[0]?.pending_count) === 0) {
          await client.query(`UPDATE vecilomas.units SET status = 'al_corriente' WHERE id = $1;`, [unitId])
        }
      }

      return paymentRes.rows[0]
    })
  }

  /**
   * Obtiene los tickets de mantenimiento con información agregada
   */
  static async getMaintenanceTickets(condoId?: string, unitId?: string): Promise<MaintenanceTicketListItem[]> {
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
      WHERE ($1::uuid IS NULL OR mt.condominium_id = $1::uuid)
        AND ($2::uuid IS NULL OR mt.unit_id = $2::uuid)
      ORDER BY mt.created_at DESC;
    `
    const { rows } = await query(sql, [condoId || null, unitId || null])
    return rows
  }

  /**
   * Crea un nuevo ticket de soporte / falla
   */
  static async createTicket(data: {
    condominiumId: string
    reportedByUserId: string
    unitId?: string
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
      ) VALUES ($1, $2, $3, $4, $5, $6::vecilomas.ticket_category, $7, $8, $9::vecilomas.ticket_priority, 'pendiente', NOW())
      RETURNING *;
    `
    const { rows } = await query(sql, [
      ticketFolio,
      data.condominiumId,
      data.unitId || null,
      data.reportedByUserId,
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
      SET status = $2::vecilomas.ticket_status,
          assigned_to = COALESCE($3, assigned_to),
          resolved_at = CASE WHEN $2 = 'resuelto' THEN NOW() ELSE resolved_at END
      WHERE ticket_number = $1
      RETURNING *;
    `
    const { rows } = await query(sql, [ticketNumber, status.toLowerCase(), assignedTo || null])
    return rows[0]
  }
}
