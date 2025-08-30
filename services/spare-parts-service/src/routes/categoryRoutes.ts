import { Router } from "express";
import { Request, Response } from "express";
import { prisma } from "../config";
import { asyncHandler } from "../middleware/errorHandler";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/v1/categories - Get all categories
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve categories",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
);

// GET /api/v1/categories/:id - Get category by ID
router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
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
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
            },
          },
          spareParts: {
            select: {
              id: true,
              name: true,
              partNumber: true,
            },
            take: 10,
            where: { isActive: true },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve category",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
);

// POST /api/v1/categories - Create new category
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const {
        name,
        displayName,
        code,
        description,
        parentId,
        level = 1,
      } = req.body;

      // Validate required fields
      if (!name || !displayName || !code) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, displayName, code",
        });
      }

      // Check if code already exists
      const existingCategory = await prisma.category.findUnique({
        where: { code },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category code already exists",
        });
      }

      const category = await prisma.category.create({
        data: {
          name,
          displayName,
          code,
          description,
          parentId,
          level,
          path: parentId ? undefined : name, // Will be calculated if has parent
        },
      });

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create category",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
);

export default router;
