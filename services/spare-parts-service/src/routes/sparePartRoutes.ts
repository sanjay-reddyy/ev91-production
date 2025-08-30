import { Router } from 'express';
import { SparePartController } from '../controllers/SparePartController';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const sparePartController = new SparePartController();

// GET /api/v1/spare-parts - Get all spare parts with filtering and pagination
router.get('/', 
  authMiddleware,
  asyncHandler(sparePartController.getAll.bind(sparePartController))
);

// GET /api/v1/spare-parts/:id - Get spare part by ID
router.get('/:id', 
  authMiddleware,
  asyncHandler(sparePartController.getById.bind(sparePartController))
);

// POST /api/v1/spare-parts - Create new spare part
router.post('/', 
  authMiddleware,
  asyncHandler(sparePartController.create.bind(sparePartController))
);

// PUT /api/v1/spare-parts/:id - Update spare part
router.put('/:id', 
  authMiddleware,
  asyncHandler(sparePartController.update.bind(sparePartController))
);

// DELETE /api/v1/spare-parts/:id - Delete spare part
router.delete('/:id', 
  authMiddleware,
  asyncHandler(sparePartController.delete.bind(sparePartController))
);

// GET /api/v1/spare-parts/vehicle-model/:modelId - Get spare parts compatible with vehicle model
router.get('/vehicle-model/:modelId', 
  authMiddleware,
  asyncHandler(sparePartController.getByVehicleModel.bind(sparePartController))
);

// PATCH /api/v1/spare-parts/:id/pricing - Update spare part pricing
router.patch('/:id/pricing', 
  authMiddleware,
  asyncHandler(sparePartController.updatePricing.bind(sparePartController))
);

// POST /api/v1/spare-parts/bulk-update - Bulk update spare parts
router.post('/bulk-update', 
  authMiddleware,
  asyncHandler(sparePartController.bulkUpdate.bind(sparePartController))
);

// GET /api/v1/spare-parts/:id/price-history - Get price history for spare part
router.get('/:id/price-history', 
  authMiddleware,
  asyncHandler(sparePartController.getPriceHistory.bind(sparePartController))
);

// GET /api/v1/spare-parts/:id/usage-analytics - Get usage analytics for spare part
router.get('/:id/usage-analytics', 
  authMiddleware,
  asyncHandler(sparePartController.getUsageAnalytics.bind(sparePartController))
);

export default router;
