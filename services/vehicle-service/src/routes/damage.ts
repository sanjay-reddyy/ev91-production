import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getDamageRecords,
  getDamageRecord,
  createDamageRecord,
  updateDamageRecord,
  updateDamageStatus,
  deleteDamageRecord,
  getDamageStats
} from '../controllers/damageController';
import { validateRequest } from '../middleware/validation';

const router = Router();

// GET /api/v1/damage - Get all damage records with filtering and pagination
router.get('/', getDamageRecords);

// GET /api/v1/damage/stats - Get damage statistics
router.get('/stats', getDamageStats);

// GET /api/v1/damage/:id - Get single damage record by ID
router.get('/:id', param('id').notEmpty(), validateRequest, getDamageRecord);

// POST /api/v1/damage - Create new damage record
router.post(
  '/',
  [
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('damageType').isIn(['Cosmetic', 'Mechanical', 'Electrical', 'Structural']).withMessage('Invalid damage type'),
    body('severity').isIn(['Minor', 'Moderate', 'Major']).withMessage('Invalid severity'),
    body('location').notEmpty().withMessage('Location is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('reportedBy').notEmpty().withMessage('Reported by is required'),
    body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be positive'),
    body('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be positive'),
    body('damageStatus').optional().isIn(['Reported', 'Under Review', 'Approved for Repair', 'In Repair', 'Resolved', 'Rejected']).withMessage('Invalid damage status')
  ],
  validateRequest,
  createDamageRecord
);

// PUT /api/v1/damage/:id - Update damage record
router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('damageType').optional().isIn(['Cosmetic', 'Mechanical', 'Electrical', 'Structural']).withMessage('Invalid damage type'),
    body('severity').optional().isIn(['Minor', 'Moderate', 'Major']).withMessage('Invalid severity'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be positive'),
    body('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be positive'),
    body('damageStatus').optional().isIn(['Reported', 'Under Review', 'Approved for Repair', 'In Repair', 'Resolved', 'Rejected']).withMessage('Invalid damage status')
  ],
  validateRequest,
  updateDamageRecord
);

// PATCH /api/v1/damage/:id/status - Update damage status only
router.patch(
  '/:id/status',
  [
    param('id').notEmpty(),
    body('status').isIn(['Reported', 'Under Review', 'Approved for Repair', 'In Repair', 'Resolved', 'Rejected']).withMessage('Invalid status'),
    body('notes').optional().isString(),
    body('technician').optional().isString()
  ],
  validateRequest,
  updateDamageStatus
);

// DELETE /api/v1/damage/:id - Delete damage record
router.delete('/:id', param('id').notEmpty(), validateRequest, deleteDamageRecord);

export default router;
