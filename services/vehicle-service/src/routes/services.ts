import { Router } from 'express';
import {
  createServiceRecord,
  getServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
  deleteServiceRecord,
  getVehicleServiceHistory,
  getServiceStatistics,
  getDueServices,
  updateVehicleStatus,
  uploadServiceMedia,
  getServiceMedia,
  deleteServiceMedia,
  generateServiceReport,
  scheduleService
} from '../controllers/ServiceController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// =====================================================
// ROOT ENDPOINT (delegates to records)
// =====================================================

// Root endpoint delegates to records for backward compatibility
router.get('/', getServiceRecords);

// =====================================================
// CORE SERVICE RECORD OPERATIONS
// =====================================================

// Service Records CRUD
router.post('/records', createServiceRecord);
router.get('/records', getServiceRecords);
router.get('/records/:id', getServiceRecordById);
router.put('/records/:id', updateServiceRecord);
router.delete('/records/:id', deleteServiceRecord);

// =====================================================
// VEHICLE SERVICE MANAGEMENT
// =====================================================

// Vehicle Service History
router.get('/vehicles/:vehicleId/history', authMiddleware, getVehicleServiceHistory);
router.put('/vehicles/:vehicleId/status', authMiddleware, updateVehicleStatus);

// Service Scheduling
router.post('/schedule', authMiddleware, scheduleService);
router.get('/due-services', authMiddleware, getDueServices);

// =====================================================
// SERVICE ANALYTICS & REPORTING
// =====================================================

// Service Statistics
router.get('/statistics', authMiddleware, getServiceStatistics);

// Service Reports
router.post('/reports/generate', authMiddleware, generateServiceReport);

// =====================================================
// SERVICE MEDIA MANAGEMENT
// =====================================================

// Service Media (Photos, Videos, Documents)
router.post('/records/:serviceRecordId/media', authMiddleware, uploadMultiple, uploadServiceMedia);
router.get('/records/:serviceRecordId/media', authMiddleware, getServiceMedia);
router.delete('/media/:mediaId', authMiddleware, deleteServiceMedia);

// =====================================================
// HEALTH CHECK
// =====================================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
