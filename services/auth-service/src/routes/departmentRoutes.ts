import { Router } from "express";
import { DepartmentController } from "../controllers/departmentController";
import {
  authenticateEmployee,
  requirePermission,
} from "../middleware/employeeAuth";

const router = Router();
const departmentController = new DepartmentController();

// All department routes require authentication
router.use(authenticateEmployee);

// GET /api/v1/departments - List departments
router.get(
  "/",
  departmentController.getAllDepartments.bind(departmentController)
);

// GET /api/v1/departments/:id - Get department by ID
router.get(
  "/:id",
  departmentController.getDepartmentById.bind(departmentController)
);

// POST /api/v1/departments - Create department
router.post(
  "/",
  requirePermission("auth", "departments", "create"),
  DepartmentController.createDepartmentValidation,
  departmentController.createDepartment.bind(departmentController)
);

// PUT /api/v1/departments/:id - Update department
router.put(
  "/:id",
  requirePermission("auth", "departments", "update"),
  DepartmentController.updateDepartmentValidation,
  departmentController.updateDepartment.bind(departmentController)
);

// DELETE /api/v1/departments/:id - Delete department
router.delete(
  "/:id",
  requirePermission("auth", "departments", "delete"),
  departmentController.deleteDepartment.bind(departmentController)
);

export default router;
