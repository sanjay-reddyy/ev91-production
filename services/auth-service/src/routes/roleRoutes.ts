import { Router } from "express";
import { body } from "express-validator";
import { RolePermissionController } from "../controllers/rolePermissionController";
import {
  authenticateEmployee,
  requirePermission,
  requireMinimumRoleLevel,
} from "../middleware/employeeAuth";

const router = Router();
const rolePermissionController = new RolePermissionController();

// Apply auth middleware to all routes
router.use(authenticateEmployee);

// =================== ROLE ROUTES ===================

/**
 * @route POST /roles
 * @desc Create new role
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/roles",
  requirePermission("auth", "roles", "create"),
  [
    body("name").notEmpty().withMessage("Role name is required"),
    body("description").optional().isString(),
    body("level").optional().isInt({ min: 1 }),
    body("permissionIds").optional().isArray(),
  ],
  rolePermissionController.createRole.bind(rolePermissionController)
);

/**
 * @route GET /roles
 * @desc Get all roles
 * @access Private - Requires auth + read permission
 */
router.get(
  "/roles",
  requirePermission("auth", "roles", "read"),
  rolePermissionController.getAllRoles.bind(rolePermissionController)
);

/**
 * @route GET /roles/:id
 * @desc Get role by ID
 * @access Private - Requires auth + read permission
 */
router.get(
  "/roles/:id",
  requirePermission("auth", "roles", "read"),
  rolePermissionController.getRoleById.bind(rolePermissionController)
);

/**
 * @route PUT /roles/:id
 * @desc Update role
 * @access Private - Requires auth + update permission
 */
router.put(
  "/roles/:id",
  requirePermission("auth", "roles", "update"),
  [
    body("name").optional().notEmpty().withMessage("Role name cannot be empty"),
    body("description").optional().isString(),
    body("level").optional().isInt({ min: 1 }),
    body("isActive").optional().isBoolean(),
  ],
  rolePermissionController.updateRole.bind(rolePermissionController)
);

/**
 * @route DELETE /roles/:id
 * @desc Delete role
 * @access Private - Requires auth + delete permission
 */
router.delete(
  "/roles/:id",
  requirePermission("auth", "roles", "delete"),
  rolePermissionController.deleteRole.bind(rolePermissionController)
);

/**
 * @route POST /roles/:roleId/permissions/:permissionId
 * @desc Assign permission to role
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/roles/:roleId/permissions/:permissionId",
  requirePermission("auth", "roles", "update"),
  rolePermissionController.assignPermissionToRole.bind(rolePermissionController)
);

/**
 * @route DELETE /roles/:roleId/permissions/:permissionId
 * @desc Remove permission from role
 * @access Private - Requires auth + admin permission
 */
router.delete(
  "/roles/:roleId/permissions/:permissionId",
  requirePermission("auth", "roles", "update"),
  rolePermissionController.removePermissionFromRole.bind(
    rolePermissionController
  )
);

/**
 * @route GET /roles/:id/permissions
 * @desc Get role permissions
 * @access Private - Requires auth + read permission
 */
router.get(
  "/roles/:id/permissions",
  requirePermission("auth", "roles", "read"),
  rolePermissionController.getRolePermissions.bind(rolePermissionController)
);

// =================== PERMISSION ROUTES ===================

/**
 * @route POST /permissions
 * @desc Create new permission
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/permissions",
  requirePermission("auth", "permissions", "create"),
  [
    body("name").notEmpty().withMessage("Permission name is required"),
    body("service").notEmpty().withMessage("Service is required"),
    body("resource").notEmpty().withMessage("Resource is required"),
    body("action").notEmpty().withMessage("Action is required"),
    body("description").optional().isString(),
  ],
  rolePermissionController.createPermission.bind(rolePermissionController)
);

/**
 * @route GET /permissions
 * @desc Get all permissions
 * @access Private - Requires auth + read permission
 */
router.get(
  "/permissions",
  requirePermission("auth", "permissions", "read"),
  rolePermissionController.getAllPermissions.bind(rolePermissionController)
);

/**
 * @route GET /permissions/:id
 * @desc Get permission by ID
 * @access Private - Requires auth + read permission
 */
router.get(
  "/permissions/:id",
  requirePermission("auth", "permissions", "read"),
  rolePermissionController.getPermissionById.bind(rolePermissionController)
);

/**
 * @route PUT /permissions/:id
 * @desc Update permission
 * @access Private - Requires auth + update permission
 */
router.put(
  "/permissions/:id",
  requirePermission("auth", "permissions", "update"),
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Permission name cannot be empty"),
    body("service")
      .optional()
      .notEmpty()
      .withMessage("Service cannot be empty"),
    body("resource")
      .optional()
      .notEmpty()
      .withMessage("Resource cannot be empty"),
    body("action").optional().notEmpty().withMessage("Action cannot be empty"),
    body("description").optional().isString(),
    body("isActive").optional().isBoolean(),
  ],
  rolePermissionController.updatePermission.bind(rolePermissionController)
);

/**
 * @route DELETE /permissions/:id
 * @desc Delete permission
 * @access Private - Requires auth + delete permission
 */
router.delete(
  "/permissions/:id",
  requirePermission("auth", "permissions", "delete"),
  rolePermissionController.deletePermission.bind(rolePermissionController)
);

// =================== USER ROLE ROUTES ===================

/**
 * @route POST /users/:userId/roles/:roleId
 * @desc Assign role to user
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/users/:userId/roles/:roleId",
  requirePermission("auth", "users", "update"),
  rolePermissionController.assignRoleToUser.bind(rolePermissionController)
);

/**
 * @route DELETE /users/:userId/roles/:roleId
 * @desc Remove role from user
 * @access Private - Requires auth + admin permission
 */
router.delete(
  "/users/:userId/roles/:roleId",
  requirePermission("auth", "users", "update"),
  rolePermissionController.removeRoleFromUser.bind(rolePermissionController)
);

/**
 * @route GET /users/:userId/roles
 * @desc Get user roles
 * @access Private - Requires auth + read permission
 */
router.get(
  "/users/:userId/roles",
  requirePermission("auth", "users", "read"),
  rolePermissionController.getUserRoles.bind(rolePermissionController)
);

/**
 * @route GET /users/:userId/permissions
 * @desc Get user effective permissions
 * @access Private - Requires auth + read permission
 */
router.get(
  "/users/:userId/permissions",
  requirePermission("auth", "users", "read"),
  rolePermissionController.getUserPermissions.bind(rolePermissionController)
);

export default router;
