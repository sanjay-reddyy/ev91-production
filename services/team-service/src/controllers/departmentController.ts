import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export class DepartmentController {
  // Get all departments
  static async getAllDepartments(req: Request, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          teams: {
            select: {
              id: true,
              name: true,
              memberCount: true,
            }
          },
          children: {
            select: {
              id: true,
              name: true,
            }
          },
          parent: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.status(200).json({
        success: true,
        departments,
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch departments',
      });
    }
  }

  // Get department by ID
  static async getDepartmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          teams: {
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          },
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          children: {
            select: {
              id: true,
              name: true,
            }
          },
          parent: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      res.status(200).json({
        success: true,
        department,
      });
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department',
      });
    }
  }

  // Create new department
  static async createDepartment(req: Request, res: Response) {
    try {
      const validatedData = createDepartmentSchema.parse(req.body);

      // Check if department name already exists
      const existingDepartment = await prisma.department.findUnique({
        where: { name: validatedData.name },
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department name already exists',
        });
      }

      // Validate parent department if provided
      if (validatedData.parentId) {
        const parentDepartment = await prisma.department.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentDepartment) {
          return res.status(400).json({
            success: false,
            message: 'Parent department not found',
          });
        }
      }

      const department = await prisma.department.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          isActive: validatedData.isActive ?? true,
          parentId: validatedData.parentId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        department,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Error creating department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create department',
      });
    }
  }

  // Update department
  static async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateDepartmentSchema.parse(req.body);

      // Check if department exists
      const existingDepartment = await prisma.department.findUnique({
        where: { id },
      });

      if (!existingDepartment) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if new name already exists (if name is being updated)
      if (validatedData.name && validatedData.name !== existingDepartment.name) {
        const nameExists = await prisma.department.findUnique({
          where: { name: validatedData.name },
        });

        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Department name already exists',
          });
        }
      }

      // Validate parent department if provided
      if (validatedData.parentId) {
        const parentDepartment = await prisma.department.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentDepartment) {
          return res.status(400).json({
            success: false,
            message: 'Parent department not found',
          });
        }

        // Prevent circular reference
        if (validatedData.parentId === id) {
          return res.status(400).json({
            success: false,
            message: 'Department cannot be its own parent',
          });
        }
      }

      const department = await prisma.department.update({
        where: { id },
        data: validatedData,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        department,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Error updating department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update department',
      });
    }
  }

  // Delete department
  static async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          teams: true,
          children: true,
        },
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if department has teams
      if (department.teams.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with existing teams',
        });
      }

      // Check if department has child departments
      if (department.children.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with child departments',
        });
      }

      await prisma.department.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete department',
      });
    }
  }
}
