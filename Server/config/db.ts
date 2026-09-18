import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const isProduction = process.env.NODE_ENV === 'production'
const defaultSchema = process.env.DB_SCHEMA || 'vecilomas'

// Vercel Postgres y conexiones Cloud (Supabase, Neon, AWS)
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL

const isCloudOrSslRequired =
  Boolean(connectionString) ||
  process.env.DB_SSL === 'true' ||
  isProduction

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isCloudOrSslRequired ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
        port: Number(process.env.POSTGRES_PORT || process.env.DB_PORT) || 5432,
        user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'vecilomas_db',
        ssl: isCloudOrSslRequired ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
)

// Asegurar que cada cliente que se conecte use el esquema 'vecilomas'
pool.on('connect', async (client) => {
  try {
    await client.query(`SET search_path TO ${defaultSchema}, public;`)
  } catch (err) {
    console.error(`[DB] Error al configurar search_path para el esquema ${defaultSchema}:`, err)
  }
})

pool.on('error', (err) => {
  console.error('[DB Pool Error Inesperado]:', err)
})

/**
 * Ejecuta una consulta parametrizada con métricas de tiempo y captura de errores
 */
export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (!isProduction && process.env.DEBUG_SQL === 'true') {
      console.log('[SQL]', { text: text.trim().replace(/\s+/g, ' '), duration: `${duration}ms`, rows: res.rowCount })
    }
    return res
  } catch (error) {
    console.error('[SQL Error]', { text, params, error })
    throw error
  }
}

/**
 * Ejecutor de Transacciones ACID.
 * Gestiona automáticamente BEGIN, COMMIT, ROLLBACK y liberación del cliente al pool.
 */
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Verificación de salud (Health check) de la base de datos
 */
export async function checkDbConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now()
  try {
    await pool.query('SELECT 1')
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err?.message || 'Error de conexión a la BD' }
  }
}
