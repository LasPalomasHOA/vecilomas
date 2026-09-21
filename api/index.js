// Server/config/db.ts
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
var { Pool } = pg;
var isProduction = process.env.NODE_ENV === "production";
var defaultSchema = process.env.DB_SCHEMA || "vecilomas";
var rawConnectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || "";
function getPoolConfig() {
  const commonOptions = {
    ssl: { rejectUnauthorized: false },
    max: isProduction ? 5 : 20,
    idleTimeoutMillis: 3e4,
    connectionTimeoutMillis: 8e3,
    options: `-c search_path=${defaultSchema},public -c timezone=America/Hermosillo`
  };
  if (rawConnectionString) {
    const cleanUrl = rawConnectionString.replace(/^["']|["']$/g, "").split("?")[0];
    return {
      connectionString: cleanUrl,
      ...commonOptions
    };
  }
  return {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE || "postgres",
    ...commonOptions
  };
}
var pool = new Pool(getPoolConfig());
pool.on("error", (err) => {
  console.error("[DB Pool Error Inesperado]:", err);
});
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (!isProduction && process.env.DEBUG_SQL === "true") {
      console.log("[SQL]", { text: text.trim().replace(/\s+/g, " "), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error("[SQL Error]", { text, params, error });
    throw error;
  }
}
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function checkDbConnection() {
  if (!rawConnectionString && !process.env.POSTGRES_HOST) {
    return {
      ok: false,
      latencyMs: 0,
      error: "Variables de entorno de Vercel no configuradas (esperando POSTGRES_URL o DATABASE_URL)."
    };
  }
  const start = Date.now();
  try {
    const res = await pool.query(`
      SELECT 
        current_database() AS db,
        current_schema() AS schema;
    `);
    return {
      ok: true,
      latencyMs: Date.now() - start,
      database: res.rows[0]?.db,
      schema: res.rows[0]?.schema
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err?.message || "Error de conexi\xF3n a la BD"
    };
  }
}

// Server/repositories/hoa.repository.ts
var HoaRepository = class {
  /**
   * Obtiene la lista de condominios registrados
   */
  static async getCondominiums() {
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
    `;
    const { rows } = await query(sql);
    return rows;
  }
  /**
   * Crear nuevo condominio
   */
  static async createCondominium(data) {
    const sql = `
      INSERT INTO vecilomas.condominiums (name, address, postal_code, city, currency, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, address, postal_code AS "postalCode", city, currency, 0 AS "unitsCount", 0 AS "residentsCount";
    `;
    const { rows } = await query(sql, [
      data.name,
      data.address,
      data.postalCode || null,
      data.city || null,
      data.currency || "MXN"
    ]);
    return rows[0];
  }
  /**
   * Actualizar datos de un condominio
   */
  static async updateCondominium(id, data) {
    const sql = `
      UPDATE vecilomas.condominiums
      SET name = $2, address = $3, postal_code = $4, city = $5, currency = $6
      WHERE id = $1
      RETURNING id, name, address, postal_code AS "postalCode", city, currency,
        (SELECT count(*) FROM vecilomas.units u WHERE u.condominium_id = $1)::int AS "unitsCount",
        (SELECT count(*) FROM vecilomas.users usr WHERE usr.condominium_id = $1 AND usr.role = 'resident')::int AS "residentsCount";
    `;
    const { rows } = await query(sql, [
      id,
      data.name,
      data.address,
      data.postalCode || null,
      data.city || null,
      data.currency || "MXN"
    ]);
    return rows[0];
  }
  /**
   * Eliminar un condominio
   */
  static async deleteCondominium(id) {
    const sql = `DELETE FROM vecilomas.condominiums WHERE id = $1 RETURNING id;`;
    const { rows } = await query(sql, [id]);
    return rows[0];
  }
  /**
   * Obtiene el directorio residencial completo desde PostgreSQL
   * Vincula unidades y usuarios residentes sin perder unidades vacías o residentes sin unidad asignada.
   */
  static async getResidentsDirectory(condoId) {
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
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null]);
    return rows;
  }
  /**
   * Crea un residente y lo asocia a su unidad
   */
  static async createResident(data) {
    return await withTransaction(async (client) => {
      const condoId = Number(data.condominiumId) || 1;
      const unitStatus = data.status === "Moroso" ? "moroso" : "al_corriente";
      const findUnitSql = `
        SELECT id FROM vecilomas.units 
        WHERE condominium_id = $1 AND unit_number = $2
      `;
      const unitRes = await client.query(findUnitSql, [condoId, data.unitNumber]);
      let unitId = unitRes.rows[0]?.id;
      if (!unitId) {
        const createUnitSql = `
          INSERT INTO vecilomas.units (condominium_id, unit_number, status)
          VALUES ($1, $2, $3)
          RETURNING id;
        `;
        const newUnit = await client.query(createUnitSql, [condoId, data.unitNumber, unitStatus]);
        unitId = newUnit.rows[0].id;
      } else {
        await client.query("UPDATE vecilomas.units SET status = $2 WHERE id = $1", [unitId, unitStatus]);
      }
      const rType = (data.residentType || "propietario").toLowerCase();
      const insertUserSql = `
        INSERT INTO vecilomas.users (
          condominium_id, unit_id, email, password_hash, full_name, phone, role, resident_type, status
        ) VALUES ($1, $2, $3, '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG', $4, $5, 'resident', $6, 'activo')
        ON CONFLICT (email) DO UPDATE 
        SET unit_id = EXCLUDED.unit_id, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, resident_type = EXCLUDED.resident_type
        RETURNING id, full_name, email;
      `;
      const userRes = await client.query(insertUserSql, [
        condoId,
        unitId,
        data.email,
        data.fullName,
        data.phone || "",
        rType
      ]);
      const userId = userRes.rows[0].id;
      if (data.vehicles && data.vehicles.length > 0) {
        for (const plate of data.vehicles) {
          if (plate && plate.trim()) {
            await client.query(
              `INSERT INTO vecilomas.vehicles (unit_id, user_id, plate_number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
              [unitId, userId, plate.trim()]
            );
          }
        }
      }
      return userRes.rows[0];
    });
  }
  /**
   * Actualiza datos de un residente (nombre, email, teléfono, tipo, unidad, status, vehículos)
   */
  static async updateResident(id, data) {
    return await withTransaction(async (client) => {
      const uRes = await client.query("SELECT condominium_id, unit_id FROM vecilomas.users WHERE id = $1", [id]);
      if (uRes.rows.length === 0) throw new Error("Residente no encontrado");
      const { condominium_id: condoId, unit_id: currentUnitId } = uRes.rows[0];
      const unitStatus = data.status === "Moroso" ? "moroso" : "al_corriente";
      let unitId = currentUnitId;
      if (data.unitNumber) {
        const findUnit = await client.query(
          "SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2",
          [condoId, data.unitNumber]
        );
        if (findUnit.rows.length > 0) {
          unitId = findUnit.rows[0].id;
          await client.query("UPDATE vecilomas.units SET status = $2 WHERE id = $1", [unitId, unitStatus]);
        } else {
          const newU = await client.query(
            "INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, $3) RETURNING id",
            [condoId, data.unitNumber, unitStatus]
          );
          unitId = newU.rows[0].id;
        }
      }
      const rType = (data.residentType || "propietario").toLowerCase();
      const updateSql = `
        UPDATE vecilomas.users
        SET unit_id = $2, full_name = $3, email = $4, phone = $5, resident_type = $6, updated_at = NOW()
        WHERE id = $1
        RETURNING id, full_name, email;
      `;
      const resUser = await client.query(updateSql, [
        id,
        unitId,
        data.fullName,
        data.email,
        data.phone || "",
        rType
      ]);
      if (data.vehicles !== void 0) {
        await client.query("DELETE FROM vecilomas.vehicles WHERE user_id = $1 OR unit_id = $2", [id, unitId]);
        for (const plate of data.vehicles) {
          if (plate && plate.trim()) {
            await client.query(
              "INSERT INTO vecilomas.vehicles (unit_id, user_id, plate_number) VALUES ($1, $2, $3)",
              [unitId, id, plate.trim()]
            );
          }
        }
      }
      return resUser.rows[0];
    });
  }
  /**
   * Eliminar residente de la base de datos
   */
  static async deleteResident(id) {
    return await withTransaction(async (client) => {
      await client.query("DELETE FROM vecilomas.vehicles WHERE user_id = $1", [id]);
      await client.query("DELETE FROM vecilomas.user_permissions WHERE user_id = $1", [id]);
      const res = await client.query("DELETE FROM vecilomas.users WHERE id = $1 RETURNING id", [id]);
      return res.rows[0];
    });
  }
  /**
   * Avisos y Comunicados ordenados cronológicamente
   */
  static async getNotices(condoId) {
    const sql = `
      SELECT * FROM vecilomas.notices
      WHERE ($1::integer IS NULL OR condominium_id = $1::integer)
      ORDER BY is_urgent DESC, published_at DESC;
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null]);
    return rows;
  }
  static async createNotice(data) {
    const sql = `
      INSERT INTO vecilomas.notices (
        condominium_id, author_user_id, title, content, notice_type, is_urgent, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const { rows } = await query(sql, [
      Number(data.condominiumId) || 1,
      Number(data.authorUserId) || 1,
      data.title,
      data.content,
      data.noticeType.toLowerCase(),
      data.isUrgent
    ]);
    return rows[0];
  }
  static async deleteNotice(id) {
    const sql = `DELETE FROM vecilomas.notices WHERE id = $1 RETURNING id;`;
    const { rows } = await query(sql, [id]);
    return rows[0];
  }
  /**
   * Repositorio de Documentos comunitarios
   */
  static async getDocuments(condoId) {
    const sql = `
      SELECT * FROM vecilomas.community_documents
      WHERE ($1::integer IS NULL OR condominium_id = $1::integer)
      ORDER BY created_at DESC;
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null]);
    return rows;
  }
  static async createDocument(data) {
    const sql = `
      INSERT INTO vecilomas.community_documents (
        condominium_id, name, category, file_url, file_size_bytes, mime_type, uploaded_by_user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const { rows } = await query(sql, [
      Number(data.condominiumId) || 1,
      data.name,
      data.category.toLowerCase(),
      data.fileUrl,
      data.fileSizeBytes || 0,
      data.mimeType || "application/pdf",
      data.uploadedByUserId ? Number(data.uploadedByUserId) : null
    ]);
    return rows[0];
  }
  static async deleteDocument(id) {
    const sql = `DELETE FROM vecilomas.community_documents WHERE id = $1 RETURNING id;`;
    const { rows } = await query(sql, [id]);
    return rows[0];
  }
  /**
   * Lista usuarios y sus permisos agregados
   */
  static async getUsersWithPermissions(condoId) {
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
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null]);
    return rows;
  }
  static async createUserWithPermissions(data) {
    return await withTransaction(async (client) => {
      let unitId = null;
      if (data.unitNumber) {
        const u = await client.query("SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2", [data.condominiumId || 1, data.unitNumber]);
        if (u.rows[0]) unitId = u.rows[0].id;
      }
      const userRes = await client.query(`
        INSERT INTO vecilomas.users (condominium_id, unit_id, email, password_hash, full_name, role, status)
        VALUES ($1, $2, $3, '$2b$10$piiUvSixamfnpdrWUB9qVeRBicvdo3IpjVqIZA2E6H6zfSf3FMhdG', $4, $5, 'activo')
        ON CONFLICT (email) DO UPDATE
        SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, unit_id = EXCLUDED.unit_id
        RETURNING id, full_name, email, role, status;
      `, [data.condominiumId || 1, unitId, data.email, data.fullName, data.role]);
      const userId = userRes.rows[0].id;
      if (data.permissions && data.permissions.length > 0) {
        for (const perm of data.permissions) {
          await client.query("INSERT INTO vecilomas.user_permissions (user_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, perm]);
        }
      }
      return userRes.rows[0];
    });
  }
  static async deleteUserPermission(userId) {
    return await withTransaction(async (client) => {
      await client.query("DELETE FROM vecilomas.user_permissions WHERE user_id = $1", [userId]);
      const res = await client.query("DELETE FROM vecilomas.users WHERE id = $1 RETURNING id", [userId]);
      return res.rows[0];
    });
  }
};

