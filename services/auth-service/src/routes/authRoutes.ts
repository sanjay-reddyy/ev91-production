import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { RBACMiddleware } from '../middleware/rbac';

const router = Router();

// Public routes
router.post('/register', AuthController.registerValidation, AuthController.register);
router.post('/login', AuthController.loginValidation, AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.get('/profile', RBACMiddleware.authenticate, AuthController.getProfile);
router.post('/assign-roles', 
  RBACMiddleware.authenticate, 
  RBACMiddleware.authorize({ resource: 'users', action: 'manage' }), 
  AuthController.assignRoles
);

export default router;
