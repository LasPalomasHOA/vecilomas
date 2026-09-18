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
app.get('/api/health', async (_req, res) => {
  const dbHealth = await checkDbConnection()
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  })
})

// Montar Rutas API
app.use('/api', apiRoutes)

// Manejador global de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error no controlado]:', err)
  res.status(500).json({
    success: false,
    error: err?.message || 'Error interno del servidor',
  })
})

const server = app.listen(PORT, () => {
  console.log(`🚀 VeciLomas API Server corriendo en http://localhost:${PORT}`)
  console.log(`📡 Endpoints API disponibles en http://localhost:${PORT}/api`)
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