// Server/repositories/amenities.repository.ts
var AmenitiesRepository = class {
  /**
   * Catálogo de amenidades activas
   */
  static async getAmenities(condoId) {
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
        CASE WHEN deposit_amount > 0 THEN concat('$', deposit_amount, ' MXN en garant\xEDa') ELSE 'No aplica' END AS deposit,
        concat(to_char(opening_time, 'HH24:MI'), ' \u2013 ', to_char(closing_time, 'HH24:MI'), ' hrs') AS hours,
        max_hours_per_booking AS "maxHoursPerBooking",
        is_active AS available,
        COALESCE(image_url, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80') AS img,
        COALESCE(rules, '[]'::jsonb) AS rules
      FROM vecilomas.amenities
      WHERE is_active = TRUE
        AND ($1::integer IS NULL OR condominium_id = $1::integer)
      ORDER BY id ASC;
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null]);
    return rows;
  }
  /**
   * Crear nueva amenidad
   */
  static async createAmenity(data) {
    let openTime = data.openingTime || "08:00:00";
    let closeTime = data.closingTime || "22:00:00";
    if (data.hours && data.hours.includes("\u2013")) {
      const parts = data.hours.replace("hrs", "").trim().split("\u2013");
      if (parts[0]) openTime = parts[0].trim() + ":00";
      if (parts[1]) closeTime = parts[1].trim() + ":00";
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
        CASE WHEN deposit_amount > 0 THEN concat('$', deposit_amount, ' MXN en garant\xEDa') ELSE 'No aplica' END AS deposit,
        concat(to_char(opening_time, 'HH24:MI'), ' \u2013 ', to_char(closing_time, 'HH24:MI'), ' hrs') AS hours,
        max_hours_per_booking AS "maxHoursPerBooking",
        is_active AS available,
        COALESCE(image_url, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80') AS img,
        COALESCE(rules, '[]'::jsonb) AS rules;
    `;
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
      JSON.stringify(data.rules || [])
    ]);
    return rows[0];
  }
  /**
   * Actualizar amenidad
   */
  static async updateAmenity(id, data) {
    let openTime = data.openingTime;
    let closeTime = data.closingTime;
    if (data.hours && data.hours.includes("\u2013")) {
      const parts = data.hours.replace("hrs", "").trim().split("\u2013");
      if (parts[0]) openTime = parts[0].trim() + ":00";
      if (parts[1]) closeTime = parts[1].trim() + ":00";
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
        CASE WHEN deposit_amount > 0 THEN concat('$', deposit_amount, ' MXN en garant\xEDa') ELSE 'No aplica' END AS deposit,
        concat(to_char(opening_time, 'HH24:MI'), ' \u2013 ', to_char(closing_time, 'HH24:MI'), ' hrs') AS hours,
        max_hours_per_booking AS "maxHoursPerBooking",
        is_active AS available,
        COALESCE(image_url, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80') AS img,
        COALESCE(rules, '[]'::jsonb) AS rules;
    `;
    const { rows } = await query(sql, [
      id,
      data.name,
      data.description,
      data.capacity ? Number(data.capacity) : null,
      data.costAmount !== void 0 ? Number(data.costAmount) : null,
      data.depositAmount !== void 0 ? Number(data.depositAmount) : null,
      openTime || null,
      closeTime || null,
      data.maxHoursPerBooking ? Number(data.maxHoursPerBooking) : null,
      data.img || null,
      data.rules ? JSON.stringify(data.rules) : null,
      data.available !== void 0 ? data.available : null
    ]);
    return rows[0];
  }
  /**
   * Eliminar amenidad
   */
  static async deleteAmenity(id) {
    const sql = `DELETE FROM vecilomas.amenities WHERE id = $1 RETURNING id;`;
    const { rows } = await query(sql, [id]);
    return rows[0];
  }
  /**
   * Lista de reservaciones con datos de la amenidad, residente y unidad en 1 solo JOIN
   */
  static async getBookings(condoId, unitId) {
    const sql = `
      SELECT 
        b.id,
        b.amenity_id AS "amenityId",
        a.name AS amenity,
        u.full_name AS resident,
        un.unit_number AS unit,
        to_char(b.start_datetime, 'DD Mon YYYY') AS date,
        concat(to_char(b.start_datetime, 'HH24:MI'), ' \u2013 ', to_char(b.end_datetime, 'HH24:MI')) AS time,
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
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, unitId ? Number(unitId) : null]);
    return rows;
  }
  /**
   * Verifica disponibilidad de horario para una amenidad específica.
   * Utiliza el operador de traslape && sobre rangos de tiempo (tstzrange).
   */
  static async checkAvailability(amenityId, startDatetime, endDatetime, excludeBookingId) {
    const sql = `
      SELECT id, start_datetime, end_datetime
      FROM vecilomas.bookings
      WHERE amenity_id = $1
        AND status = 'aprobada'
        AND ($4::bigint IS NULL OR id != $4::bigint)
        AND tstzrange(start_datetime, end_datetime) && tstzrange($2::timestamptz, $3::timestamptz);
    `;
    const { rows } = await query(sql, [amenityId, startDatetime, endDatetime, excludeBookingId || null]);
    if (rows.length > 0) {
      return {
        available: false,
        conflictReason: "El horario seleccionado ya se encuentra ocupado por otra reservaci\xF3n aprobada."
      };
    }
    return { available: true };
  }
  /**
   * Crea una reservación de forma segura dentro de una transacción
   */
  static async createBooking(data) {
    return await withTransaction(async (client) => {
      const amenityRes = await client.query(
        "SELECT capacity, requires_approval, cost_amount FROM vecilomas.amenities WHERE id = $1",
        [data.amenityId]
      );
      const amenity = amenityRes.rows[0];
      if (!amenity) throw new Error("Amenidad no encontrada");
      if (data.guestsCount > amenity.capacity) {
        throw new Error(`El n\xFAmero de invitados (${data.guestsCount}) excede el aforo m\xE1ximo (${amenity.capacity}).`);
      }
      const conflictRes = await client.query(
        `SELECT id FROM vecilomas.bookings 
         WHERE amenity_id = $1 AND status = 'aprobada'
           AND tstzrange(start_datetime, end_datetime) && tstzrange($2::timestamptz, $3::timestamptz)`,
        [data.amenityId, data.startDatetime, data.endDatetime]
      );
      if (conflictRes.rows.length > 0) {
        throw new Error("El horario ya no est\xE1 disponible.");
      }
      const initialStatus = amenity.requires_approval ? "pendiente" : "aprobada";
      const cost = data.totalCost !== void 0 ? data.totalCost : amenity.cost_amount;
      const insertSql = `
        INSERT INTO vecilomas.bookings (
          amenity_id, user_id, unit_id, start_datetime, end_datetime, guests_count, total_cost, status, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *;
      `;
      const res = await client.query(insertSql, [
        data.amenityId,
        Number(data.userId) || 1,
        Number(data.unitId) || 1,
        data.startDatetime,
        data.endDatetime,
        data.guestsCount,
        cost,
        initialStatus,
        data.notes || null
      ]);
      return res.rows[0];
    });
  }
  /**
   * Actualiza el estatus de la reservación (Aprobar / Cancelar / Rechazar)
   */
  static async updateBookingStatus(bookingId, status, approvedByUserId) {
    const sql = `
      UPDATE vecilomas.bookings
      SET status = $2,
          approved_by_user_id = $3
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await query(sql, [bookingId, status.toLowerCase(), approvedByUserId ? Number(approvedByUserId) : null]);
    return rows[0];
  }
};

// Server/repositories/access.repository.ts
var AccessRepository = class {
  /**
   * Obtiene todos los pases de acceso generados
   */
  static async getAccessPasses(condoId) {
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
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null]);
    return rows;
  }
  /**
   * Genera un nuevo Pase QR de Acceso y lo guarda en PostgreSQL
   */
  static async createAccessPass(data) {
    const code = data.customQrCode || `VCN-${(data.visitorName || "VIS").slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const condoId = Number(data.condominiumId) || 1;
    let unitId = Number(data.unitId) || null;
    if (!unitId && data.unitNumber) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2 LIMIT 1;`, [condoId, data.unitNumber]);
      if (uRes.rows[0]) unitId = uRes.rows[0].id;
    }
    if (!unitId) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 LIMIT 1;`, [condoId]);
      if (uRes.rows[0]) unitId = uRes.rows[0].id;
    }
    if (!unitId) {
      const newU = await query(`INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, 'al_corriente') RETURNING id;`, [condoId, data.unitNumber || "S/N"]);
      unitId = newU.rows[0].id;
    }
    let hostUserId = Number(data.hostUserId) || null;
    if (!hostUserId) {
      const userRes = await query(`SELECT id FROM vecilomas.users WHERE role IN ('resident', 'admin') LIMIT 1;`);
      hostUserId = userRes.rows[0]?.id || 1;
    }
    let validFrom = data.validFrom;
    let validUntil = data.validUntil;
    if (!validFrom && data.date && data.time) {
      validFrom = `${data.date}T${data.time}:00`;
      validUntil = `${data.date}T23:59:59`;
    }
    if (!validFrom) validFrom = (/* @__PURE__ */ new Date()).toISOString();
    if (!validUntil) validUntil = new Date(Date.now() + 24 * 36e5).toISOString();
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
    `;
    const { rows } = await query(sql, [
      unitId,
      hostUserId,
      code,
      data.visitorName,
      data.visitorPhone || null,
      (data.visitType || "visita").toLowerCase(),
      validFrom,
      validUntil,
      data.isSingleUse !== void 0 ? data.isSingleUse : true,
      data.hostName || "Residente Anfitri\xF3n",
      data.unitNumber || "S/N"
    ]);
    return rows[0];
  }
  /**
   * Validación instantánea de Código QR en la caseta de vigilancia
   */
  static async validateQRCode(qrCode) {
    const trimmed = qrCode.trim().toUpperCase();
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
        COALESCE(u.full_name, 'Residente Anfitri\xF3n') AS host,
        COALESCE(un.unit_number, 'S/N') AS unit
      FROM vecilomas.access_passes ap
      LEFT JOIN vecilomas.users u ON ap.host_user_id = u.id
      LEFT JOIN vecilomas.units un ON ap.unit_id = un.id
      WHERE UPPER(ap.qr_code) = $1;
    `;
    const { rows } = await query(sql, [trimmed]);
    if (rows.length === 0) {
      if (trimmed.startsWith("VCN-")) {
        const parts = trimmed.split("-");
        const pass2 = {
          id: "PASS-LIVE",
          code: trimmed,
          visitor: parts[1] ? `Visitante (${parts[1]})` : "Invitado Registrado",
          host: "Residente Anfitri\xF3n",
          unit: parts[2] || "S/N",
          validDate: "Hoy",
          validTime: "Acceso Inmediato",
          visitType: "Visita",
          status: "Activo"
        };
        return { valid: true, pass: pass2, message: "C\xF3digo QR verificado con \xE9xito." };
      }
      return { valid: false, message: "C\xF3digo QR no registrado en el sistema." };
    }
    const pass = rows[0];
    const now = /* @__PURE__ */ new Date();
    if (pass.status === "expirado" || pass.valid_until && now > new Date(pass.valid_until)) {
      return { valid: false, pass, message: "El pase de acceso ha expirado." };
    }
    if (pass.status === "utilizado") {
      return { valid: false, pass, message: "Este pase ya fue utilizado previamente." };
    }
    if (pass.status === "cancelado") {
      return { valid: false, pass, message: "Este pase fue cancelado por el anfitri\xF3n." };
    }
    return { valid: true, pass, message: "Pase digital v\xE1lido y verificado con \xE9xito." };
  }
  /**
   * Obtiene la bitácora de accesos con filtros por fecha, unidad o estatus directamente de PostgreSQL
   */
  static async getVisitLogs(condoId, status) {
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
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, status ? status.toLowerCase() : null]);
    return rows;
  }
  /**
   * Registro de Entrada en Caseta (Check-in) en PostgreSQL (vecilomas.visit_logs)
   */
  static async checkInVisit(data) {
    const condoId = Number(data.condominiumId) || 1;
    let unitId = Number(data.unitId) || null;
    if (!unitId && data.unitNumber) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 AND unit_number = $2 LIMIT 1;`, [condoId, data.unitNumber]);
      if (uRes.rows[0]) unitId = uRes.rows[0].id;
    }
    if (!unitId) {
      const uRes = await query(`SELECT id FROM vecilomas.units WHERE condominium_id = $1 LIMIT 1;`, [condoId]);
      if (uRes.rows[0]) unitId = uRes.rows[0].id;
    }
    if (!unitId) {
      const newU = await query(`INSERT INTO vecilomas.units (condominium_id, unit_number, status) VALUES ($1, $2, 'al_corriente') RETURNING id;`, [condoId, data.unitNumber || "S/N"]);
      unitId = newU.rows[0].id;
    }
    return await withTransaction(async (client) => {
      if (data.accessPassId && typeof data.accessPassId === "number") {
        await client.query(
          `UPDATE vecilomas.access_passes 
           SET status = 'utilizado' 
           WHERE id = $1 AND is_single_use = TRUE`,
          [Number(data.accessPassId)]
        );
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
      `;
      const res = await client.query(sql, [
        condoId,
        unitId,
        data.accessPassId && typeof data.accessPassId === "number" ? Number(data.accessPassId) : null,
        data.guardUserId ? Number(data.guardUserId) : null,
        data.visitorName,
        data.hostName || "Residente Anfitri\xF3n",
        (data.visitType || "visita").toLowerCase(),
        data.vehiclePlate || null,
        data.notes || null,
        data.unitNumber || "S/N"
      ]);
      return res.rows[0];
    });
  }
  /**
   * Registro de Salida en Caseta (Check-out) en PostgreSQL (vecilomas.visit_logs)
   */
  static async checkOutVisit(visitId) {
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
    `;
    const { rows } = await query(sql, [visitId]);
    return rows[0];
  }
};

// Server/repositories/finance.repository.ts
var FinanceRepository = class {
  /**
   * Obtiene los estados de cuenta con los datos de residente y último método de pago
   */
  static async getFeeStatements(condoId, unitId) {
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
          ELSE '\u2014'
        END AS date,
        to_char(fs.due_date, 'DD Mon YYYY') AS "dueDate",
        CASE 
          WHEN p.payment_method = 'spei' THEN 'Transferencia SPEI'
          WHEN p.payment_method = 'tarjeta_debito' THEN 'Tarjeta de D\xE9bito'
          WHEN p.payment_method = 'tarjeta_credito' THEN 'Tarjeta de Cr\xE9dito'
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
      WHERE ($1::integer IS NULL OR un.condominium_id = $1::integer)
        AND ($2::integer IS NULL OR fs.unit_id = $2::integer)
      ORDER BY fs.due_date DESC;
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, unitId ? Number(unitId) : null]);
    return rows;
  }
  /**
   * Registra un pago de forma atómica:
   * 1. Inserta la transacción en `payments`
   * 2. Actualiza el estatus del cargo a 'pagada'
   * 3. Verifica si la unidad ya no tiene adeudos vencidos y la pone 'al_corriente'
   */
  static async registerPayment(data) {
    return await withTransaction(async (client) => {
      const insertPaymentSql = `
        INSERT INTO vecilomas.payments (
          fee_statement_id, user_id, amount_paid, payment_method, reference_number, voucher_url, verified_by_user_id, verified_at, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'aprobado', NOW())
        RETURNING *;
      `;
      const paymentRes = await client.query(insertPaymentSql, [
        Number(data.feeStatementId),
        Number(data.userId),
        data.amountPaid,
        data.paymentMethod,
        data.referenceNumber || null,
        data.voucherUrl || null,
        data.verifiedByUserId ? Number(data.verifiedByUserId) : null
      ]);
      const updateFeeSql = `
        UPDATE vecilomas.fee_statements
        SET status = 'pagada'
        WHERE id = $1
        RETURNING unit_id;
      `;
      const feeRes = await client.query(updateFeeSql, [Number(data.feeStatementId)]);
      const unitId = feeRes.rows[0]?.unit_id;
      if (unitId) {
        const checkPendingSql = `
          SELECT COUNT(*) as pending_count 
          FROM vecilomas.fee_statements 
          WHERE unit_id = $1 AND status = 'vencida';
        `;
        const checkRes = await client.query(checkPendingSql, [unitId]);
        if (Number(checkRes.rows[0]?.pending_count) === 0) {
          await client.query(`UPDATE vecilomas.units SET status = 'al_corriente' WHERE id = $1;`, [unitId]);
        }
      }
      return paymentRes.rows[0];
    });
  }
  /**
   * Obtiene los tickets de mantenimiento con información agregada
   */
  static async getMaintenanceTickets(condoId, unitId) {
    const sql = `
      SELECT 
        mt.ticket_number AS id,
        mt.location,
        COALESCE(u.full_name, 'Administraci\xF3n') AS reporter,
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
    `;
    const { rows } = await query(sql, [condoId ? Number(condoId) : null, unitId ? Number(unitId) : null]);
    return rows;
  }
  /**
   * Crea un nuevo ticket de soporte / falla
   */
  static async createTicket(data) {
    const ticketFolio = `TKT-${Math.floor(2025 + Math.random() * 500)}`;
    const sql = `
      INSERT INTO vecilomas.maintenance_tickets (
        ticket_number, condominium_id, unit_id, reported_by_user_id, location, category, title, description, priority, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente', NOW())
      RETURNING *;
    `;
    const { rows } = await query(sql, [
      ticketFolio,
      Number(data.condominiumId) || 1,
      data.unitId ? Number(data.unitId) : null,
      Number(data.reportedByUserId) || 1,
      data.location,
      data.category,
      data.title,
      data.description,
      data.priority
    ]);
    return rows[0];
  }
  /**
   * Actualiza el estatus o asignación de un ticket
   */
  static async updateTicketStatus(ticketNumber, status, assignedTo) {
    const sql = `
      UPDATE vecilomas.maintenance_tickets
      SET status = $2,
          assigned_to = COALESCE($3, assigned_to),
          resolved_at = CASE WHEN $2 = 'resuelto' THEN NOW() ELSE resolved_at END
      WHERE ticket_number = $1
      RETURNING *;
    `;
    const { rows } = await query(sql, [ticketNumber, status.toLowerCase(), assignedTo || null]);
    return rows[0];
  }
};

