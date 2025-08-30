import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController";
import { DepartmentController } from "../controllers/departmentController";
import { TeamController } from "../controllers/teamController";
import {
  authenticateEmployee,
  requirePermission,
  requireMinimumRoleLevel,
  requireManagerAccess,
} from "../middleware/employeeAuth";

const router = Router();

// Initialize controllers
const employeeController = new EmployeeController();
const departmentController = new DepartmentController();
const teamController = new TeamController();

// =================== EMPLOYEE ROUTES ===================

/**
 * @route POST /employees/login
 * @desc Employee login
 * @access Public
 */
router.post(
  "/employees/login",
  EmployeeController.employeeLoginValidation,
  employeeController.employeeLogin.bind(employeeController)
);

/**
 * @route POST /employees
 * @desc Create new employee (Admin only)
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/employees",
  authenticateEmployee,
  requirePermission("auth", "employees", "create"),
  EmployeeController.createEmployeeValidation,
  employeeController.createEmployee.bind(employeeController)
);

/**
 * @route GET /employees/me
 * @desc Get current employee profile
 * @access Private - Requires auth
 */
router.get(
  "/employees/me",
  authenticateEmployee,
  employeeController.getCurrentEmployeeProfile.bind(employeeController)
);

/**
 * @route GET /employees/search
 * @desc Search employees with filters
 * @access Private - Requires auth + read permission
 */
router.get(
  "/employees/search",
  authenticateEmployee,
  requirePermission("auth", "employees", "read"),
  employeeController.searchEmployees.bind(employeeController)
);

/**
 * @route GET /employees/:id
 * @desc Get employee by ID
 * @access Private - Requires auth + read permission
 */
router.get(
  "/employees/:id",
  authenticateEmployee,
  requirePermission("auth", "employees", "read"),
  employeeController.getEmployeeById.bind(employeeController)
);

/**
 * @route PUT /employees/:id
 * @desc Update employee
 * @access Private - Requires auth + update permission
 */
router.put(
  "/employees/:id",
  authenticateEmployee,
  requirePermission("auth", "employees", "update"),
  EmployeeController.updateEmployeeValidation,
  employeeController.updateEmployee.bind(employeeController)
);

/**
 * @route DELETE /employees/:id/deactivate
 * @desc Deactivate employee
 * @access Private - Requires auth + delete permission or manager access
 */
router.delete(
  "/employees/:id/deactivate",
  authenticateEmployee,
  requirePermission("auth", "employees", "delete"),
  employeeController.deactivateEmployee.bind(employeeController)
);

/**
 * @route GET /employees/:id/permissions/check
 * @desc Check if employee has specific permission
 * @access Private - Requires auth + admin permission
 */
router.get(
  "/employees/:id/permissions/check",
  authenticateEmployee,
  requirePermission("auth", "employees", "read"),
  employeeController.checkPermission.bind(employeeController)
);

// =================== DEPARTMENT ROUTES ===================

/**
 * @route POST /departments
 * @desc Create new department
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/departments",
  authenticateEmployee,
  requirePermission("auth", "departments", "create"),
  DepartmentController.createDepartmentValidation,
  departmentController.createDepartment.bind(departmentController)
);

/**
 * @route GET /departments
 * @desc Get all departments
 * @access Private - Requires auth
 */
router.get(
  "/departments",
  authenticateEmployee,
  departmentController.getAllDepartments.bind(departmentController)
);

/**
 * @route GET /departments/hierarchy
 * @desc Get department hierarchy with team and employee counts
 * @access Private - Requires auth + read permission
 */
router.get(
  "/departments/hierarchy",
  authenticateEmployee,
  requirePermission("auth", "departments", "read"),
  departmentController.getDepartmentHierarchy.bind(departmentController)
);

/**
 * @route GET /departments/:id
 * @desc Get department by ID
 * @access Private - Requires auth
 */
router.get(
  "/departments/:id",
  authenticateEmployee,
  departmentController.getDepartmentById.bind(departmentController)
);

/**
 * @route PUT /departments/:id
 * @desc Update department
 * @access Private - Requires auth + update permission
 */
router.put(
  "/departments/:id",
  authenticateEmployee,
  requirePermission("auth", "departments", "update"),
  DepartmentController.updateDepartmentValidation,
  departmentController.updateDepartment.bind(departmentController)
);

/**
 * @route DELETE /departments/:id
 * @desc Delete department
 * @access Private - Requires auth + delete permission
 */
router.delete(
  "/departments/:id",
  authenticateEmployee,
  requirePermission("auth", "departments", "delete"),
  departmentController.deleteDepartment.bind(departmentController)
);

// =================== TEAM ROUTES ===================

/**
 * @route POST /teams
 * @desc Create new team
 * @access Private - Requires auth + admin permission
 */
router.post(
  "/teams",
  authenticateEmployee,
  requirePermission("auth", "teams", "create"),
  TeamController.createTeamValidation,
  teamController.createTeam.bind(teamController)
);

/**
 * @route GET /teams
 * @desc Get all teams with optional department filtering
 * @access Private - Requires auth
 */
router.get(
  "/teams",
  authenticateEmployee,
  teamController.getAllTeams.bind(teamController)
);

/**
 * @route GET /teams/:id
 * @desc Get team by ID
 * @access Private - Requires auth
 */
router.get(
  "/teams/:id",
  authenticateEmployee,
  teamController.getTeamById.bind(teamController)
);

/**
 * @route PUT /teams/:id
 * @desc Update team
 * @access Private - Requires auth + update permission
 */
router.put(
  "/teams/:id",
  authenticateEmployee,
  requirePermission("auth", "teams", "update"),
  TeamController.updateTeamValidation,
  teamController.updateTeam.bind(teamController)
);

/**
 * @route DELETE /teams/:id
 * @desc Delete team
 * @access Private - Requires auth + delete permission
 */
router.delete(
  "/teams/:id",
  authenticateEmployee,
  requirePermission("auth", "teams", "delete"),
  teamController.deleteTeam.bind(teamController)
);

/**
 * @route POST /teams/:teamId/employees/:employeeId
 * @desc Add employee to team
 * @access Private - Requires auth + update permission
 */
router.post(
  "/teams/:teamId/employees/:employeeId",
  authenticateEmployee,
  requirePermission("auth", "teams", "update"),
  teamController.addEmployeeToTeam.bind(teamController)
);

/**
 * @route DELETE /teams/employees/:employeeId
 * @desc Remove employee from team
 * @access Private - Requires auth + update permission
 */
router.delete(
  "/teams/employees/:employeeId",
  authenticateEmployee,
  requirePermission("auth", "teams", "update"),
  teamController.removeEmployeeFromTeam.bind(teamController)
);

/**
 * @route GET /departments/:departmentId/teams
 * @desc Get teams by department
 * @access Private - Requires auth
 */
router.get(
  "/departments/:departmentId/teams",
  authenticateEmployee,
  teamController.getTeamsByDepartment.bind(teamController)
);

/**
 * @route GET /teams/stats
 * @desc Get team statistics
 * @access Private - Requires auth
 */
router.get(
  "/teams/stats",
  authenticateEmployee,
  teamController.getTeamStats.bind(teamController)
);

/**
 * @route GET /departments/stats
 * @desc Get department statistics
 * @access Private - Requires auth
 */
router.get(
  "/departments/stats",
  authenticateEmployee,
  departmentController.getDepartmentStats.bind(departmentController)
);

export default router;
