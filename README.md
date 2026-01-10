# PuckArena

Real-time multi-user interactive puck system with physics simulation.

## Features

- **400+ physics-enabled pucks** with realistic air hockey physics
- **Real-time multiplayer** - all users see and interact with the same pucks simultaneously
- **Admin panel** for managing pucks, colors, and physics settings
- **WebGL rendering** with PixiJS for smooth 60fps performance
- **Server-authoritative physics** with Matter.js for consistent state
- **Visual effects** - trails, glow effects, and tap ripples
- **Mobile-friendly** - touch support with responsive viewport

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Install dependencies
pnpm install

# Build native modules (if needed)
cd node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
npm run build-release
cd ../../../../../..

# Build shared package
pnpm build:shared
```

### Development

Run all services in parallel:
```bash
pnpm dev
```

Or run individually:
```bash
# API Server (http://localhost:3001)
pnpm dev:api

# Arena Frontend (http://localhost:5173)
pnpm dev:arena

# Admin Panel (http://localhost:5174)
pnpm dev:admin
```

### Default Admin Credentials
- Email: `admin@puckarena.com`
- Password: `changeme123`

## Project Structure

```
puck-arena/
├── packages/
│   ├── api/          # Express + Socket.io backend
│   ├── arena/        # React public arena frontend
│   ├── admin/        # React admin panel
│   └── shared/       # Shared TypeScript types
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/pucks | List all pucks |
| POST | /api/pucks | Create puck (auth required) |
| PUT | /api/pucks/:id | Update puck (auth required) |
| DELETE | /api/pucks/:id | Delete puck (auth required) |
| GET | /api/settings | Get physics settings |
| PUT | /api/settings | Update settings (auth required) |
| POST | /api/auth/login | Admin login |

## WebSocket Events

### Client → Server
- `tap`: Send tap interaction `{ type: 'tap', x: number, y: number }`

### Server → Client
- `fullSync`: Initial state with all pucks and settings
- `state`: Position updates at 30Hz
- `configUpdate`: When admin changes pucks/settings
- `userCount`: Connected user count updates

## Physics Presets

The admin panel includes several physics presets:

| Preset | Gravity | Friction | Bounce | Air Friction |
|--------|---------|----------|--------|--------------|
| Air Hockey | 0 | 0.005 | 0.95 | 0.0005 |
| Pinball | 0.8 | 0.02 | 0.85 | 0.002 |
| Pool Table | 0 | 0.05 | 0.8 | 0.02 |
| Bouncy Castle | 0.3 | 0.001 | 0.98 | 0.0001 |
| Zero Gravity | 0 | 0.001 | 0.99 | 0.0001 |

## Architecture

### Server-Side Physics
- Matter.js physics engine running at 60Hz
- State broadcast to clients at 30Hz
- Delta compression (only changed pucks sent)
- Server is authoritative for all physics calculations

### Client-Side Rendering
- PixiJS WebGL rendering
- Object pooling for effects
- Client-side interpolation for smooth animation
- Trail and glow visual effects

## Environment Variables

```env
# API Server
PORT=3001
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@puckarena.com
ADMIN_PASSWORD=changeme123

# Frontends
VITE_API_URL=http://localhost:3001
```

## Technologies

- **Backend**: Node.js, Express, Socket.io, Drizzle ORM, SQLite
- **Frontend**: React 19, Vite, Tailwind CSS
- **Physics**: Matter.js (server), PixiJS (client rendering)
- **Types**: TypeScript throughout

## License

MIT
