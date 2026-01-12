import type { SettingRecord, PuckRecord } from './schema.js';
import { SETTINGS_KEYS, DEFAULT_PHYSICS, type PhysicsSettings, type PuckConfig } from '@puck-arena/shared';

/**
 * Converts a puck database record to PuckConfig
 */
export function puckRecordToConfig(puck: PuckRecord): PuckConfig {
  return {
    id: puck.id,
    color: puck.color,
    logoUrl: puck.logoUrl,
    size: puck.size,
    mass: puck.mass,
    label: puck.label,
  };
}

/**
 * Converts active puck database records to PuckConfig array
 */
export function getActivePuckConfigs(puckRecords: PuckRecord[]): PuckConfig[] {
  return puckRecords
    .filter((p) => p.active)
    .map(puckRecordToConfig);
}

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
