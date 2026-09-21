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
  static async getAmenities(condoId?: string | number): Promise<any[]> {
    const sql = `
      SELECT 
        id,
        condominium_id AS "condominiumId",
        name,
        description,
        capacity,
        CASE WHEN cost_amount > 0 THEN concat('$', cost_amount, ' MXN') ELSE 'Sin costo' END AS rate,
        cost_amount AS "costAmount",
        deposit_amount AS "depositAmount",
        CASE WHEN deposit_amount > 0 THEN concat('$', deposit_amount, ' MXN en garantía') ELSE 'No aplica' END AS deposit,
        concat(to_char(opening_time, 'HH24:MI'), ' – ', to_char(closing_time, 'HH24:MI'), ' hrs') AS hours,
        max_hours_per_booking AS "maxHoursPerBooking",
        is_active AS available,
        COALESCE(image_url, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80') AS img,
        COALESCE(rules, '[]'::jsonb) AS rules
      FROM vecilomas.amenities
      WHERE is_active = TRUE
        AND ($1::integer IS NULL OR condominium_id = $1::integer)
      ORDER BY id ASC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null])
    return rows
  }

  /**
   * Crear nueva amenidad
   */
  static async createAmenity(data: {
    condominiumId?: string | number
    name: string
    description?: string
    capacity: number
    rate?: string
    costAmount?: number
    deposit?: string
    depositAmount?: number
    hours?: string
    openingTime?: string
    closingTime?: string
    maxHoursPerBooking?: number
    img?: string
    imageUrl?: string
    rules?: string[]
  }) {
    let openTime = data.openingTime || '08:00:00'
    let closeTime = data.closingTime || '22:00:00'
    if (data.hours && data.hours.includes('–')) {
      const parts = data.hours.replace('hrs', '').trim().split('–')
      if (parts[0]) openTime = parts[0].trim() + ':00'
      if (parts[1]) closeTime = parts[1].trim() + ':00'
    }

    const sql = `
      INSERT INTO vecilomas.amenities (
        condominium_id, name, description, capacity, cost_amount, deposit_amount,
        opening_time, closing_time, max_hours_per_booking, image_url, rules, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::time, $8::time, $9, $10, $11::jsonb, TRUE)
      RETURNING 
        id,
        condominium_id AS "condominiumId",
        name,
        description,
        capacity,
        CASE WHEN cost_amount > 0 THEN concat('$', cost_amount, ' MXN') ELSE 'Sin costo' END AS rate,
        cost_amount AS "costAmount",
        deposit_amount AS "depositAmount",
        CASE WHEN deposit_amount > 0 THEN concat('$', deposit_amount, ' MXN en garantía') ELSE 'No aplica' END AS deposit,
        concat(to_char(opening_time, 'HH24:MI'), ' – ', to_char(closing_time, 'HH24:MI'), ' hrs') AS hours,
        max_hours_per_booking AS "maxHoursPerBooking",
        is_active AS available,
        COALESCE(image_url, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80') AS img,
        COALESCE(rules, '[]'::jsonb) AS rules;
    `
    const { rows } = await query(sql, [
      Number(data.condominiumId) || 1,
      data.name,
      data.description || null,
      Number(data.capacity) || 20,
      Number(data.costAmount) || 0,
      Number(data.depositAmount) || 0,
      openTime,
      closeTime,
      Number(data.maxHoursPerBooking) || 4,
      data.img || data.imageUrl || null,
      JSON.stringify(data.rules || []),
    ])
    return rows[0]
  }

  /**
   * Actualizar amenidad
   */
  static async updateAmenity(id: number, data: {
    name?: string
    description?: string
    capacity?: number
    costAmount?: number
    depositAmount?: number
    hours?: string
    openingTime?: string
    closingTime?: string
    maxHoursPerBooking?: number
    img?: string
    rules?: string[]
    available?: boolean
  }) {
    let openTime = data.openingTime
    let closeTime = data.closingTime
    if (data.hours && data.hours.includes('–')) {
      const parts = data.hours.replace('hrs', '').trim().split('–')
      if (parts[0]) openTime = parts[0].trim() + ':00'
      if (parts[1]) closeTime = parts[1].trim() + ':00'
    }

    const sql = `
      UPDATE vecilomas.amenities
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        capacity = COALESCE($4, capacity),
        cost_amount = COALESCE($5, cost_amount),
        deposit_amount = COALESCE($6, deposit_amount),
        opening_time = COALESCE($7::time, opening_time),
        closing_time = COALESCE($8::time, closing_time),
        max_hours_per_booking = COALESCE($9, max_hours_per_booking),
        image_url = COALESCE($10, image_url),
        rules = COALESCE($11::jsonb, rules),
        is_active = COALESCE($12, is_active)
      WHERE id = $1
      RETURNING 
        id,
        condominium_id AS "condominiumId",
        name,
        description,
        capacity,
        CASE WHEN cost_amount > 0 THEN concat('$', cost_amount, ' MXN') ELSE 'Sin costo' END AS rate,
        cost_amount AS "costAmount",
        deposit_amount AS "depositAmount",
        CASE WHEN deposit_amount > 0 THEN concat('$', deposit_amount, ' MXN en garantía') ELSE 'No aplica' END AS deposit,
        concat(to_char(opening_time, 'HH24:MI'), ' – ', to_char(closing_time, 'HH24:MI'), ' hrs') AS hours,
        max_hours_per_booking AS "maxHoursPerBooking",
        is_active AS available,
        COALESCE(image_url, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80') AS img,
        COALESCE(rules, '[]'::jsonb) AS rules;
    `
    const { rows } = await query(sql, [
      id,
      data.name,
      data.description,
      data.capacity ? Number(data.capacity) : null,
      data.costAmount !== undefined ? Number(data.costAmount) : null,
      data.depositAmount !== undefined ? Number(data.depositAmount) : null,
      openTime || null,
      closeTime || null,
      data.maxHoursPerBooking ? Number(data.maxHoursPerBooking) : null,
      data.img || null,
      data.rules ? JSON.stringify(data.rules) : null,
      data.available !== undefined ? data.available : null,
    ])
    return rows[0]
  }

  /**
   * Eliminar amenidad
   */
  static async deleteAmenity(id: number) {
    const sql = `DELETE FROM vecilomas.amenities WHERE id = $1 RETURNING id;`
    const { rows } = await query(sql, [id])
    return rows[0]
  }

  /**
   * Lista de reservaciones con datos de la amenidad, residente y unidad en 1 solo JOIN
   */
  static async getBookings(condoId?: string | number, unitId?: string | number): Promise<BookingListItem[]> {
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
      WHERE ($1::integer IS NULL OR a.condominium_id = $1::integer)
        AND ($2::integer IS NULL OR b.unit_id = $2::integer)
      ORDER BY b.start_datetime DESC;
    `
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, unitId ? Number(unitId) : null])
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
    userId: string | number
    unitId: string | number
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *;
      `
      const res = await client.query(insertSql, [
        data.amenityId,
        Number(data.userId) || 1,
        Number(data.unitId) || 1,
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
    approvedByUserId?: string | number
  ) {
    const sql = `
      UPDATE vecilomas.bookings
      SET status = $2,
          approved_by_user_id = $3
      WHERE id = $1
      RETURNING *;
    `
    const { rows } = await query(sql, [bookingId, status.toLowerCase(), approvedByUserId ? Number(approvedByUserId) : null])
    return rows[0]
  }
}
