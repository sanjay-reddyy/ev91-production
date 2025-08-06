import { Router } from 'express';
import { SupplierController } from '../controllers/SupplierController';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const supplierController = new SupplierController();

// Get all suppliers
router.get('/', 
  authMiddleware,
  asyncHandler(supplierController.getSuppliers.bind(supplierController))
);

// Get supplier by ID
router.get('/:id', 
  authMiddleware,
  asyncHandler(supplierController.getSupplier.bind(supplierController))
);

// Create new supplier
router.post('/', 
  authMiddleware,
  asyncHandler(supplierController.createSupplier.bind(supplierController))
);

// Update supplier
router.put('/:id', 
  authMiddleware,
  asyncHandler(supplierController.updateSupplier.bind(supplierController))
);

// Delete supplier
router.delete('/:id', 
  authMiddleware,
  asyncHandler(supplierController.deleteSupplier.bind(supplierController))
);

export default router;
