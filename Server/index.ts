import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import apiRoutes from './routes/index.ts'
import { checkDbConnection, pool } from './config/db.ts'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// Middlewares
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())

// Request Logger
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// Endpoint de Health Check
app.get(['/api/health', '/health'], async (_req, res) => {
  const dbHealth = await checkDbConnection()
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  })
})

// Montar Rutas API tanto en /api como en / para compatibilidad total con Vercel
app.use('/api', apiRoutes)
app.use('/', apiRoutes)

// Manejador global de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error no controlado]:', err)
  res.status(500).json({
    success: false,
    error: err?.message || 'Error interno del servidor',
  })
})

export { app }
export default app

if (!process.env.VERCEL) {
  const server = app.listen(PORT, async () => {
    console.log('====================================================')
    console.log(`🚀 VeciLomas API Server corriendo en http://localhost:${PORT}`)
    console.log(`📡 Endpoints API disponibles en http://localhost:${PORT}/api`)
    console.log('----------------------------------------------------')
    
    // Probar conexión a la base de datos de inmediato
    const dbHealth = await checkDbConnection()
    if (dbHealth.ok) {
      console.log(`✅ [Base de Datos] ¡Conexión a PostgreSQL exitosa!`)
      console.log(`🗄️  [Base de datos]: ${dbHealth.database} | [Esquema]: ${dbHealth.schema} | [Latencia]: ${dbHealth.latencyMs}ms`)
    } else {
      console.log(`⚠️  [Base de Datos] No se pudo conectar a PostgreSQL:`)
      console.log(`   ${dbHealth.error}`)
      console.log(`💡 [Nota]: El servidor sigue activo. Configura POSTGRES_URL / DATABASE_URL cuando estés listo.`)
    }
    console.log('====================================================\n')
  })

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('\n🛑 Cerrando servidor y conexiones de base de datos...')
    server.close(async () => {
      await pool.end()
      console.log('✅ Pool de conexiones cerrado. Proceso terminado.')
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

