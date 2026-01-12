import type { SettingRecord } from './schema.js';
import { SETTINGS_KEYS, DEFAULT_PHYSICS, type PhysicsSettings } from '@puck-arena/shared';

/**
 * Converts database setting records to PhysicsSettings object
 */
export function convertRecordsToSettings(settingsRecords: SettingRecord[]): PhysicsSettings {
  const settings: PhysicsSettings = { ...DEFAULT_PHYSICS };

  for (const record of settingsRecords) {
    switch (record.key) {
      case SETTINGS_KEYS.GRAVITY_X:
        settings.gravityX = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.GRAVITY_Y:
        settings.gravityY = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.FRICTION:
        settings.friction = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.RESTITUTION:
        settings.restitution = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.AIR_FRICTION:
        settings.airFriction = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.MAX_PUCKS:
        settings.maxPucks = parseInt(record.value, 10);
        break;
      case SETTINGS_KEYS.ARCH_GRAVITY:
        settings.archGravity = parseFloat(record.value);
        break;
    }
  }

  return settings;
}
