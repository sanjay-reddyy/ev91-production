import express, { Request, Response } from 'express';

const router = express.Router();

// Assign a vehicle to a rider
router.post('/:id/assign', async (req: Request, res: Response) => {
  // TODO: Assign vehicle to rider, update status
  const { riderId } = req.body;
  // Save assignment in DB
  res.json({ message: `Vehicle ${req.params.id} assigned to rider ${riderId}` });
});

// Return/handover a vehicle
router.post('/:id/return', async (req: Request, res: Response) => {
  // TODO: Mark vehicle as returned, update status, log handover
  const { riderId, condition, notes } = req.body;
  // Save handover in DB
  res.json({ message: `Vehicle ${req.params.id} returned by rider ${riderId}` });
});

// Get handover/return history for a vehicle
router.get('/:id/history', async (req: Request, res: Response) => {
  // TODO: Fetch handover/return history from DB
  res.json({ history: [] });
});

export default router;
