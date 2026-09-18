import { query } from '../config/db.ts'

export class AuditRepository {
  static async log(data: {
    userId?: string
    action: string
    entityName: string
    entityId: string
    previousState?: any
    newState?: any
    ipAddress?: string
  }) {
    try {
      const sql = `
        INSERT INTO vecilomas.audit_logs (
          user_id, action, entity_name, entity_id, previous_state, new_state, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
      `
      await query(sql, [
        data.userId || null,
        data.action,
        data.entityName,
        data.entityId,
        data.previousState ? JSON.stringify(data.previousState) : null,
        data.newState ? JSON.stringify(data.newState) : null,
        data.ipAddress || null,
      ])
    } catch (err) {
      console.error('[Audit Log Error]:', err)
    }
  }
}
