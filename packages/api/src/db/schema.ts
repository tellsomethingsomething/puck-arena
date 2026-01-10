import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Pucks table
export const pucks = sqliteTable('pucks', {
  id: text('id').primaryKey(),
  color: text('color').notNull().default('#3B82F6'),
  logoUrl: text('logo_url'),
  size: real('size').notNull().default(30),
  mass: real('mass').notNull().default(1),
  label: text('label'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Settings table
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Sessions table (for analytics)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startedAt: text('started_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  endedAt: text('ended_at'),
  peakUsers: integer('peak_users').notNull().default(0),
  totalInteractions: integer('total_interactions').notNull().default(0),
});

// Type exports
export type PuckRecord = typeof pucks.$inferSelect;
export type NewPuck = typeof pucks.$inferInsert;
export type SettingRecord = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type SessionRecord = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
