import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema.js';
import { DEFAULT_PHYSICS, DEFAULT_PUCK, SETTINGS_KEYS } from '@puck-arena/shared';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Initialize database with tables and seed data
export function initializeDatabase() {
  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS pucks (
      id TEXT PRIMARY KEY,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      logo_url TEXT,
      size REAL NOT NULL DEFAULT 30,
      mass REAL NOT NULL DEFAULT 1,
      label TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      peak_users INTEGER NOT NULL DEFAULT 0,
      total_interactions INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed default settings if they don't exist
  const existingSettings = sqlite.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };

  if (existingSettings.count === 0) {
    const insertSetting = sqlite.prepare(
      'INSERT INTO settings (id, key, value) VALUES (?, ?, ?)'
    );

    insertSetting.run(uuidv4(), SETTINGS_KEYS.GRAVITY_X, String(DEFAULT_PHYSICS.gravityX));
    insertSetting.run(uuidv4(), SETTINGS_KEYS.GRAVITY_Y, String(DEFAULT_PHYSICS.gravityY));
    insertSetting.run(uuidv4(), SETTINGS_KEYS.FRICTION, String(DEFAULT_PHYSICS.friction));
    insertSetting.run(uuidv4(), SETTINGS_KEYS.RESTITUTION, String(DEFAULT_PHYSICS.restitution));
    insertSetting.run(uuidv4(), SETTINGS_KEYS.AIR_FRICTION, String(DEFAULT_PHYSICS.airFriction));
    insertSetting.run(uuidv4(), SETTINGS_KEYS.MAX_PUCKS, String(DEFAULT_PHYSICS.maxPucks));
    insertSetting.run(uuidv4(), SETTINGS_KEYS.ARCH_GRAVITY, String(DEFAULT_PHYSICS.archGravity));

    console.log('Seeded default settings');
  }

  // Seed some initial pucks if none exist
  const existingPucks = sqlite.prepare('SELECT COUNT(*) as count FROM pucks').get() as { count: number };

  if (existingPucks.count === 0) {
    const insertPuck = sqlite.prepare(
      'INSERT INTO pucks (id, color, size, mass, label) VALUES (?, ?, ?, ?, ?)'
    );

    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

    // Create 50 initial pucks with varied colors
    for (let i = 0; i < 50; i++) {
      const color = colors[i % colors.length];
      insertPuck.run(uuidv4(), color, DEFAULT_PUCK.size, DEFAULT_PUCK.mass, null);
    }

    console.log('Seeded 50 initial pucks');
  }

  console.log('Database initialized');
}

export { schema };
