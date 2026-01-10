import Matter from 'matter-js';
import type { PuckState, PuckConfig, PhysicsSettings } from '@puck-arena/shared';
import { WALLS } from '@puck-arena/shared';

// Server-side physics state using Matter.js
export interface PhysicsState {
  engine: Matter.Engine;
  world: Matter.World;
  bodies: Map<string, Matter.Body>;
  puckConfigs: Map<string, PuckConfig>;
  settings: PhysicsSettings;
  worldWidth: number;
  worldHeight: number;
  walls: Matter.Body[];
}

// Initialize physics state from puck configs
export function initializePhysicsState(
  puckConfigs: PuckConfig[],
  settings: PhysicsSettings,
  worldWidth: number = 1920,
  worldHeight: number = 1080
): PhysicsState {
  // Create Matter.js engine with optimized settings
  const engine = Matter.Engine.create({
    gravity: { x: settings.gravityX, y: settings.gravityY },
    positionIterations: 4,
    velocityIterations: 3,
    constraintIterations: 1,
  });

  const world = engine.world;
  const bodies = new Map<string, Matter.Body>();
  const configs = new Map<string, PuckConfig>();

  // Create boundary walls
  const walls = createWalls(world, worldWidth, worldHeight);

  // Create puck bodies
  puckConfigs.forEach((config) => {
    const padding = config.size;
    const x = padding + Math.random() * (worldWidth - 2 * padding);
    const y = padding + Math.random() * (worldHeight - 2 * padding);

    const body = Matter.Bodies.circle(x, y, config.size / 2, {
      restitution: settings.restitution,
      friction: settings.friction,
      frictionAir: settings.airFriction,
      density: config.mass * 0.001,
      label: config.id,
      slop: 0.01,
    });

    // Random initial velocity for visual interest
    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * 3,
    });

    Matter.World.add(world, body);
    bodies.set(config.id, body);
    configs.set(config.id, config);
  });

  return {
    engine,
    world,
    bodies,
    puckConfigs: configs,
    settings,
    worldWidth,
    worldHeight,
    walls,
  };
}

function createWalls(world: Matter.World, width: number, height: number): Matter.Body[] {
  const thickness = WALLS.thickness;
  const options = {
    isStatic: true,
    restitution: WALLS.restitution,
    friction: WALLS.friction,
    render: { visible: false },
  };

  const walls = [
    // Top
    Matter.Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, {
      ...options,
      label: 'wall-top',
    }),
    // Bottom
    Matter.Bodies.rectangle(width / 2, height + thickness / 2, width + thickness * 2, thickness, {
      ...options,
      label: 'wall-bottom',
    }),
    // Left
    Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, {
      ...options,
      label: 'wall-left',
    }),
    // Right
    Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + thickness * 2, {
      ...options,
      label: 'wall-right',
    }),
  ];

  Matter.World.add(world, walls);
  return walls;
}

// Step physics simulation
export function stepPhysics(state: PhysicsState, deltaTime: number = 1000 / 60): void {
  // Apply arch gravity if enabled (LED arch mode - pucks fall toward edges)
  if (state.settings.archGravity > 0) {
    const centerX = state.worldWidth / 2;
    const strength = state.settings.archGravity * 0.0001; // Scale down for gentle effect

    state.bodies.forEach((body) => {
      // Calculate horizontal distance from center
      const dx = body.position.x - centerX;
      // Normalize to -1 to 1 range (left to right of center)
      const normalizedX = dx / centerX;
      // Apply force proportional to distance from center
      // Further from center = stronger pull toward that edge
      const forceX = normalizedX * strength * body.mass;

      Matter.Body.applyForce(body, body.position, { x: forceX, y: 0 });
    });
  }

  Matter.Engine.update(state.engine, deltaTime);
}

// Get all puck states for broadcasting
export function getAllPuckStates(state: PhysicsState): PuckState[] {
  const states: PuckState[] = [];

  state.bodies.forEach((body, id) => {
    states.push({
      id,
      x: body.position.x,
      y: body.position.y,
      vx: body.velocity.x,
      vy: body.velocity.y,
      angle: body.angle,
    });
  });

  return states;
}

