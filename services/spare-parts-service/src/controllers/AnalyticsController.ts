import { Request, Response } from "express";
import { prisma } from "../config";

export class AnalyticsController {
  /**
   * Get usage analytics data for spare parts
   */
  async getUsageAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, categoryId } = req.query;

      console.log("Received request for usage analytics:", {
        startDate,
        endDate,
        categoryId,
      });

      // Implement real data fetching later, for now using mock data
      const mockData = {
        success: true,
        data: {
          dateRange: {
            startDate: startDate || "2025-08-22T14:35:39.691Z",
            endDate: endDate || "2025-09-21T14:35:39.691Z",
          },
          monthlyTrends: [
            {
              month: "2025-08",
              totalUsage: 120,
              totalCost: 15000,
              orderCount: 8,
            },
            {
              month: "2025-09",
              totalUsage: 145,
              totalCost: 17500,
              orderCount: 11,
            },
          ],
          categoryBreakdown: [
            { category: "MOTOR", count: 45, totalValue: 25000 },
            { category: "BRAKE", count: 32, totalValue: 18000 },
            { category: "ELECTRICAL", count: 28, totalValue: 15000 },
            { category: "BODY", count: 20, totalValue: 12000 },
            { category: "SUSPENSION", count: 18, totalValue: 10000 },
            { category: "TRANSMISSION", count: 12, totalValue: 8000 },
          ],
          topUsedParts: [
            { name: "Brake Pads - Front", usage: 25, trend: 15.2 },
            { name: "Oil Filter", usage: 22, trend: 8.5 },
            { name: "Air Filter", usage: 18, trend: -3.1 },
            { name: "Spark Plugs", usage: 16, trend: 12.7 },
            { name: "Brake Discs", usage: 14, trend: 5.9 },
          ],
        },
      };

      // If categoryId is provided, filter the data
      if (categoryId) {
        mockData.data.categoryBreakdown =
          mockData.data.categoryBreakdown.filter(
            (c) => c.category === categoryId
          );
      }

      res.json(mockData);
    } catch (error) {
      console.error("Error getting usage analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve usage analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get inventory trends data
   */
  async getInventoryTrends(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      // Mock data for inventory trends
      const mockData = {
        success: true,
        data: {
          turnoverRate: 4.2,
          stockAccuracy: 0.95,
          trends: [
            { month: "2025-01", inflow: 200, outflow: 180 },
            { month: "2025-02", inflow: 150, outflow: 170 },
            { month: "2025-03", inflow: 250, outflow: 220 },
            { month: "2025-04", inflow: 180, outflow: 160 },
            { month: "2025-05", inflow: 300, outflow: 280 },
            { month: "2025-06", inflow: 220, outflow: 200 },
          ],
        },
      };

      res.json(mockData);
    } catch (error) {
      console.error("Error getting inventory trends:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve inventory trends",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get supplier performance API endpoint
   */
  async getSupplierPerformance(req: Request, res: Response) {
    try {
      // Use the private helper method
      const supplierData = await this.getSupplierPerformanceData();

      // For now, return mock data (later can use real data from supplierData)
      const mockData = {
        success: true,
        data: [
          {
            supplier: "AutoParts Pro",
            orders: 25,
            totalValue: 45000,
            avgDeliveryTime: 3.2,
            rating: 4.8,
          },
          {
            supplier: "Quality Motors",
            orders: 18,
            totalValue: 32000,
            avgDeliveryTime: 2.8,
            rating: 4.6,
          },
          {
            supplier: "Express Parts",
            orders: 12,
            totalValue: 18000,
            avgDeliveryTime: 1.5,
            rating: 4.3,
          },
        ],
      };

      res.json(mockData);
    } catch (error) {
      console.error("Error getting supplier performance:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve supplier performance",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get all analytics data
   */
  async getAllAnalytics(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message:
          "Analytics endpoints available at /usage-analytics, /cost-analysis, /inventory-trends, /supplier-performance",
        endpoints: [
          "/api/v1/analytics/usage-analytics",
          "/api/v1/analytics/cost-analysis",
          "/api/v1/analytics/inventory-trends",
          "/api/v1/analytics/supplier-performance",
        ],
      });
    } catch (error) {
      console.error("Error getting analytics overview:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve analytics information",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(req: Request, res: Response) {
    try {
      const { storeId, from, to } = req.query;

      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from as string);
      if (to) dateFilter.lte = new Date(to as string);

      const whereClause: any = {};
      if (storeId) whereClause.storeId = storeId;
      if (Object.keys(dateFilter).length > 0)
        whereClause.lastUpdated = dateFilter;

      // Get inventory overview
      const [
        totalSpareParts,
        totalStockValue,
        lowStockItems,
        outOfStockItems,
        inventoryTurnover,
      ] = await Promise.all([
        prisma.inventoryLevel.count({ where: whereClause }),
        prisma.inventoryLevel.aggregate({
          where: whereClause,
          _sum: { currentStock: true },
        }),
        prisma.inventoryLevel.count({
          where: {
            ...whereClause,
            currentStock: { lte: prisma.inventoryLevel.fields.reorderLevel },
          },
        }),
        prisma.inventoryLevel.count({
          where: {
            ...whereClause,
            currentStock: 0,
          },
        }),
        this.calculateInventoryTurnover(
          storeId as string,
          from as string,
          to as string
        ),
      ]);

      // Get stock movement trends
      const stockMovements = await prisma.stockMovement.groupBy({
        by: ["movementType", "createdAt"],
        where: {
          storeId: storeId as string,
          createdAt: dateFilter.gte
            ? { gte: dateFilter.gte, lte: dateFilter.lte || new Date() }
            : undefined,
        },
        _sum: { quantity: true },
        _count: true,
      });

      // Get top moving parts
      const topMovingParts = await prisma.stockMovement.groupBy({
        by: ["sparePartId"],
        where: {
          storeId: storeId as string,
          createdAt: dateFilter.gte
            ? { gte: dateFilter.gte, lte: dateFilter.lte || new Date() }
            : undefined,
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      });

      // Get spare part details for top moving parts
      const sparePartIds = topMovingParts.map((item) => item.sparePartId);
      const spareParts = await prisma.sparePart.findMany({
        where: { id: { in: sparePartIds } },
        select: { id: true, partNumber: true, name: true },
      });

      const topMovingPartsWithDetails = topMovingParts.map((item) => ({
        ...item,
        sparePart: spareParts.find((part) => part.id === item.sparePartId),
      }));

      res.json({
        success: true,
        data: {
          overview: {
            totalSpareParts,
            totalStockValue: totalStockValue._sum.currentStock || 0,
            lowStockItems,
            outOfStockItems,
            inventoryTurnover,
          },
          stockMovements,
          topMovingParts: topMovingPartsWithDetails,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve inventory analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get purchase analytics
   */
  async getPurchaseAnalytics(req: Request, res: Response) {
    try {
      const { from, to, supplierId } = req.query;

      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from as string);
      if (to) dateFilter.lte = new Date(to as string);

      const whereClause: any = {};
      if (supplierId) whereClause.supplierId = supplierId;
      if (Object.keys(dateFilter).length > 0)
        whereClause.createdAt = dateFilter;

      // Get purchase overview
      const [
        totalPurchaseOrders,
        totalSpent,
        averageOrderValue,
        purchasesByStatus,
        supplierPerformance,
      ] = await Promise.all([
        prisma.purchaseOrder.count({ where: whereClause }),
        prisma.purchaseOrder.aggregate({
          where: whereClause,
          _sum: { totalAmount: true },
        }),
        prisma.purchaseOrder.aggregate({
          where: whereClause,
          _avg: { totalAmount: true },
        }),
        prisma.purchaseOrder.groupBy({
          by: ["status"],
          where: whereClause,
          _count: true,
        }),
        this.getSupplierPerformanceData(whereClause),
      ]);

      // Get monthly purchase trends
      const monthlyPurchases = await this.getMonthlyPurchaseTrends(whereClause);

      res.json({
        success: true,
        data: {
          overview: {
            totalPurchaseOrders,
            totalSpent: totalSpent._sum.totalAmount || 0,
            averageOrderValue: averageOrderValue._avg.totalAmount || 0,
          },
          purchasesByStatus,
          supplierPerformance,
          monthlyTrends: monthlyPurchases,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve purchase analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get cost analytics
   */
  async getCostAnalytics(req: Request, res: Response) {
    try {
      const { from, to, category } = req.query;

      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from as string);
      if (to) dateFilter.lte = new Date(to as string);

      // Get cost breakdown by category
      const costByCategory = await prisma.sparePart.groupBy({
        by: ["categoryId"],
        where: category ? { categoryId: category as string } : undefined,
        _avg: { sellingPrice: true },
        _sum: { sellingPrice: true },
        _count: true,
      });

      // Get profit margins
      const profitAnalysis = await this.calculateProfitMargins(
        category as string
      );

      // Get cost trends
      const costTrends = await this.getCostTrends(dateFilter);

      res.json({
        success: true,
        data: {
          costByCategory,
          profitAnalysis,
          costTrends,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve cost analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(req: Request, res: Response) {
    try {
      const { storeId } = req.query;

      const [
        inventoryOverview,
        recentMovements,
        lowStockAlerts,
        pendingOrders,
        topSuppliers,
      ] = await Promise.all([
        this.getInventoryOverview(storeId as string),
        this.getRecentStockMovements(storeId as string),
        this.getLowStockAlerts(storeId as string),
        this.getPendingPurchaseOrders(),
        this.getTopSuppliers(),
      ]);

      res.json({
        success: true,
        data: {
          inventoryOverview,
          recentMovements,
          lowStockAlerts,
          pendingOrders,
          topSuppliers,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve dashboard data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Helper methods
  private async calculateInventoryTurnover(
    storeId: string,
    from: string,
    to: string
  ) {
    // Simplified inventory turnover calculation
    const movements = await prisma.stockMovement.aggregate({
      where: {
        storeId,
        movementType: "OUT",
        createdAt: {
          gte: from
            ? new Date(from)
            : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          lte: to ? new Date(to) : new Date(),
        },
      },
      _sum: { quantity: true },
    });

    const avgInventory = await prisma.inventoryLevel.aggregate({
      where: { storeId },
      _avg: { currentStock: true },
    });

    const outbound = movements._sum.quantity || 0;
    const avgStock = avgInventory._avg.currentStock || 1;

    return avgStock > 0 ? outbound / avgStock : 0;
  }

  private async getSupplierPerformanceData(whereClause?: any) {
    return prisma.purchaseOrder.groupBy({
      by: ["supplierId"],
      where: whereClause || {},
      _count: true,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    });
  }

  private async getMonthlyPurchaseTrends(whereClause: any) {
    // This would need to be implemented based on your database's date functions
    // For now, returning a placeholder
    return [];
  }

  private async calculateProfitMargins(categoryId?: string) {
    const whereClause = categoryId ? { categoryId } : {};

    return prisma.sparePart.aggregate({
      where: whereClause,
      _avg: {
        sellingPrice: true,
        costPrice: true,
      },
    });
  }

  private async getCostTrends(dateFilter: any) {
    // Placeholder for cost trends analysis
    return [];
  }

  private async getInventoryOverview(storeId: string) {
    const whereClause = storeId ? { storeId } : {};

    return prisma.inventoryLevel.aggregate({
      where: whereClause,
      _count: true,
      _sum: { currentStock: true },
    });
  }

  private async getRecentStockMovements(storeId: string) {
    const whereClause = storeId ? { storeId } : {};

    return prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        sparePart: {
          select: { partNumber: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  private async getLowStockAlerts(storeId: string) {
    const whereClause = storeId ? { storeId } : {};

    return prisma.inventoryLevel.findMany({
      where: {
        ...whereClause,
        currentStock: { lte: prisma.inventoryLevel.fields.reorderLevel },
      },
      include: {
        sparePart: {
          select: { partNumber: true, name: true },
        },
      },
      take: 10,
    });
  }

  private async getPendingPurchaseOrders() {
    return prisma.purchaseOrder.findMany({
      where: { status: "PENDING" },
      include: {
        supplier: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }

  private async getTopSuppliers() {
    return prisma.purchaseOrder.groupBy({
      by: ["supplierId"],
      _count: true,
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    });
  }
}
