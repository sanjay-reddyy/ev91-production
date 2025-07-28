import { Router } from 'express';
import { 
  createRiderEarning,
  getRiderEarnings,
  getRiderEarningById,
  updateRiderEarning,
  deleteRiderEarning,
  getRiderEarningsByRider,
  getRiderEarningsByStore,
  getWeeklyRiderSummary,
  generateWeeklyReport
} from '../controllers/riderEarningsController';
import { requireRole, requireTeamAccess } from '../middleware/auth';

const router = Router();

// Public routes (with basic auth)
router.get('/', getRiderEarnings);
router.get('/rider/:riderId', getRiderEarningsByRider);
router.get('/store/:storeId', getRiderEarningsByStore);
router.get('/weekly/:riderId', getWeeklyRiderSummary);
router.get('/:id', getRiderEarningById);

// Protected routes (require specific roles)
router.post('/', requireRole(['admin', 'super_admin', 'team_admin', 'rider']), createRiderEarning);
router.put('/:id', requireRole(['admin', 'super_admin', 'team_admin']), updateRiderEarning);
router.delete('/:id', requireRole(['admin', 'super_admin']), deleteRiderEarning);

// Report generation
router.post('/reports/weekly', requireRole(['admin', 'super_admin', 'team_admin']), generateWeeklyReport);

export default router;