// Get only pucks that have moved significantly (for delta compression)
export function getChangedPuckStates(
  state: PhysicsState,
  threshold: number = 0.5
): PuckState[] {
  const states: PuckState[] = [];

  state.bodies.forEach((body, id) => {
    // Include pucks that are moving or have significant velocity
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    if (speed > threshold) {
      states.push({
        id,
        x: body.position.x,
        y: body.position.y,
        vx: body.velocity.x,
        vy: body.velocity.y,
        angle: body.angle,
      });
    }
  });

  return states;
}

// Apply force to pucks near tap location
export function applyTapForce(
  state: PhysicsState,
  normalizedX: number,
  normalizedY: number,
  tapRadius: number = 150,
  forceMultiplier: number = 0.08
): PuckState[] {
  const { worldWidth, worldHeight } = state;
  const tapX = normalizedX * worldWidth;
  const tapY = normalizedY * worldHeight;
  const affectedPucks: PuckState[] = [];

  state.bodies.forEach((body, id) => {
    const dx = body.position.x - tapX;
    const dy = body.position.y - tapY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < tapRadius && distance > 0) {
      // Force falls off with distance (inverse square-ish)
      const falloff = Math.pow(1 - distance / tapRadius, 1.5);
      const forceMagnitude = forceMultiplier * falloff;

      // Direction away from tap point
      const fx = (dx / distance) * forceMagnitude;
      const fy = (dy / distance) * forceMagnitude;

      // Apply force at center of body
      Matter.Body.applyForce(body, body.position, { x: fx, y: fy });

      affectedPucks.push({
        id,
        x: body.position.x,
        y: body.position.y,
        vx: body.velocity.x,
        vy: body.velocity.y,
        angle: body.angle,
      });
    }
  });

  return affectedPucks;
}

// Add a new puck to physics
export function addPuck(state: PhysicsState, config: PuckConfig): PuckState {
  const padding = config.size;
  const x = padding + Math.random() * (state.worldWidth - 2 * padding);
  const y = padding + Math.random() * (state.worldHeight - 2 * padding);

  const body = Matter.Bodies.circle(x, y, config.size / 2, {
    restitution: state.settings.restitution,
    friction: state.settings.friction,
    frictionAir: state.settings.airFriction,
    density: config.mass * 0.001,
    label: config.id,
  });

  Matter.World.add(state.world, body);
  state.bodies.set(config.id, body);
  state.puckConfigs.set(config.id, config);

  return {
    id: config.id,
    x: body.position.x,
    y: body.position.y,
    vx: body.velocity.x,
    vy: body.velocity.y,
    angle: body.angle,
  };
}

// Remove puck from physics
export function removePuck(state: PhysicsState, puckId: string): boolean {
  const body = state.bodies.get(puckId);
  if (body) {
    Matter.World.remove(state.world, body);
    state.bodies.delete(puckId);
    state.puckConfigs.delete(puckId);
    return true;
  }
  return false;
}

// Update physics settings
export function updateSettings(state: PhysicsState, newSettings: Partial<PhysicsSettings>): void {
  state.settings = { ...state.settings, ...newSettings };

  // Update engine gravity
  if (newSettings.gravityX !== undefined || newSettings.gravityY !== undefined) {
    state.engine.gravity.x = state.settings.gravityX;
    state.engine.gravity.y = state.settings.gravityY;
  }

  // Update all body properties
  if (
    newSettings.friction !== undefined ||
    newSettings.restitution !== undefined ||
    newSettings.airFriction !== undefined
  ) {
    state.bodies.forEach((body) => {
      body.friction = state.settings.friction;
      body.restitution = state.settings.restitution;
      body.frictionAir = state.settings.airFriction;
    });
  }
}

// Resize world (recreates walls)
export function resizeWorld(state: PhysicsState, width: number, height: number): void {
  // Remove old walls
  state.walls.forEach((wall) => {
    Matter.World.remove(state.world, wall);
  });

  // Create new walls
  state.walls = createWalls(state.world, width, height);
  state.worldWidth = width;
  state.worldHeight = height;

  // Clamp pucks to new bounds
  state.bodies.forEach((body) => {
    const config = state.puckConfigs.get(body.label);
    const radius = config ? config.size / 2 : 15;

    const clampedX = Math.max(radius, Math.min(width - radius, body.position.x));
    const clampedY = Math.max(radius, Math.min(height - radius, body.position.y));

    Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
  });
}
