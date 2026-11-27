import { and, desc, eq, sql } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { db } from './db.js'
import { irrigationEvents, sensorReadings, zones } from './schema.js'

export const api = Router()

const zoneInput = z.object({
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().max(200).nullable().optional(),
  moistureThreshold: z.number().min(0).max(100).optional(),
})

const readingInput = z.object({
  soilMoisture: z.number().min(0).max(100),
  temperature: z.number().min(-50).max(80).nullable().optional(),
  ph: z.number().min(0).max(14).nullable().optional(),
  recordedAt: z.coerce.date().optional(),
})

const irrigationInput = z.object({
  amountLiters: z.number().positive().max(1_000_000).nullable().optional(),
})

function userId(req: Express.Request) {
  if (!req.userId) throw new Error('Authenticated user is missing')
  return req.userId
}

function invalid(res: import('express').Response, error: z.ZodError) {
  res.status(400).json({ error: 'Invalid request', details: error.issues })
}

function serializeZone(zone: typeof zones.$inferSelect) {
  return {
    ...zone,
    soilMoisture: zone.soilMoisture === null ? null : Number(zone.soilMoisture),
    temperature: zone.temperature === null ? null : Number(zone.temperature),
    ph: zone.ph === null ? null : Number(zone.ph),
    moistureThreshold: Number(zone.moistureThreshold),
  }
}

function serializeReading(reading: typeof sensorReadings.$inferSelect) {
  return {
    ...reading,
    soilMoisture: Number(reading.soilMoisture),
    temperature: reading.temperature === null ? null : Number(reading.temperature),
    ph: reading.ph === null ? null : Number(reading.ph),
  }
}

function serializeIrrigationEvent(event: typeof irrigationEvents.$inferSelect) {
  return { ...event, amountLiters: event.amountLiters === null ? null : Number(event.amountLiters) }
}

api.get('/zones', async (req, res, next) => {
  try {
    const rows = await db.select().from(zones).where(eq(zones.userId, userId(req))).orderBy(desc(zones.createdAt))
    res.json(rows.map(serializeZone))
  } catch (error) { next(error) }
})

api.post('/zones', async (req, res, next) => {
  try {
    const parsed = zoneInput.safeParse(req.body)
    if (!parsed.success) return invalid(res, parsed.error)
    const [zone] = await db.insert(zones).values({
      name: parsed.data.name,
      location: parsed.data.location,
      moistureThreshold: parsed.data.moistureThreshold === undefined ? undefined : String(parsed.data.moistureThreshold),
      userId: userId(req),
    }).returning()
    res.status(201).json(serializeZone(zone))
  } catch (error) { next(error) }
})

api.get('/zones/:zoneId', async (req, res, next) => {
  try {
    const [zone] = await db.select().from(zones).where(and(eq(zones.id, req.params.zoneId), eq(zones.userId, userId(req)))).limit(1)
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    res.json(serializeZone(zone))
  } catch (error) { next(error) }
})

api.patch('/zones/:zoneId', async (req, res, next) => {
  try {
    const parsed = zoneInput.partial().safeParse(req.body)
    if (!parsed.success) return invalid(res, parsed.error)
    const [zone] = await db.update(zones).set({
      ...parsed.data,
      moistureThreshold: parsed.data.moistureThreshold === undefined ? undefined : String(parsed.data.moistureThreshold),
      updatedAt: new Date(),
    }).where(and(eq(zones.id, req.params.zoneId), eq(zones.userId, userId(req)))).returning()
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    res.json(serializeZone(zone))
  } catch (error) { next(error) }
})

api.delete('/zones/:zoneId', async (req, res, next) => {
  try {
    const [zone] = await db.delete(zones).where(and(eq(zones.id, req.params.zoneId), eq(zones.userId, userId(req)))).returning({ id: zones.id })
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    res.status(204).end()
  } catch (error) { next(error) }
})

api.get('/zones/:zoneId/readings', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
    const rows = await db.select().from(sensorReadings).where(and(eq(sensorReadings.zoneId, req.params.zoneId), eq(sensorReadings.userId, userId(req)))).orderBy(desc(sensorReadings.recordedAt)).limit(limit)
    res.json(rows.map(serializeReading))
  } catch (error) { next(error) }
})

api.post('/zones/:zoneId/readings', async (req, res, next) => {
  try {
    const parsed = readingInput.safeParse(req.body)
    if (!parsed.success) return invalid(res, parsed.error)
    const owner = userId(req)
    const [zone] = await db.select({ id: zones.id }).from(zones).where(and(eq(zones.id, req.params.zoneId), eq(zones.userId, owner))).limit(1)
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    const [reading] = await db.transaction(async (tx) => {
      const [created] = await tx.insert(sensorReadings).values({
        soilMoisture: String(parsed.data.soilMoisture),
        temperature: parsed.data.temperature == null ? null : String(parsed.data.temperature),
        ph: parsed.data.ph == null ? null : String(parsed.data.ph),
        recordedAt: parsed.data.recordedAt,
        zoneId: zone.id,
        userId: owner,
      }).returning()
      await tx.update(zones).set({ soilMoisture: String(parsed.data.soilMoisture), temperature: parsed.data.temperature == null ? null : String(parsed.data.temperature), ph: parsed.data.ph == null ? null : String(parsed.data.ph), updatedAt: new Date() }).where(and(eq(zones.id, zone.id), eq(zones.userId, owner)))
      return [created]
    })
    res.status(201).json(serializeReading(reading))
  } catch (error) { next(error) }
})

api.get('/stats', async (req, res, next) => {
  try {
    const owner = userId(req)
    const [allZones, irrigationZones, moisture] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(zones).where(eq(zones.userId, owner)),
      db.select({ count: sql<number>`count(*)::int` }).from(zones).where(and(eq(zones.userId, owner), sql`${zones.soilMoisture} < ${zones.moistureThreshold}`)),
      db.select({ average: sql<string | null>`avg(${zones.soilMoisture})` }).from(zones).where(and(eq(zones.userId, owner), sql`${zones.soilMoisture} is not null`)),
    ])
    res.json({ totalZones: allZones[0]?.count ?? 0, zonesToIrrigate: irrigationZones[0]?.count ?? 0, averageMoisture: moisture[0]?.average === null ? null : Number(moisture[0]?.average) })
  } catch (error) { next(error) }
})

api.get('/irrigation-events', async (req, res, next) => {
  try {
    const rows = await db.select().from(irrigationEvents).where(eq(irrigationEvents.userId, userId(req))).orderBy(desc(irrigationEvents.createdAt)).limit(100)
    res.json(rows.map(serializeIrrigationEvent))
  } catch (error) { next(error) }
})

api.post('/zones/:zoneId/irrigation-events', async (req, res, next) => {
  try {
    const parsed = irrigationInput.safeParse(req.body ?? {})
    if (!parsed.success) return invalid(res, parsed.error)
    const owner = userId(req)
    const [zone] = await db.select({ id: zones.id }).from(zones).where(and(eq(zones.id, req.params.zoneId), eq(zones.userId, owner))).limit(1)
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    const [event] = await db.insert(irrigationEvents).values({
      amountLiters: parsed.data.amountLiters == null ? null : String(parsed.data.amountLiters),
      zoneId: zone.id,
      userId: owner,
      status: 'completed',
      completedAt: new Date(),
    }).returning()
    res.status(201).json(serializeIrrigationEvent(event))
  } catch (error) { next(error) }
})
