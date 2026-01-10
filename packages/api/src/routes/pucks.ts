import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db/index.js';
import { DEFAULT_PUCK } from '@puck-arena/shared';
import type { CreatePuckRequest, UpdatePuckRequest } from '@puck-arena/shared';

const router = Router();

// GET /api/pucks - List all pucks (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const pucks = await db.select().from(schema.pucks);
    res.json(pucks);
  } catch (error) {
    console.error('Error fetching pucks:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch pucks' });
  }
});

// GET /api/pucks/:id - Get single puck (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const puck = await db
      .select()
      .from(schema.pucks)
      .where(eq(schema.pucks.id, req.params.id))
      .limit(1);

    if (puck.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Puck not found' });
      return;
    }

    res.json(puck[0]);
  } catch (error) {
    console.error('Error fetching puck:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch puck' });
  }
});

// POST /api/pucks - Create puck (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreatePuckRequest = req.body;

    const newPuck: schema.NewPuck = {
      id: uuidv4(),
      color: data.color || DEFAULT_PUCK.color,
      logoUrl: data.logoUrl || null,
      size: data.size || DEFAULT_PUCK.size,
      mass: data.mass || DEFAULT_PUCK.mass,
      label: data.label || null,
      active: true,
    };

    await db.insert(schema.pucks).values(newPuck);
    const created = await db
      .select()
      .from(schema.pucks)
      .where(eq(schema.pucks.id, newPuck.id))
      .limit(1);

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating puck:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create puck' });
  }
});

// PUT /api/pucks/:id - Update puck (admin only)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data: UpdatePuckRequest = req.body;
    const { id } = req.params;

    // Check if puck exists
    const existing = await db
      .select()
      .from(schema.pucks)
      .where(eq(schema.pucks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Puck not found' });
      return;
    }

    // Update puck
    await db
      .update(schema.pucks)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.pucks.id, id));

    const updated = await db
      .select()
      .from(schema.pucks)
      .where(eq(schema.pucks.id, id))
      .limit(1);

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating puck:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update puck' });
  }
});

// DELETE /api/pucks/:id - Delete puck (admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if puck exists
    const existing = await db
      .select()
      .from(schema.pucks)
      .where(eq(schema.pucks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Puck not found' });
      return;
    }

    await db.delete(schema.pucks).where(eq(schema.pucks.id, id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting puck:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete puck' });
  }
});

// POST /api/pucks/bulk - Bulk create pucks (admin only)
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { pucks: pucksData } = req.body;

    if (!Array.isArray(pucksData) || pucksData.length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'pucks array required' });
      return;
    }

    const newPucks: schema.NewPuck[] = pucksData.map((data: CreatePuckRequest) => ({
      id: uuidv4(),
      color: data.color || DEFAULT_PUCK.color,
      logoUrl: data.logoUrl || null,
      size: data.size || DEFAULT_PUCK.size,
      mass: data.mass || DEFAULT_PUCK.mass,
      label: data.label || null,
      active: true,
    }));

    await db.insert(schema.pucks).values(newPucks);

    res.status(201).json({ created: newPucks.length });
  } catch (error) {
    console.error('Error bulk creating pucks:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to bulk create pucks' });
  }
});

export default router;
