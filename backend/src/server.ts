import cors from 'cors'
import express from 'express'
import rateLimitModule from 'express-rate-limit'
import helmetModule from 'helmet'
import { requireFirebaseUser } from './auth.js'
import { pool } from './db.js'
import { api } from './routes.js'

const helmet: any = (helmetModule as any).default ?? helmetModule
const rateLimit: any = (rateLimitModule as any).default ?? rateLimitModule
const app = express()
app.set('trust proxy', 1)
const port = Number(process.env.PORT) || 4000

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'Authorization'], methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }))
app.use(express.json({ limit: '32kb' }))
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }))

app.get('/', (_req, res) => res.json({ name: 'AgriSmart API', version: '1.0.0', health: '/health' }))
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

app.use('/api', requireFirebaseUser, api)
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API request failed', error instanceof Error ? error.message : 'Unknown error')
  res.status(500).json({ error: 'Internal server error' })
})

if (!process.env.VERCEL) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`AgriSmart API listening on ${port}`)
  })

  const shutdown = () => {
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export default app