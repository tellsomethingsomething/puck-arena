import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { db, schema } from '../db/index.js';
import type { ClientMessage, PuckConfig, PhysicsSettings, FullSync, StateUpdate, ConfigUpdate } from '@puck-arena/shared';
import { SYNC, DEFAULT_PHYSICS, SETTINGS_KEYS } from '@puck-arena/shared';
import {
  PhysicsState,
  initializePhysicsState,
  stepPhysics,
  applyTapForce,
  getAllPuckStates,
  getChangedPuckStates,
  addPuck,
  removePuck,
  updateSettings,
} from './physics.js';

let io: Server;
let physicsState: PhysicsState;
let tick = 0;
let physicsInterval: ReturnType<typeof setInterval> | null = null;
let broadcastInterval: ReturnType<typeof setInterval> | null = null;

// Track connected users
const connectedClients = new Set<string>();

// Track total interactions for analytics
let totalInteractions = 0;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
    },
    // Optimize for real-time
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', handleConnection);

  // Initialize physics from database
  initializePhysicsFromDb().then(() => {
    startPhysicsLoop();
    startBroadcastLoop();
    console.log('Socket.io initialized and physics running');
  });

  return io;
}

async function initializePhysicsFromDb() {
  // Load pucks from database
  const puckRecords = await db.select().from(schema.pucks);
  const puckConfigs: PuckConfig[] = puckRecords
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      color: p.color,
      logoUrl: p.logoUrl,
      size: p.size,
      mass: p.mass,
      label: p.label,
    }));

  // Load settings from database
  const settingsRecords = await db.select().from(schema.settings);
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
    }
  }

  physicsState = initializePhysicsState(puckConfigs, settings);
  console.log(`Physics initialized with ${puckConfigs.length} pucks`);
}

function handleConnection(socket: Socket) {
  console.log(`Client connected: ${socket.id}`);
  connectedClients.add(socket.id);

  // Broadcast user count update
  broadcastUserCount();

  // Send full sync to new client
  sendFullSync(socket);

  // Handle tap events
  socket.on('tap', (data: ClientMessage) => {
    if (data.type === 'tap') {
      totalInteractions++;

      const affected = applyTapForce(
        physicsState,
        data.x,
        data.y,
        150, // tap radius
        data.force || 0.08
      );

      // Immediately broadcast tap effect to all clients
      io.emit('tapEffect', {
        x: data.x,
        y: data.y,
        timestamp: Date.now(),
      });

      // Broadcast affected pucks immediately for responsiveness
      if (affected.length > 0) {
        const update: StateUpdate = {
          type: 'state',
          tick: tick++,
          pucks: affected,
          timestamp: Date.now(),
        };
        io.emit('state', update);
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    broadcastUserCount();
  });
}

function broadcastUserCount() {
  io.emit('userCount', { type: 'userCount', count: connectedClients.size });
}

async function sendFullSync(socket: Socket) {
  // Reload puck configs from database
  const puckRecords = await db.select().from(schema.pucks);
  const puckConfigs: PuckConfig[] = puckRecords
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      color: p.color,
      logoUrl: p.logoUrl,
      size: p.size,
      mass: p.mass,
      label: p.label,
    }));

  const sync: FullSync = {
    type: 'fullSync',
    pucks: puckConfigs,
    positions: getAllPuckStates(physicsState),
    settings: physicsState.settings,
    userCount: connectedClients.size,
  };

  socket.emit('fullSync', sync);
}

function startPhysicsLoop() {
  // Run physics at 60Hz for smooth simulation
  const physicsRate = 60;
  physicsInterval = setInterval(() => {
    stepPhysics(physicsState, 1000 / physicsRate);
  }, 1000 / physicsRate);
}

function startBroadcastLoop() {
  // Broadcast state at configured rate (30Hz default)
  // Use delta compression - only send moving pucks
  let fullSyncCounter = 0;

  broadcastInterval = setInterval(() => {
    fullSyncCounter++;

    // Send full state every 2 seconds to ensure sync
    if (fullSyncCounter >= SYNC.updateRate * 2) {
      fullSyncCounter = 0;
      const allPucks = getAllPuckStates(physicsState);
      const update: StateUpdate = {
        type: 'state',
        tick: tick++,
        pucks: allPucks,
        timestamp: Date.now(),
      };
      io.emit('state', update);
    } else {
      // Send only changed pucks (delta compression)
      const changedPucks = getChangedPuckStates(physicsState, 0.1);
      if (changedPucks.length > 0) {
        const update: StateUpdate = {
          type: 'state',
          tick: tick++,
          pucks: changedPucks,
          timestamp: Date.now(),
        };
        io.emit('state', update);
      }
    }
  }, 1000 / SYNC.updateRate);
}

// Admin functions to update state
export async function refreshPucksFromDb() {
  const puckRecords = await db.select().from(schema.pucks);
  const activeIds = new Set(puckRecords.filter((p) => p.active).map((p) => p.id));

  // Remove pucks no longer in db or inactive
  physicsState.bodies.forEach((_, id) => {
    if (!activeIds.has(id)) {
      removePuck(physicsState, id);
    }
  });

  // Add new pucks
  const puckConfigs: PuckConfig[] = [];
  puckRecords
    .filter((p) => p.active)
    .forEach((p) => {
      const config: PuckConfig = {
        id: p.id,
        color: p.color,
        logoUrl: p.logoUrl,
        size: p.size,
        mass: p.mass,
        label: p.label,
      };
      puckConfigs.push(config);

      if (!physicsState.bodies.has(p.id)) {
        addPuck(physicsState, config);
      }
    });

  // Broadcast config update
  const configUpdate: ConfigUpdate = {
    type: 'configUpdate',
    pucks: puckConfigs,
  };
  io.emit('configUpdate', configUpdate);
}

export async function refreshSettingsFromDb() {
  const settingsRecords = await db.select().from(schema.settings);
  const newSettings: Partial<PhysicsSettings> = {};

  for (const record of settingsRecords) {
    switch (record.key) {
      case SETTINGS_KEYS.GRAVITY_X:
        newSettings.gravityX = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.GRAVITY_Y:
        newSettings.gravityY = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.FRICTION:
        newSettings.friction = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.RESTITUTION:
        newSettings.restitution = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.AIR_FRICTION:
        newSettings.airFriction = parseFloat(record.value);
        break;
      case SETTINGS_KEYS.MAX_PUCKS:
        newSettings.maxPucks = parseInt(record.value, 10);
        break;
    }
  }

  updateSettings(physicsState, newSettings);

  // Broadcast config update
  const configUpdate: ConfigUpdate = {
    type: 'configUpdate',
    settings: newSettings,
  };
  io.emit('configUpdate', configUpdate);
}

export function getConnectedUserCount(): number {
  return connectedClients.size;
}

export function getTotalInteractions(): number {
  return totalInteractions;
}

export function shutdown() {
  if (physicsInterval) clearInterval(physicsInterval);
  if (broadcastInterval) clearInterval(broadcastInterval);
  io?.close();
}
