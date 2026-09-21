import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const isProduction = process.env.NODE_ENV === 'production'
const defaultSchema = process.env.DB_SCHEMA || 'vecilomas'

// Variables exclusivas de Vercel / Cloud
const rawConnectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL

function getPoolConfig(): pg.PoolConfig {
  const commonOptions = {
    ssl: { rejectUnauthorized: false },
    max: isProduction ? 5 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
    options: `-c search_path=${defaultSchema},public -c timezone=America/Hermosillo`,
  }

  if (rawConnectionString) {
    const cleanUrl = rawConnectionString.replace(/^["']|["']$/g, '').split('?')[0]
    return {
      connectionString: cleanUrl,
      ...commonOptions,
    }
  }

  return {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE || 'postgres',
    ...commonOptions,
  }
}

export const pool = new Pool(getPoolConfig())

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
export async function checkDbConnection(): Promise<{
  ok: boolean
  latencyMs: number
  database?: string
  schema?: string
  error?: string
}> {
  if (!rawConnectionString && !process.env.POSTGRES_HOST) {
    return {
      ok: false,
      latencyMs: 0,
      error: 'Variables de entorno de Vercel no configuradas (esperando POSTGRES_URL o DATABASE_URL).',
    }
  }

  const start = Date.now()
  try {
    const res = await pool.query(`
      SELECT 
        current_database() AS db,
        current_schema() AS schema;
    `)
    return {
      ok: true,
      latencyMs: Date.now() - start,
      database: res.rows[0]?.db,
      schema: res.rows[0]?.schema,
    }
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err?.message || 'Error de conexión a la BD',
    }
  }
}
