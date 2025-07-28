import express, { Request, Response } from 'express';

const router = express.Router();

// Onboard a new store for a client
router.post('/', async (req: Request, res: Response) => {
  // TODO: Validate and save store (store name, clientId, mobile, address, incharge name, type, city)
  const { storeName, clientId, mobile, address, inchargeName, type, city } = req.body;
  // Save to DB here
  res.json({ message: 'Store onboarded', store: { storeName, clientId, mobile, address, inchargeName, type, city } });
});

// List all stores for a client
router.get('/by-client/:clientId', async (req: Request, res: Response) => {
  // TODO: Fetch all stores for a client from DB
  res.json({ stores: [] });
});

export default router;
