import { Router } from 'express';
import { 
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientsByCity,
  getClientStats
} from '../controllers/clientController';
import { requireRole, requireTeamAccess } from '../middleware/auth';

const router = Router();

// Public routes (with basic auth)
router.get('/', getClients);
router.get('/stats', getClientStats);
router.get('/city/:city', getClientsByCity);
router.get('/:id', getClientById);

// Protected routes (require specific roles)
router.post('/', requireRole(['admin', 'super_admin', 'team_admin']), createClient);
router.put('/:id', requireRole(['admin', 'super_admin', 'team_admin']), updateClient);
router.delete('/:id', requireRole(['admin', 'super_admin']), deleteClient);

export default router;
