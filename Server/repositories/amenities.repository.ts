import { query, withTransaction } from '../config/db.ts'
import type { AmenityEntity, BookingStatus } from '../types/db.types.ts'

export interface BookingListItem {
  id: number
  amenityId: number
  amenity: string
  resident: string
  unit: string
  date: string
  time: string
  status: 'Aprobada' | 'Pendiente' | 'Cancelada' | 'Rechazada'
  guests: number
  cost: string
  rawStart: string
  rawEnd: string
}

export class AmenitiesRepository {
  /**
   * Catálogo de amenidades activas
   */
  static async getAmenities(condoId?: string): Promise<AmenityEntity[]> {
    const sql = `
      SELECT * FROM vecilomas.amenities
      WHERE is_active = TRUE
        AND ($1::uuid IS NULL OR condominium_id = $1::uuid)
      ORDER BY id ASC;
    `
    const { rows } = await query<AmenityEntity>(sql, [condoId || null])
    return rows
  }

  /**
   * Lista de reservaciones con datos de la amenidad, residente y unidad en 1 solo JOIN
   */
  static async getBookings(condoId?: string, unitId?: string): Promise<BookingListItem[]> {
    const sql = `
      SELECT 
        b.id,
        b.amenity_id AS "amenityId",
        a.name AS amenity,
        u.full_name AS resident,
        un.unit_number AS unit,
        to_char(b.start_datetime, 'DD Mon YYYY') AS date,
        concat(to_char(b.start_datetime, 'HH24:MI'), ' – ', to_char(b.end_datetime, 'HH24:MI')) AS time,
        CASE 
          WHEN b.status = 'aprobada' THEN 'Aprobada'
          WHEN b.status = 'pendiente' THEN 'Pendiente'
          WHEN b.status = 'rechazada' THEN 'Rechazada'
          ELSE 'Cancelada'
        END AS status,
        b.guests_count AS guests,
        CASE 
          WHEN b.total_cost > 0 THEN concat('$', b.total_cost, ' MXN')
          ELSE 'Sin costo'
        END AS cost,
        b.start_datetime AS "rawStart",
        b.end_datetime AS "rawEnd"
      FROM vecilomas.bookings b
      JOIN vecilomas.amenities a ON b.amenity_id = a.id
      JOIN vecilomas.users u ON b.user_id = u.id
      JOIN vecilomas.units un ON b.unit_id = un.id
      WHERE ($1::uuid IS NULL OR a.condominium_id = $1::uuid)
        AND ($2::uuid IS NULL OR b.unit_id = $2::uuid)
      ORDER BY b.start_datetime DESC;
    `
    const { rows } = await query(sql, [condoId || null, unitId || null])
    return rows
  }

  /**
   * Verifica disponibilidad de horario para una amenidad específica.
   * Utiliza el operador de traslape && sobre rangos de tiempo (tstzrange).
   */
  static async checkAvailability(
    amenityId: number,
    startDatetime: string,
    endDatetime: string,
    excludeBookingId?: number
  ): Promise<{ available: boolean; conflictReason?: string }> {
    const sql = `
      SELECT id, start_datetime, end_datetime
      FROM vecilomas.bookings
      WHERE amenity_id = $1
        AND status = 'aprobada'
        AND ($4::bigint IS NULL OR id != $4::bigint)
        AND tstzrange(start_datetime, end_datetime) && tstzrange($2::timestamptz, $3::timestamptz);
    `
    const { rows } = await query(sql, [amenityId, startDatetime, endDatetime, excludeBookingId || null])
    if (rows.length > 0) {
      return {
        available: false,
        conflictReason: 'El horario seleccionado ya se encuentra ocupado por otra reservación aprobada.',
      }
    }
    return { available: true }
  }

  /**
   * Crea una reservación de forma segura dentro de una transacción
   */
  static async createBooking(data: {
    amenityId: number
    userId: string
    unitId: string
    startDatetime: string
    endDatetime: string
    guestsCount: number
    totalCost?: number
    notes?: string
  }) {
    return await withTransaction(async (client) => {
      // Verificar aforo máximo
      const amenityRes = await client.query(
        'SELECT capacity, requires_approval, cost_amount FROM vecilomas.amenities WHERE id = $1',
        [data.amenityId]
      )
      const amenity = amenityRes.rows[0]
      if (!amenity) throw new Error('Amenidad no encontrada')

      if (data.guestsCount > amenity.capacity) {
        throw new Error(`El número de invitados (${data.guestsCount}) excede el aforo máximo (${amenity.capacity}).`)
      }

      // Validar no traslape
      const conflictRes = await client.query(
        `SELECT id FROM vecilomas.bookings 
         WHERE amenity_id = $1 AND status = 'aprobada'
           AND tstzrange(start_datetime, end_datetime) && tstzrange($2::timestamptz, $3::timestamptz)`,
        [data.amenityId, data.startDatetime, data.endDatetime]
      )
      if (conflictRes.rows.length > 0) {
        throw new Error('El horario ya no está disponible.')
      }

      const initialStatus = amenity.requires_approval ? 'pendiente' : 'aprobada'
      const cost = data.totalCost !== undefined ? data.totalCost : amenity.cost_amount

      const insertSql = `
        INSERT INTO vecilomas.bookings (
          amenity_id, user_id, unit_id, start_datetime, end_datetime, guests_count, total_cost, status, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vecilomas.booking_status, $9, NOW())
        RETURNING *;
      `
      const res = await client.query(insertSql, [
        data.amenityId,
        data.userId,
        data.unitId,
        data.startDatetime,
        data.endDatetime,
        data.guestsCount,
        cost,
        initialStatus,
        data.notes || null,
      ])
      return res.rows[0]
    })
  }

  /**
   * Actualiza el estatus de la reservación (Aprobar / Cancelar / Rechazar)
   */
  static async updateBookingStatus(
    bookingId: number,
    status: BookingStatus,
    approvedByUserId?: string
  ) {
    const sql = `
      UPDATE vecilomas.bookings
      SET status = $2::vecilomas.booking_status,
          approved_by_user_id = $3
      WHERE id = $1
      RETURNING *;
    `
    const { rows } = await query(sql, [bookingId, status.toLowerCase(), approvedByUserId || null])
    return rows[0]
  }
}
