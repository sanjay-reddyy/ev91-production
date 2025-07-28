import express from 'express';
import { DepartmentController } from '../controllers/departmentController';
import { RBACMiddleware } from '../middleware/rbac';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(RBACMiddleware.authenticate);

// Department routes
router.get('/', DepartmentController.getAllDepartments);
router.post('/', DepartmentController.createDepartment);
router.get('/:id', DepartmentController.getDepartmentById);
router.put('/:id', DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);

export default router;
