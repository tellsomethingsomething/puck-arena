import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeDatabase } from './db/index.js';
import { initializeSocket, refreshPucksFromDb, refreshSettingsFromDb } from './socket/index.js';
import authRoutes from './routes/auth.js';
import pucksRoutes from './routes/pucks.js';
import settingsRoutes from './routes/settings.js';

const PORT = process.env.PORT || 3001;

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5177', 'http://localhost:5178'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pucks', pucksRoutes);
app.use('/api/settings', settingsRoutes);

// Hook to refresh socket state after admin changes
// This is called after puck/settings updates
app.use('/api/pucks', (_req, res, next) => {
  res.on('finish', () => {
    if (['POST', 'PUT', 'DELETE'].includes(_req.method)) {
      refreshPucksFromDb().catch(console.error);
    }
  });
  next();
});

app.use('/api/settings', (_req, res, next) => {
  res.on('finish', () => {
    if (['PUT'].includes(_req.method)) {
      refreshSettingsFromDb().catch(console.error);
    }
  });
  next();
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Resource not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Initialize database and start server
async function main() {
  try {
    // Initialize database with tables and seed data
    initializeDatabase();

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║          PuckArena API Server              ║
╠════════════════════════════════════════════╣
║  HTTP:   http://localhost:${PORT}            ║
║  WS:     ws://localhost:${PORT}              ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
