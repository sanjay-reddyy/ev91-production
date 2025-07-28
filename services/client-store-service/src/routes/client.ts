import express, { Request, Response } from 'express';

const router = express.Router();

// Onboard a new client
router.post('/', async (req: Request, res: Response) => {
  // TODO: Validate and save client (name, email, mobile, price per order, city)
  const { name, email, mobile, pricePerOrder, city } = req.body;
  // Save to DB here
  res.json({ message: 'Client onboarded', client: { name, email, mobile, pricePerOrder, city } });
});

// List all clients
router.get('/', async (req: Request, res: Response) => {
  // TODO: Fetch all clients from DB
  res.json({ clients: [] });
});

export default router;
