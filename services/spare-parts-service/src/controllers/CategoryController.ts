import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Define validation schemas
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  parentId: z.string().optional(),
  level: z.number().int().default(1),
  path: z.string().optional(),
  sortOrder: z.number().int().default(0),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class CategoryController {
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 50,
        search = "",
        level,
        parentId,
        isActive,
      } = req.query;

      const pageNumber = Number(page);
      const pageSize = Math.min(Number(limit), 100); // Cap at 100
      const skip = (pageNumber - 1) * pageSize;

      const where: any = {};

      // Apply filters
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { displayName: { contains: search as string, mode: "insensitive" } },
          { code: { contains: search as string, mode: "insensitive" } },
        ];
      }

      if (level) {
        where.level = Number(level);
      }

      if (parentId === "null") {
        where.parentId = null;
      } else if (parentId) {
        where.parentId = parentId as string;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      // Get total count for pagination
      const totalCount = await prisma.category.count({ where });

      // Get categories with pagination
      const categories = await prisma.category.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
            },
          },
          _count: {
            select: {
              children: true,
              spareParts: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        data: {
          categories,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting categories:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get categories",
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
              level: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              children: true,
              spareParts: true,
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      console.error("Error getting category:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get category",
        error: error.message,
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = categorySchema.parse(req.body);

      // Check if code already exists
      const existingCategory = await prisma.category.findUnique({
        where: { code: validatedData.code },
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "A category with this code already exists",
        });
      }

      // Create the category
      const newCategory = await prisma.category.create({
        data: validatedData,
      });

      return res.status(201).json({
        success: true,
        data: newCategory,
        message: "Category created successfully",
      });
    } catch (error: any) {
      console.error("Error creating category:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "A category with this code already exists",
          error: error.message,
        });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create category",
        error: error.message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validate request body
      const validatedData = categorySchema.parse(req.body);

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Update the category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: validatedData,
      });

      return res.json({
        success: true,
        data: updatedCategory,
        message: "Category updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating category:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "A category with this code already exists",
          error: error.message,
        });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update category",
        error: error.message,
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              children: true,
              spareParts: true,
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if category has child categories
      if (category._count.children > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete category with child categories. Remove or reassign child categories first.",
        });
      }

      // Check if category has spare parts
      if (category._count.spareParts > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete category with spare parts. Remove or reassign spare parts first.",
        });
      }

      // Delete the category
      await prisma.category.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting category:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete category",
        error: error.message,
      });
    }
  }
}
