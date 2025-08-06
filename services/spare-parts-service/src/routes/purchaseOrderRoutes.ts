import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Purchase Orders endpoint - to be implemented' });
  })
);

export default router;
