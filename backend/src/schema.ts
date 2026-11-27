import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const zones = pgTable('zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  location: text('location'),
  soilMoisture: numeric('soil_moisture', { precision: 5, scale: 2 }),
  temperature: numeric('temperature', { precision: 5, scale: 2 }),
  ph: numeric('ph', { precision: 4, scale: 2 }),
  moistureThreshold: numeric('moisture_threshold', { precision: 5, scale: 2 }).notNull().default('30'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('zones_user_created_idx').on(table.userId, table.createdAt)])

export const sensorReadings = pgTable('sensor_readings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  zoneId: uuid('zone_id').notNull().references(() => zones.id, { onDelete: 'cascade' }),
  soilMoisture: numeric('soil_moisture', { precision: 5, scale: 2 }).notNull(),
  temperature: numeric('temperature', { precision: 5, scale: 2 }),
  ph: numeric('ph', { precision: 4, scale: 2 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('readings_user_zone_recorded_idx').on(table.userId, table.zoneId, table.recordedAt)])

export const irrigationEvents = pgTable('irrigation_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  zoneId: uuid('zone_id').notNull().references(() => zones.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('completed'),
  amountLiters: numeric('amount_liters', { precision: 10, scale: 2 }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('irrigation_user_created_idx').on(table.userId, table.createdAt)])
