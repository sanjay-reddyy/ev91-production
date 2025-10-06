import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { authMiddleware } from "../middleware/auth";
import { AnalyticsController } from "../controllers/AnalyticsController";

const router = Router();
const analyticsController = new AnalyticsController();

// GET /api/v1/analytics/usage-analytics - Get spare parts usage analytics
router.get(
  "/usage-analytics",
  authMiddleware,
  asyncHandler(analyticsController.getUsageAnalytics.bind(analyticsController))
);

// GET /api/v1/analytics/cost-analysis - Get cost analysis
router.get(
  "/cost-analysis",
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        totalSpent: 95000,
        avgOrderValue: 2500,
        costTrends: [
          { month: "2025-01", amount: 15000 },
          { month: "2025-02", amount: 12000 },
          { month: "2025-03", amount: 18000 },
          { month: "2025-04", amount: 14000 },
          { month: "2025-05", amount: 20000 },
          { month: "2025-06", amount: 16000 },
        ],
      },
    });
  })
);

// GET /api/v1/analytics/inventory-trends - Get inventory trends
router.get(
  "/inventory-trends",
  authMiddleware,
  asyncHandler(analyticsController.getInventoryTrends.bind(analyticsController))
);

// GET /api/v1/analytics/supplier-performance - Get supplier performance
router.get(
  "/supplier-performance",
  authMiddleware,
  asyncHandler(
    analyticsController.getSupplierPerformance.bind(analyticsController)
  )
);

// GET /api/v1/analytics - Get all analytics
router.get(
  "/",
  authMiddleware,
  asyncHandler(analyticsController.getAllAnalytics.bind(analyticsController))
);

export default router;
