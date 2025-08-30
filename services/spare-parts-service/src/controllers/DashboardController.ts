import { Request, Response } from 'express';
import { prisma } from '../config';

export class DashboardController {
  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      
      const [
        totalSpareParts,
        totalInventoryValue,
        lowStockCount,
        pendingOrdersCount,
        recentMovements,
        topCategories,
        monthlyTrends,
      ] = await Promise.all([
        this.getTotalSpareParts(storeId as string),
        this.getTotalInventoryValue(storeId as string),
        this.getLowStockCount(storeId as string),
        this.getPendingOrdersCount(),
        this.getRecentMovements(storeId as string),
        this.getTopCategories(storeId as string),
        this.getMonthlyTrends(storeId as string),
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            totalSpareParts,
            totalInventoryValue,
            lowStockCount,
            pendingOrdersCount,
          },
          recentMovements,
          topCategories,
          monthlyTrends,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard overview',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get inventory alerts
   */
  async getInventoryAlerts(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      
      const [
        lowStockItems,
        outOfStockItems,
        excessStockItems,
      ] = await Promise.all([
        this.getLowStockItems(storeId as string),
        this.getOutOfStockItems(storeId as string),
        this.getExcessStockItems(storeId as string),
      ]);

      res.json({
        success: true,
        data: {
          lowStockItems,
          outOfStockItems,
          excessStockItems,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve inventory alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;
      const days = this.parsePeriod(period as string);
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        inventoryTurnover,
        averageOrderValue,
        supplierPerformance,
        costSavings,
      ] = await Promise.all([
        this.calculateInventoryTurnover(fromDate),
        this.calculateAverageOrderValue(fromDate),
        this.getSupplierPerformance(fromDate),
        this.calculateCostSavings(fromDate),
      ]);

      res.json({
        success: true,
        data: {
          inventoryTurnover,
          averageOrderValue,
          supplierPerformance,
          costSavings,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Helper methods
  private async getTotalSpareParts(storeId?: string) {
    const whereClause = storeId ? { storeId } : {};
    return prisma.inventoryLevel.count({ where: whereClause });
  }

  private async getTotalInventoryValue(storeId?: string) {
    const whereClause = storeId ? { storeId } : {};
    
    const result = await prisma.inventoryLevel.findMany({
      where: whereClause,
      include: {
        sparePart: {
          select: { sellingPrice: true },
        },
      },
    });

    return result.reduce((total: number, item: any) => {
      return total + (item.currentStock * (item.sparePart.sellingPrice || 0));
    }, 0);
  }

  private async getLowStockCount(storeId?: string) {
    const whereClause = storeId ? { storeId } : {};
    
    // Using a raw query approach since Prisma doesn't support field comparisons in where clauses easily
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "InventoryLevel" 
      WHERE "currentStock" <= "reorderLevel"
      ${storeId ? 'AND "storeId" = ' + storeId : ''}
    `;
    
    return Array.isArray(result) && result.length > 0 ? Number(result[0].count) : 0;
  }

  private async getPendingOrdersCount() {
    return prisma.purchaseOrder.count({
      where: { status: 'PENDING' },
    });
  }

  private async getRecentMovements(storeId?: string) {
    const whereClause = storeId ? { storeId } : {};
    
    return prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        sparePart: {
          select: { partNumber: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getTopCategories(storeId?: string) {
    // This would need to be implemented with proper aggregation
    // For now, returning a simple category breakdown
    return prisma.sparePart.groupBy({
      by: ['categoryId'],
      _count: true,
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
  }

  private async getMonthlyTrends(storeId?: string) {
    // Placeholder for monthly trends
    // Would need proper date aggregation based on your database
    return [];
  }

  private async getLowStockItems(storeId?: string) {
    const whereClause = storeId ? { storeId } : {};
    
    const result = await prisma.$queryRaw`
      SELECT il.*, sp."partNumber", sp."name"
      FROM "InventoryLevel" il
      JOIN "SparePart" sp ON il."sparePartId" = sp.id
      WHERE il."currentStock" <= il."reorderLevel"
      ${storeId ? 'AND il."storeId" = ' + storeId : ''}
      ORDER BY il."currentStock" ASC
      LIMIT 20
    `;
    
    return result;
  }

  private async getOutOfStockItems(storeId?: string) {
    const whereClause = storeId ? { storeId, currentStock: 0 } : { currentStock: 0 };
    
    return prisma.inventoryLevel.findMany({
      where: whereClause,
      include: {
        sparePart: {
          select: { partNumber: true, name: true },
        },
      },
      take: 20,
    });
  }

  private async getExcessStockItems(storeId?: string) {
    // Items with stock significantly above maximum level
    const result = await prisma.$queryRaw`
      SELECT il.*, sp."partNumber", sp."name"
      FROM "InventoryLevel" il
      JOIN "SparePart" sp ON il."sparePartId" = sp.id
      WHERE il."currentStock" > il."maximumStock" * 1.5
      ${storeId ? 'AND il."storeId" = ' + storeId : ''}
      ORDER BY (il."currentStock" - il."maximumStock") DESC
      LIMIT 20
    `;
    
    return result;
  }

  private parsePeriod(period: string): number {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    return periodMap[period] || 30;
  }

  private async calculateInventoryTurnover(fromDate: Date) {
    const outboundMovements = await prisma.stockMovement.aggregate({
      where: {
        movementType: 'OUT',
        createdAt: { gte: fromDate },
      },
      _sum: { quantity: true },
    });

    const avgInventory = await prisma.inventoryLevel.aggregate({
      _avg: { currentStock: true },
    });

    const outbound = outboundMovements._sum.quantity || 0;
    const avgStock = avgInventory._avg.currentStock || 1;
    
    return avgStock > 0 ? outbound / avgStock : 0;
  }

  private async calculateAverageOrderValue(fromDate: Date) {
    const result = await prisma.purchaseOrder.aggregate({
      where: { createdAt: { gte: fromDate } },
      _avg: { totalAmount: true },
    });
    
    return result._avg.totalAmount || 0;
  }

  private async getSupplierPerformance(fromDate: Date) {
    return prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: { createdAt: { gte: fromDate } },
      _count: true,
      _avg: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
  }

  private async calculateCostSavings(fromDate: Date) {
    // Placeholder for cost savings calculation
    // This would involve comparing current prices vs. historical prices
    return 0;
  }
}
