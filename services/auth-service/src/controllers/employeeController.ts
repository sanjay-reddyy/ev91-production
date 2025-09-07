import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { EmployeeService } from "../services/employeeService";
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeSearchOptions,
} from "../types/employee";
import { EmployeeLoginCredentials, ApiResponse } from "../types/auth";

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  /**
   * Create a new employee
   */
  static createEmployeeValidation = [
    body("employeeId").notEmpty().withMessage("Employee ID is required"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("departmentId").notEmpty().withMessage("Department ID is required"),
    body("hireDate").isISO8601().withMessage("Valid hire date is required"),
    body("roleIds")
      .isArray({ min: 1 })
      .withMessage("At least one role is required"),
    body("temporaryPassword")
      .isLength({ min: 8 })
      .withMessage("Temporary password must be at least 8 characters"),
    body("phone")
      .optional()
      .matches(/^\d{10}$/)
      .withMessage("Mobile number must be exactly 10 digits"),
    body("teamId")
      .optional()
      .customSanitizer((value) => (value === "" ? null : value))
      .isString()
      .optional({ nullable: true }),
    body("managerId")
      .optional()
      .customSanitizer((value) => (value === "" ? null : value))
      .isString()
      .optional({ nullable: true }),
    body("position").optional().isString(),
  ];

  async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      console.log(
        "📝 Creating employee with request body:",
        JSON.stringify(req.body, null, 2)
      );

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const employeeData: CreateEmployeeDto = {
        ...req.body,
        hireDate: new Date(req.body.hireDate),
      };
      const createdBy = req.user?.id;

      const employee = await this.employeeService.createEmployee(
        employeeData,
        createdBy
      );

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: employee,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create employee",
      } as ApiResponse);
    }
  }

  /**
   * Employee login
   */
  static employeeLoginValidation = [
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("employeeId")
      .optional()
      .isString()
      .withMessage("Employee ID must be a string"),
    body("password").notEmpty().withMessage("Password is required"),
  ];

  async employeeLogin(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const { email, employeeId, password } = req.body;

      if (!email && !employeeId) {
        res.status(400).json({
          success: false,
          error: "Either email or employee ID is required",
        } as ApiResponse);
        return;
      }

      const credentials: EmployeeLoginCredentials = {
        email,
        employeeId,
        password,
      };

      const result = await this.employeeService.loginEmployee(credentials);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      } as ApiResponse);
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Employee ID is required",
        } as ApiResponse);
        return;
      }

      const employee = await this.employeeService.getEmployeeById(id);

      if (!employee) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: employee,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get employee",
      } as ApiResponse);
    }
  }

  /**
   * Search employees
   */
  async searchEmployees(req: Request, res: Response): Promise<void> {
    try {
      const options: EmployeeSearchOptions = {
        departmentId: req.query.departmentId as string,
        teamId: req.query.teamId as string,
        roleId: req.query.roleId as string,
        isActive: req.query.isActive
          ? req.query.isActive === "true"
          : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50, // Increase default from 10 to 50
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await this.employeeService.searchEmployees(options);

      res.status(200).json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to search employees",
      } as ApiResponse);
    }
  }

  /**
   * Update employee
   */
  static updateEmployeeValidation = [
    body("firstName")
      .optional()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("phone")
      .optional()
      .matches(/^\d{10}$/)
      .withMessage("Mobile number must be exactly 10 digits"),
    body("departmentId").optional().isString(),
    body("teamId")
      .optional()
      .customSanitizer((value) => (value === "" ? null : value))
      .isString()
      .optional({ nullable: true }),
    body("managerId")
      .optional()
      .customSanitizer((value) => (value === "" ? null : value))
      .isString()
      .optional({ nullable: true }),
    body("position").optional().isString(),
    body("hireDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid hire date format"),
    body("isActive").optional().isBoolean(),
    body("roleIds")
      .optional()
      .isArray()
      .withMessage("Role IDs must be an array"),
    body("roleIds.*")
      .optional()
      .isString()
      .withMessage("Each role ID must be a string"),
  ];

  async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const updateData: UpdateEmployeeDto = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Employee ID is required",
        } as ApiResponse);
        return;
      }

      const employee = await this.employeeService.updateEmployee(
        id,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        data: employee,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update employee",
      } as ApiResponse);
    }
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Employee ID is required",
        } as ApiResponse);
        return;
      }

      await this.employeeService.deactivateEmployee(id);

      res.status(200).json({
        success: true,
        message: "Employee deactivated successfully",
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to deactivate employee",
      } as ApiResponse);
    }
  }

  /**
   * Check employee permission
   */
  async checkPermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { service, resource, action } = req.query;

      if (!id || !service || !resource || !action) {
        res.status(400).json({
          success: false,
          error: "Employee ID, service, resource, and action are required",
        } as ApiResponse);
        return;
      }

      const hasPermission = await this.employeeService.hasPermission(
        id,
        service as string,
        resource as string,
        action as string
      );

      res.status(200).json({
        success: true,
        data: { hasPermission },
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check permission",
      } as ApiResponse);
    }
  }

  /**
   * Get current employee profile (for authenticated employee)
   */
  async getCurrentEmployeeProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user || !user.employee) {
        res.status(401).json({
          success: false,
          error: "Employee not authenticated",
        } as ApiResponse);
        return;
      }

      const employee = await this.employeeService.getEmployeeById(
        user.employee.id
      );

      if (!employee) {
        res.status(404).json({
          success: false,
          error: "Employee profile not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: employee,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get employee profile",
      } as ApiResponse);
    }
  }
}
