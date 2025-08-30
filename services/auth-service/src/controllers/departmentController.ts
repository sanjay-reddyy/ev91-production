import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { DepartmentService } from "../services/departmentService";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../types/employee";
import { ApiResponse } from "../types/auth";

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  /**
   * Create a new department
   */
  static createDepartmentValidation = [
    body("name").notEmpty().withMessage("Department name is required"),
    body("description").optional().isString(),
    body("code")
      .optional()
      .isString()
      .isLength({ max: 10 })
      .withMessage("Department code must be 10 characters or less"),
  ];

  async createDepartment(req: Request, res: Response): Promise<void> {
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

      const departmentData: CreateDepartmentDto = req.body;
      const department = await this.departmentService.createDepartment(
        departmentData
      );

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: department,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create department",
      } as ApiResponse);
    }
  }

  /**
   * Get all departments
   */
  async getAllDepartments(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const departments = await this.departmentService.getAllDepartments(
        includeInactive
      );

      res.status(200).json({
        success: true,
        data: departments,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get departments",
      } as ApiResponse);
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Department ID is required",
        } as ApiResponse);
        return;
      }

      const department = await this.departmentService.getDepartmentById(id);

      if (!department) {
        res.status(404).json({
          success: false,
          error: "Department not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: department,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get department",
      } as ApiResponse);
    }
  }

  /**
   * Update department
   */
  static updateDepartmentValidation = [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Department name cannot be empty"),
    body("description").optional().isString(),
    body("code")
      .optional()
      .isString()
      .isLength({ max: 10 })
      .withMessage("Department code must be 10 characters or less"),
    body("isActive").optional().isBoolean(),
  ];

  async updateDepartment(req: Request, res: Response): Promise<void> {
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
      const updateData: UpdateDepartmentDto = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Department ID is required",
        } as ApiResponse);
        return;
      }

      const department = await this.departmentService.updateDepartment(
        id,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update department",
      } as ApiResponse);
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Department ID is required",
        } as ApiResponse);
        return;
      }

      await this.departmentService.deleteDepartment(id);

      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete department",
      } as ApiResponse);
    }
  }

  /**
   * Get department hierarchy
   */
  async getDepartmentHierarchy(req: Request, res: Response): Promise<void> {
    try {
      const hierarchy = await this.departmentService.getDepartmentHierarchy();

      res.status(200).json({
        success: true,
        data: hierarchy,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get department hierarchy",
      } as ApiResponse);
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.departmentService.getDepartmentStats();

      res.status(200).json({
        success: true,
        message: "Department statistics retrieved successfully",
        data: stats,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get department statistics",
      } as ApiResponse);
    }
  }
}
