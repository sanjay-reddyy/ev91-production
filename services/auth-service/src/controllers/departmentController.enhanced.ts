import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { DepartmentService } from "../services/departmentService";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../types/employee";
import { ApiResponse } from "../types/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Enhanced validation schemas with team-service features
const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  code: z.string().max(10).optional(),
  isActive: z.boolean().optional().default(true),
  parentId: z.string().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  /**
   * Enhanced Create department validation rules
   */
  static createDepartmentValidation = [
    body("name").notEmpty().withMessage("Department name is required"),
    body("description").optional().isString(),
    body("code")
      .optional()
      .isString()
      .isLength({ max: 10 })
      .withMessage("Department code must be 10 characters or less"),
    body("parentId").optional().isString(),
    body("isActive").optional().isBoolean(),
  ];

  /**
   * Enhanced Update department validation rules
   */
  static updateDepartmentValidation = [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Department name cannot be empty"),
    body("description").optional().isString(),
    body("code").optional().isString().isLength({ max: 10 }),
    body("parentId").optional().isString(),
    body("isActive").optional().isBoolean(),
  ];

  /**
   * Enhanced Get all departments with team-service features
   */
  async getAllDepartments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await prisma.department.findMany({
        include: {
          teams: {
            select: {
              id: true,
              name: true,
              memberCount: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      res.status(200).json({
        success: true,
        data: { departments },
        message: "Departments retrieved successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch departments",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Get department by ID with team-service features
   */
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          teams: {
            include: {
              employees: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!department) {
        res.status(404).json({
          success: false,
          error: "Department not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { department },
        message: "Department retrieved successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error fetching department:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch department",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Create a new department with team-service features
   */
  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const validatedData = createDepartmentSchema.parse(req.body);

      // Check if department name already exists
      const existingDepartment = await prisma.department.findFirst({
        where: { name: validatedData.name },
      });

      if (existingDepartment) {
        res.status(400).json({
          success: false,
          error: "Department name already exists",
        } as ApiResponse);
        return;
      }

      // Check if parent department exists
      if (validatedData.parentId) {
        const parentDepartment = await prisma.department.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentDepartment) {
          res.status(400).json({
            success: false,
            error: "Parent department not found",
          } as ApiResponse);
          return;
        }
      }

      const department = await prisma.department.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          code: validatedData.code,
          isActive: validatedData.isActive ?? true,
          parentId: validatedData.parentId,
        },
        include: {
          parent: {
            select: { id: true, name: true },
          },
          children: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: { department },
        message: "Department created successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Create department error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create department",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Update department with team-service features
   */
  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const validatedData = updateDepartmentSchema.parse(req.body);

      // Check if department exists
      const existingDepartment = await prisma.department.findUnique({
        where: { id },
      });

      if (!existingDepartment) {
        res.status(404).json({
          success: false,
          error: "Department not found",
        } as ApiResponse);
        return;
      }

      // Check if new name already exists (excluding current department)
      if (validatedData.name) {
        const nameConflict = await prisma.department.findFirst({
          where: {
            name: validatedData.name,
            NOT: { id },
          },
        });

        if (nameConflict) {
          res.status(400).json({
            success: false,
            error: "Department name already exists",
          } as ApiResponse);
          return;
        }
      }

      // Check if parent department exists
      if (validatedData.parentId) {
        const parentDepartment = await prisma.department.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentDepartment) {
          res.status(400).json({
            success: false,
            error: "Parent department not found",
          } as ApiResponse);
          return;
        }

        // Prevent circular hierarchy
        if (validatedData.parentId === id) {
          res.status(400).json({
            success: false,
            error: "Department cannot be its own parent",
          } as ApiResponse);
          return;
        }
      }

      const department = await prisma.department.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.code !== undefined && { code: validatedData.code }),
          ...(validatedData.isActive !== undefined && {
            isActive: validatedData.isActive,
          }),
          ...(validatedData.parentId !== undefined && {
            parentId: validatedData.parentId,
          }),
        },
        include: {
          parent: {
            select: { id: true, name: true },
          },
          children: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: { department },
        message: "Department updated successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Update department error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update department",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Delete department with team-service features
   */
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          teams: true,
          children: true,
          employees: true,
        },
      });

      if (!department) {
        res.status(404).json({
          success: false,
          error: "Department not found",
        } as ApiResponse);
        return;
      }

      // Check if department has teams
      if (department.teams.length > 0) {
        res.status(400).json({
          success: false,
          error: "Cannot delete department with existing teams",
        } as ApiResponse);
        return;
      }

      // Check if department has employees
      if (department.employees.length > 0) {
        res.status(400).json({
          success: false,
          error: "Cannot delete department with existing employees",
        } as ApiResponse);
        return;
      }

      // Check if department has child departments
      if (department.children.length > 0) {
        res.status(400).json({
          success: false,
          error: "Cannot delete department with child departments",
        } as ApiResponse);
        return;
      }

      await prisma.department.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Delete department error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete department",
      } as ApiResponse);
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const totalDepartments = await prisma.department.count();
      const activeDepartments = await prisma.department.count({
        where: { isActive: true },
      });
      const inactiveDepartments = totalDepartments - activeDepartments;

      // Get departments with team counts
      const departmentsWithTeams = await prisma.department.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              teams: true,
              employees: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalDepartments,
            activeDepartments,
            inactiveDepartments,
            departmentsWithTeams,
          },
        },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error fetching department stats:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch department statistics",
      } as ApiResponse);
    }
  }

  /**
   * Get department hierarchy
   */
  async getDepartmentHierarchy(req: Request, res: Response): Promise<void> {
    try {
      // Get root departments (those without parents)
      const rootDepartments = await prisma.department.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: true, // Support up to 4 levels deep
                },
              },
            },
          },
          _count: {
            select: {
              teams: true,
              employees: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: { hierarchy: rootDepartments },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error fetching department hierarchy:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch department hierarchy",
      } as ApiResponse);
    }
  }
}
