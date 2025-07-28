import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { RBACMiddleware } from '../middleware/rbac';

const router = Router();

// Apply authentication to all team routes
router.use(RBACMiddleware.authenticate);

// Team CRUD routes
router.get(
  '/',
  RBACMiddleware.requireAuth(),
  TeamController.getAllTeams
);

router.get(
  '/stats',
  RBACMiddleware.requireAuth(),
  TeamController.getTeamStats
);

router.get(
  '/:id',
  RBACMiddleware.requireAuth(),
  TeamController.getTeamById
);

router.post(
  '/',
  RBACMiddleware.requireAuth(),
  TeamController.createTeam
);

router.put(
  '/:id',
  RBACMiddleware.requireAuth(),
  TeamController.updateTeam
);

router.delete(
  '/:id',
  RBACMiddleware.requireAuth(),
  TeamController.deleteTeam
);

export default router;
