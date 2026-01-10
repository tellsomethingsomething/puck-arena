// ============================================
// Default Physics Configuration
// ============================================

export const DEFAULT_PHYSICS: {
  gravityX: number;
  gravityY: number;
  friction: number;
  restitution: number;
  airFriction: number;
  maxPucks: number;
  archGravity: number;
} = {
  gravityX: 0,
  gravityY: 0, // Zero gravity for air hockey feel
  friction: 0.005, // Very low friction
  restitution: 0.95, // High bounciness
  airFriction: 0.0005, // Minimal air resistance
  maxPucks: 100,
  archGravity: 0, // 0 = off, >0 = LED arch mode (pucks fall toward edges)
};

// ============================================
// Puck Defaults
// ============================================

export const DEFAULT_PUCK = {
  color: '#3B82F6',
  size: 30,
  mass: 1,
};

// ============================================
// Interaction Settings
// ============================================

export const INTERACTION = {
  forceMultiplier: 0.05,
  maxForce: 0.5,
  tapRadius: 50, // Pixels around tap to affect pucks
};

// ============================================
// Sync Settings
// ============================================

export const SYNC = {
  updateRate: 30, // Hz - updates per second
  interpolationDelay: 100, // ms
};

// ============================================
// Wall Settings
// ============================================

export const WALLS = {
  restitution: 0.95,
  friction: 0,
  thickness: 50,
};

// ============================================
// Color Palette (for admin quick selection)
// ============================================

export const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

// ============================================
// Settings Keys
// ============================================

export const SETTINGS_KEYS = {
  GRAVITY_X: 'gravity_x',
  GRAVITY_Y: 'gravity_y',
  FRICTION: 'friction',
  RESTITUTION: 'restitution',
  AIR_FRICTION: 'air_friction',
  MAX_PUCKS: 'max_pucks',
  ARCH_GRAVITY: 'arch_gravity',
} as const;
