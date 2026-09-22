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
   * Lista de reservaciones con datos de la amenidad, residente y unidad
   */
  static async getBookings(condoId?: string | number, unitId?: string | number): Promise<BookingListItem[]> {
    const sql = `
      SELECT 
        b.id,
        b.amenity_id AS "amenityId",
        COALESCE(a.name, 'Amenidad') AS amenity,
        COALESCE(u.full_name, 'Residente') AS resident,
        COALESCE(un.unit_number, 'S/N') AS unit,
        to_char(b.start_datetime, 'YYYY-MM-DD') AS date,
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
        COALESCE(b.notes, '') AS "specialRequests",
        b.created_at AS "createdAt",
        b.start_datetime AS "rawStart",
        b.end_datetime AS "rawEnd"
      FROM vecilomas.bookings b
      LEFT JOIN vecilomas.amenities a ON b.amenity_id = a.id
      LEFT JOIN vecilomas.users u ON b.user_id = u.id
      LEFT JOIN vecilomas.units un ON b.unit_id = un.id
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
    condominiumId?: string | number
    amenityId: number | string
    userId?: string | number
    unitId?: string | number
    unitNumber?: string
    residentName?: string
    startDatetime?: string
    endDatetime?: string
    date?: string
    time?: string
    guestsCount?: number
    guests?: number
    totalCost?: number
    notes?: string
    specialRequests?: string
  }) {
    const amenityId = Number(data.amenityId) || 1
    const condoId = Number(data.condominiumId) || 1

    return await withTransaction(async (client) => {
      // 1. Obtener amenidad y verificar capacidad
      const amenityRes = await client.query(
        'SELECT id, capacity, requires_approval, cost_amount, condominium_id FROM vecilomas.amenities WHERE id = $1',
        [amenityId]
      )
      const amenity = amenityRes.rows[0]
      if (!amenity) throw new Error(`Amenidad con ID ${amenityId} no encontrada.`)

      const guestsCount = Number(data.guestsCount || data.guests || 2)
      if (guestsCount > amenity.capacity) {
        throw new Error(`El número de invitados (${guestsCount}) excede el aforo máximo (${amenity.capacity}).`)
      }

      // 2. Resolver unit_id válido en vecilomas.units
      let unitId: number | null = null
      if (data.unitId) {
        const uCheck = await client.query('SELECT id FROM vecilomas.units WHERE id = $1 LIMIT 1;', [Number(data.unitId)])
        if (uCheck.rows[0]) unitId = uCheck.rows[0].id
      }
      if (!unitId && data.unitNumber) {
        const uRes = await client.query(
          `SELECT id FROM vecilomas.units WHERE (unit_number = $1 OR unit_number = $2 OR unit_number ILIKE $3) LIMIT 1;`,
          [data.unitNumber, data.unitNumber.replace(/[^a-zA-Z0-9]/g, ''), `%${data.unitNumber}%`]
        )
        if (uRes.rows[0]) unitId = uRes.rows[0].id
      }
      if (!unitId) {
        const uFirst = await client.query('SELECT id FROM vecilomas.units WHERE condominium_id = $1 LIMIT 1;', [condoId])
        if (uFirst.rows[0]) unitId = uFirst.rows[0].id
      }
      if (!unitId) {
        const newU = await client.query(
          `INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, 'al_corriente') RETURNING id;`,
          [condoId, data.unitNumber || '101']
        )
        unitId = newU.rows[0].id
      }

      // 3. Resolver user_id válido en vecilomas.users
      let userId: number | null = null
      if (data.userId) {
        const userCheck = await client.query('SELECT id FROM vecilomas.users WHERE id = $1 LIMIT 1;', [Number(data.userId)])
        if (userCheck.rows[0]) userId = userCheck.rows[0].id
      }
      if (!userId && data.residentName) {
        const userRes = await client.query('SELECT id FROM vecilomas.users WHERE full_name ILIKE $1 LIMIT 1;', [`%${data.residentName}%`])
        if (userRes.rows[0]) userId = userRes.rows[0].id
      }
      if (!userId) {
        const userFallback = await client.query(`SELECT id FROM vecilomas.users WHERE role IN ('resident', 'admin') LIMIT 1;`)
        userId = userFallback.rows[0]?.id || 1
      }

      // 4. Determinar startDatetime y endDatetime
      let startDatetime = data.startDatetime
      let endDatetime = data.endDatetime

      if ((!startDatetime || !endDatetime) && data.date && data.time) {
        const parts = data.time.replace(/hrs/g, '').split(/[–-]/).map(s => s.trim())
        const startH = parts[0] ? (parts[0].length === 5 ? parts[0] : parts[0].padStart(5, '0')) : '08:00'
        const endH = parts[1] ? (parts[1].length === 5 ? parts[1] : parts[1].padStart(5, '0')) : '10:00'
        startDatetime = `${data.date}T${startH}:00`
        endDatetime = `${data.date}T${endH}:00`
      }

      if (!startDatetime) startDatetime = new Date().toISOString()
      if (!endDatetime) endDatetime = new Date(Date.now() + 2 * 3600000).toISOString()

      // 5. Validar no traslape con reservaciones ya aprobadas
      const conflictRes = await client.query(
        `SELECT id FROM vecilomas.bookings 
         WHERE amenity_id = $1 AND status = 'aprobada'
           AND tstzrange(start_datetime, end_datetime) && tstzrange($2::timestamptz, $3::timestamptz)`,
        [amenityId, startDatetime, endDatetime]
      )
      if (conflictRes.rows.length > 0) {
        throw new Error('El horario seleccionado ya se encuentra ocupado por otra reservación aprobada.')
      }

      const initialStatus = amenity.requires_approval ? 'pendiente' : 'aprobada'
      const cost = data.totalCost !== undefined ? data.totalCost : Number(amenity.cost_amount || 0)
      const notes = data.notes || data.specialRequests || null

      const insertSql = `
        INSERT INTO vecilomas.bookings (
          amenity_id, user_id, unit_id, start_datetime, end_datetime, guests_count, total_cost, status, notes, created_at
        ) VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7, $8, $9, NOW())
        RETURNING 
          id,
          amenity_id AS "amenityId",
          to_char(start_datetime, 'YYYY-MM-DD') AS date,
          concat(to_char(start_datetime, 'HH24:MI'), ' – ', to_char(end_datetime, 'HH24:MI')) AS time,
          CASE 
            WHEN status = 'aprobada' THEN 'Aprobada'
            WHEN status = 'pendiente' THEN 'Pendiente'
            WHEN status = 'rechazada' THEN 'Rechazada'
            ELSE 'Cancelada'
          END AS status,
          guests_count AS guests,
          CASE WHEN total_cost > 0 THEN concat('$', total_cost, ' MXN') ELSE 'Sin costo' END AS cost,
          created_at AS "createdAt";
      `
      const res = await client.query(insertSql, [
        amenityId,
        userId,
        unitId,
        startDatetime,
        endDatetime,
        guestsCount,
        cost,
        initialStatus,
        notes,
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
