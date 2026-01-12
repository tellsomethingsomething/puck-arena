import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { convertRecordsToSettings, findSettingByKey } from '../db/utils.js';
import { SETTINGS_KEYS, type PhysicsSettings } from '@puck-arena/shared';

const router: RouterType = Router();

// GET /api/settings - Get all settings (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settingsRecords = await db.select().from(schema.settings);
    const settings = convertRecordsToSettings(settingsRecords);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/:key - Update setting (admin only)
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: 'Bad Request', message: 'value required' });
      return;
    }

    // Validate key is a valid setting
    const validKeys = Object.values(SETTINGS_KEYS);
    if (!validKeys.includes(key as typeof validKeys[number])) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid setting key' });
      return;
    }

    // Update or insert setting
    const existing = await findSettingByKey(key);

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Setting not found' });
      return;
    }

    await db
      .update(schema.settings)
      .set({
        value: String(value),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.settings.key, key));

    const updated = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .limit(1);

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update setting' });
  }
});

// PUT /api/settings - Bulk update settings (admin only)
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates: Partial<PhysicsSettings> = req.body;

    const keyMap: Record<keyof PhysicsSettings, string> = {
      gravityX: SETTINGS_KEYS.GRAVITY_X,
      gravityY: SETTINGS_KEYS.GRAVITY_Y,
      friction: SETTINGS_KEYS.FRICTION,
      restitution: SETTINGS_KEYS.RESTITUTION,
      airFriction: SETTINGS_KEYS.AIR_FRICTION,
      maxPucks: SETTINGS_KEYS.MAX_PUCKS,
      archGravity: SETTINGS_KEYS.ARCH_GRAVITY,
    };

    for (const [prop, dbKey] of Object.entries(keyMap)) {
      const value = updates[prop as keyof PhysicsSettings];
      if (value !== undefined) {
        await db
          .update(schema.settings)
          .set({
            value: String(value),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.settings.key, dbKey));
      }
    }

    // Return updated settings
    const settingsRecords = await db.select().from(schema.settings);
    const settings = convertRecordsToSettings(settingsRecords);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update settings' });
  }
});

export default router;
