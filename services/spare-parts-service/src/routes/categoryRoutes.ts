import { Router } from "express";
import { CategoryController } from "../controllers/CategoryController";
import { asyncHandler } from "../middleware/errorHandler";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const categoryController = new CategoryController();

// GET /api/v1/categories - Get all categories
router.get(
  "/",
  // Allow this endpoint without authentication for now to fix the form
  asyncHandler(categoryController.getAll.bind(categoryController))
);

// GET /api/v1/categories/:id - Get category by ID
router.get(
  "/:id",
  authMiddleware,
  asyncHandler(categoryController.getById.bind(categoryController))
);

// POST /api/v1/categories - Create new category
router.post(
  "/",
  authMiddleware,
  asyncHandler(categoryController.create.bind(categoryController))
);

// PUT /api/v1/categories/:id - Update category
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(categoryController.update.bind(categoryController))
);

// DELETE /api/v1/categories/:id - Delete category
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(categoryController.delete.bind(categoryController))
);

export default router;
