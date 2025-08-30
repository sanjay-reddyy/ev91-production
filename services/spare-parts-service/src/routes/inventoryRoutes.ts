import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();
const inventoryController = new InventoryController();

// GET /api/v1/inventory/stock-levels - Get all stock levels (basic auth only)
router.get('/stock-levels', 
  authMiddleware,
  asyncHandler(inventoryController.getStockLevels.bind(inventoryController))
);

// GET /api/v1/inventory/stock-levels/:storeId/:sparePartId - Get specific stock level (basic auth only)
router.get('/stock-levels/:storeId/:sparePartId', 
  authMiddleware,
  asyncHandler(inventoryController.getStockLevel.bind(inventoryController))
);

// POST /api/v1/inventory/initialize-stock - Initialize stock for new spare part
router.post('/initialize-stock', 
  authMiddleware,
  asyncHandler(inventoryController.initializeStock.bind(inventoryController))
);

// POST /api/v1/inventory/stock-movement - Create stock movement
router.post('/stock-movement', 
  authMiddleware,
  asyncHandler(inventoryController.createStockMovement.bind(inventoryController))
);

// POST /api/v1/inventory/reserve-stock - Reserve stock
router.post('/reserve-stock', 
  authMiddleware,
  asyncHandler(inventoryController.reserveStock.bind(inventoryController))
);

// POST /api/v1/inventory/release-stock - Release reserved stock
router.post('/release-stock', 
  authMiddleware,
  asyncHandler(inventoryController.releaseReservedStock.bind(inventoryController))
);

// GET /api/v1/inventory/low-stock-alerts - Get low stock alerts (basic auth only)
router.get('/low-stock-alerts', 
  authMiddleware,
  asyncHandler(inventoryController.getLowStockAlerts.bind(inventoryController))
);

// POST /api/v1/inventory/stock-count - Perform stock count
router.post('/stock-count', 
  authMiddleware,
  asyncHandler(inventoryController.performStockCount.bind(inventoryController))
);

export default router;