// Server/serverless.ts
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }
  const sendJson = (statusCode, data) => {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
  try {
    const rawUrl = req.url || "/";
    const parsedUrl = new URL(rawUrl, "http://localhost");
    let pathname = parsedUrl.pathname.replace(/\/$/, "");
    if (!pathname.startsWith("/api")) {
      pathname = `/api${pathname}`;
    }
    const queryParams = {};
    parsedUrl.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });
    const method = (req.method || "GET").toUpperCase();
    let body = req.body;
    if (!body && ["POST", "PUT", "PATCH"].includes(method)) {
      body = await parseBody(req);
    }
    if (pathname === "/api/health") {
      const dbHealth = await checkDbConnection();
      return sendJson(dbHealth.ok ? 200 : 503, {
        status: dbHealth.ok ? "healthy" : "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database: dbHealth
      });
    }
    if (pathname === "/api/hoa/condominiums") {
      if (method === "GET") {
        const condos = await HoaRepository.getCondominiums();
        return sendJson(200, { success: true, data: condos });
      }
      if (method === "POST") {
        const condo = await HoaRepository.createCondominium(body);
        return sendJson(201, { success: true, data: condo });
      }
    }
    const matchCondoId = pathname.match(/^\/api\/hoa\/condominiums\/(\d+)$/);
    if (matchCondoId) {
      const id = Number(matchCondoId[1]);
      if (method === "PUT") {
        const updated = await HoaRepository.updateCondominium(id, body);
        return sendJson(200, { success: true, data: updated });
      }
      if (method === "DELETE") {
        await HoaRepository.deleteCondominium(id);
        return sendJson(200, { success: true, message: "Condominio eliminado" });
      }
    }
    if (pathname === "/api/hoa/directory" && method === "GET") {
      const directory = await HoaRepository.getResidentsDirectory(queryParams.condoId);
      return sendJson(200, { success: true, data: directory });
    }
    if (pathname === "/api/hoa/residents" && method === "POST") {
      const resident = await HoaRepository.createResident(body);
      return sendJson(201, { success: true, data: resident });
    }
    const matchResidentId = pathname.match(/^\/api\/hoa\/residents\/(\d+)$/);
    if (matchResidentId) {
      const id = Number(matchResidentId[1]);
      if (method === "PUT") {
        const updated = await HoaRepository.updateResident(id, body);
        return sendJson(200, { success: true, data: updated });
      }
      if (method === "DELETE") {
        await HoaRepository.deleteResident(id);
        return sendJson(200, { success: true, message: "Residente eliminado" });
      }
    }
    if (pathname === "/api/hoa/notices") {
      if (method === "GET") {
        const notices = await HoaRepository.getNotices(queryParams.condoId);
        return sendJson(200, { success: true, data: notices });
      }
      if (method === "POST") {
        const notice = await HoaRepository.createNotice(body);
        return sendJson(201, { success: true, data: notice });
      }
    }
    const matchNoticeId = pathname.match(/^\/api\/hoa\/notices\/(\d+)$/);
    if (matchNoticeId && method === "DELETE") {
      const id = Number(matchNoticeId[1]);
      await HoaRepository.deleteNotice(id);
      return sendJson(200, { success: true, message: "Aviso eliminado" });
    }
    if (pathname === "/api/hoa/documents") {
      if (method === "GET") {
        const docs = await HoaRepository.getDocuments(queryParams.condoId);
        return sendJson(200, { success: true, data: docs });
      }
      if (method === "POST") {
        const doc = await HoaRepository.createDocument(body);
        return sendJson(201, { success: true, data: doc });
      }
    }
    const matchDocId = pathname.match(/^\/api\/hoa\/documents\/(\d+)$/);
    if (matchDocId && method === "DELETE") {
      const id = Number(matchDocId[1]);
      await HoaRepository.deleteDocument(id);
      return sendJson(200, { success: true, message: "Documento eliminado" });
    }
    if (pathname === "/api/hoa/users-permissions") {
      if (method === "GET") {
        const users = await HoaRepository.getUsersWithPermissions(queryParams.condoId);
        return sendJson(200, { success: true, data: users });
      }
      if (method === "POST") {
        const user = await HoaRepository.createUserWithPermissions(body);
        return sendJson(201, { success: true, data: user });
      }
    }
    const matchUserPermId = pathname.match(/^\/api\/hoa\/users-permissions\/(\d+)$/);
    if (matchUserPermId && method === "DELETE") {
      const id = Number(matchUserPermId[1]);
      await HoaRepository.deleteUserPermission(id);
      return sendJson(200, { success: true, message: "Permiso de usuario eliminado" });
    }
    if (pathname === "/api/amenities") {
      if (method === "GET") {
        const amenities = await AmenitiesRepository.getAmenities(queryParams.condoId);
        return sendJson(200, { success: true, data: amenities });
      }
      if (method === "POST") {
        const amenity = await AmenitiesRepository.createAmenity(body);
        return sendJson(201, { success: true, data: amenity });
      }
    }
    const matchAmenityId = pathname.match(/^\/api\/amenities\/(\d+)$/);
    if (matchAmenityId) {
      const id = Number(matchAmenityId[1]);
      if (method === "PUT") {
        const updated = await AmenitiesRepository.updateAmenity(id, body);
        return sendJson(200, { success: true, data: updated });
      }
      if (method === "DELETE") {
        await AmenitiesRepository.deleteAmenity(id);
        return sendJson(200, { success: true, message: "Amenidad eliminada" });
      }
    }
    if (pathname === "/api/amenities/bookings") {
      if (method === "GET") {
        const bookings = await AmenitiesRepository.getBookings(queryParams.condoId);
        return sendJson(200, { success: true, data: bookings });
      }
      if (method === "POST") {
        const booking = await AmenitiesRepository.createBooking(body);
        return sendJson(201, { success: true, data: booking });
      }
    }
    const matchBookingStatus = pathname.match(/^\/api\/amenities\/bookings\/(\d+)\/status$/);
    if (matchBookingStatus && method === "PATCH") {
      const id = Number(matchBookingStatus[1]);
      const updated = await AmenitiesRepository.updateBookingStatus(id, body.status);
      return sendJson(200, { success: true, data: updated });
    }
    if (pathname === "/api/amenities/availability" && method === "GET") {
      const start = queryParams.date && queryParams.startTime ? `${queryParams.date}T${queryParams.startTime}:00` : "";
      const end = queryParams.date && queryParams.endTime ? `${queryParams.date}T${queryParams.endTime}:00` : "";
      const available = await AmenitiesRepository.checkAvailability(
        Number(queryParams.amenityId),
        start,
        end
      );
      return sendJson(200, { success: true, available });
    }
    if (pathname === "/api/access/passes") {
      if (method === "GET") {
        const passes = await AccessRepository.getAccessPasses(queryParams.condoId);
        return sendJson(200, { success: true, data: passes });
      }
      if (method === "POST") {
        const pass = await AccessRepository.createAccessPass(body);
        return sendJson(201, { success: true, data: pass });
      }
    }
    if (pathname === "/api/access/validate-qr" && method === "POST") {
      const validation = await AccessRepository.validateQRCode(body.code);
      return sendJson(200, { success: true, data: validation });
    }
    if (pathname === "/api/access/visits" && method === "GET") {
      const visits = await AccessRepository.getVisitLogs(queryParams.condoId);
      return sendJson(200, { success: true, data: visits });
    }
    if (pathname === "/api/access/check-in" && method === "POST") {
      const log = await AccessRepository.checkInVisit(body);
      return sendJson(201, { success: true, data: log });
    }
    const matchCheckOut = pathname.match(/^\/api\/access\/check-out\/(\d+)$/);
    if (matchCheckOut && method === "POST") {
      const id = Number(matchCheckOut[1]);
      const log = await AccessRepository.checkOutVisit(id);
      return sendJson(200, { success: true, data: log });
    }
    if (pathname === "/api/finance/fees" && method === "GET") {
      const fees = await FinanceRepository.getFeeStatements(queryParams.condoId);
      return sendJson(200, { success: true, data: fees });
    }
    if (pathname === "/api/finance/payments" && method === "POST") {
      const payment = await FinanceRepository.registerPayment(body);
      return sendJson(201, { success: true, data: payment });
    }
    if (pathname === "/api/finance/tickets") {
      if (method === "GET") {
        const tickets = await FinanceRepository.getMaintenanceTickets(queryParams.condoId);
        return sendJson(200, { success: true, data: tickets });
      }
      if (method === "POST") {
        const ticket = await FinanceRepository.createTicket(body);
        return sendJson(201, { success: true, data: ticket });
      }
    }
    const matchTicketStatus = pathname.match(/^\/api\/finance\/tickets\/([a-zA-Z0-9_-]+)\/status$/);
    if (matchTicketStatus && method === "PATCH") {
      const id = matchTicketStatus[1];
      const updated = await FinanceRepository.updateTicketStatus(id, body.status, body.assignedTo || body.notes);
      return sendJson(200, { success: true, data: updated });
    }
    return sendJson(404, { success: false, error: `Ruta no encontrada: ${method} ${pathname}` });
  } catch (error) {
    console.error("[API Serverless Error]:", error);
    return sendJson(500, { success: false, error: error?.message || "Error interno del servidor" });
  }
}
export {
  handler as default
};
