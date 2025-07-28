import { Router } from 'express';
import {
  getAllOEMs,
  getOEMById,
  createOEM,
  updateOEM,
  deleteOEM,
  getOEMStats
} from '../controllers/oemController';

const router = Router();

// GET /api/oems - Get all OEMs with optional filters
router.get('/', getAllOEMs);

// GET /api/oems/stats - Get OEM statistics
router.get('/stats', getOEMStats);

// GET /api/oems/:id - Get OEM by ID
router.get('/:id', getOEMById);

// POST /api/oems - Create new OEM
router.post('/', createOEM);

// PUT /api/oems/:id - Update OEM
router.put('/:id', updateOEM);

// DELETE /api/oems/:id - Delete OEM (soft delete by default)
router.delete('/:id', deleteOEM);

export default router;
