import { Router } from 'express';
import { 
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
  getStoresByClient,
  getStoresByCity,
  getStoreStats
} from '../controllers/storeController';
import { requireRole, requireTeamAccess } from '../middleware/auth';

const router = Router();

// Public routes (with basic auth)
router.get('/', getStores);
router.get('/stats', getStoreStats);
router.get('/client/:clientId', getStoresByClient);
router.get('/city/:cityId', getStoresByCity);
router.get('/:id', getStoreById);

// Protected routes (require specific roles)
router.post('/', requireRole(['admin', 'super_admin', 'team_admin']), createStore);
router.put('/:id', requireRole(['admin', 'super_admin', 'team_admin']), updateStore);
router.delete('/:id', requireRole(['admin', 'super_admin']), deleteStore);

export default router;
