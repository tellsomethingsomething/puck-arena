import { Router, Request, Response } from 'express';
import { generateToken, authenticateToken, AuthRequest, verifyToken } from '../middleware/auth.js';

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@puckarena.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Bad Request', message: 'Email and password required' });
    return;
  }

  // Simple auth check (in production, use proper password hashing)
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = generateToken(email);
    res.json({ token, user: { email } });
  } else {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
  }
});

// GET /api/auth/verify
router.get('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ valid: true, user: { email: req.user?.email } });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Bad Request', message: 'Token required' });
    return;
  }

  const decoded = verifyToken(token);
  if (decoded) {
    const newToken = generateToken(decoded.email);
    res.json({ token: newToken, user: { email: decoded.email } });
  } else {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
});

export default router;
