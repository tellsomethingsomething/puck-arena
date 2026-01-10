// ============================================
// Database Types
// ============================================

export interface Puck {
  id: string;
  color: string;
  logoUrl: string | null;
  size: number;
  mass: number;
  label: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

export interface Session {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  peakUsers: number;
  totalInteractions: number;
}

// ============================================
// Physics Types
// ============================================

export interface PhysicsSettings {
  gravityX: number;
  gravityY: number;
  friction: number;
  restitution: number;
  airFriction: number;
  maxPucks: number;
  archGravity: number; // 0 = off, >0 = strength of outward gravity from center
}

export interface PuckState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}

export interface PuckConfig {
  id: string;
  color: string;
  logoUrl: string | null;
  size: number;
  mass: number;
  label: string | null;
}

// ============================================
// WebSocket Message Types
// ============================================

// Client -> Server
export interface TapEvent {
  type: 'tap';
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  force?: number;
}

export interface JoinEvent {
  type: 'join';
  clientId: string;
}

export type ClientMessage = TapEvent | JoinEvent;

// Server -> Client
export interface StateUpdate {
  type: 'state';
  tick: number;
  pucks: PuckState[];
  timestamp: number;
}

export interface FullSync {
  type: 'fullSync';
  pucks: PuckConfig[];
  positions: PuckState[];
  settings: PhysicsSettings;
  userCount: number;
}

export interface ConfigUpdate {
  type: 'configUpdate';
  pucks?: PuckConfig[];
  settings?: Partial<PhysicsSettings>;
}

export interface UserCountUpdate {
  type: 'userCount';
  count: number;
}

export type ServerMessage = StateUpdate | FullSync | ConfigUpdate | UserCountUpdate;

// ============================================
// API Types
// ============================================

export interface CreatePuckRequest {
  color?: string;
  logoUrl?: string | null;
  size?: number;
  mass?: number;
  label?: string | null;
}

export interface UpdatePuckRequest {
  color?: string;
  logoUrl?: string | null;
  size?: number;
  mass?: number;
  label?: string | null;
  active?: boolean;
}

export interface BulkPuckRequest {
  pucks: CreatePuckRequest[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    email: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
}

// ============================================
// Auth Types
// ============================================

export interface JwtPayload {
  email: string;
  iat: number;
  exp: number;
}
