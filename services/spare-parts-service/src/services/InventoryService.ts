import { PrismaClient, InventoryLevel, StockMovement } from "@prisma/client";
import {
  StockFilters,
  PaginationParams,
  ApiResponse,
  StockMovementRequest,
  PaginationInfo,
} from "../types";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginationInfo,
  getPrismaSkipTake,
  getStockStatus,
  getUrgencyLevel,
} from "../utils";

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get stock levels with filtering and pagination
   */
  async getStockLevels(
    filters: StockFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<{ stockLevels: any[]; pagination: PaginationInfo }>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = pagination;
      const { skip, take } = getPrismaSkipTake(page, limit);

      // Build where clause
      const where: any = {};

      if (filters.storeId) {
        where.storeId = filters.storeId;
      }

      if (filters.sparePartId) {
        where.sparePartId = filters.sparePartId;
      }

      if (filters.lowStock) {
        // For low stock filter, we'll need to use a custom approach since field references don't work
        where.currentStock = { lte: 20 }; // Default reorder level
      }

      if (filters.outOfStock) {
        where.currentStock = { lte: 0 };
      }

      if (filters.minQuantity !== undefined) {
        where.currentStock = {
          ...where.currentStock,
          gte: filters.minQuantity,
        };
      }

      if (filters.maxQuantity !== undefined) {
        where.currentStock = {
          ...where.currentStock,
          lte: filters.maxQuantity,
        };
      }

      where.isActive = true;

      // Get total count
      const totalItems = await this.prisma.inventoryLevel.count({ where });

      // Get stock levels with relations
      const stockLevels = await this.prisma.inventoryLevel.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sparePart: {
            include: {
              category: true,
              supplier: true,
            },
          },
          stockMovements: {
            take: 5,
            orderBy: { movementDate: "desc" },
            select: {
              id: true,
              movementType: true,
              quantity: true,
              movementDate: true,
              reason: true,
            },
          },
        },
      });

      // Enhance stock levels with computed properties
      const enhancedStockLevels = stockLevels.map((stock: any) => ({
        ...stock,
        stockStatus: getStockStatus(
          stock.currentStock,
          stock.minimumStock,
          stock.maximumStock
        ),
        urgencyLevel: getUrgencyLevel(
          getStockStatus(
            stock.currentStock,
            stock.minimumStock,
            stock.maximumStock
          )
        ),
        valueAtCost: stock.currentStock * stock.sparePart.costPrice,
        valueAtSelling: stock.currentStock * stock.sparePart.sellingPrice,
        reorderRequired: stock.currentStock <= stock.reorderLevel,
        daysOfStock: this.calculateDaysOfStock(stock),
      }));

      const paginationInfo = createPaginationInfo(totalItems, page, limit);

      return createSuccessResponse(
        { stockLevels: enhancedStockLevels, pagination: paginationInfo },
        "Stock levels retrieved successfully"
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to retrieve stock levels",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get stock level by store and spare part
   */
  async getStockLevel(
    storeId: string,
    sparePartId: string
  ): Promise<ApiResponse<any>> {
    try {
      const stockLevel = await this.prisma.inventoryLevel.findUnique({
        where: {
          sparePartId_storeId: {
            sparePartId,
            storeId,
          },
        },
        include: {
          sparePart: {
            include: {
              category: true,
              supplier: true,
            },
          },
          stockMovements: {
            take: 20,
            orderBy: { movementDate: "desc" },
          },
        },
      });

      if (!stockLevel) {
        return createErrorResponse("Stock level not found");
      }

      const enhanced = {
        ...stockLevel,
        stockStatus: getStockStatus(
          stockLevel.currentStock,
          stockLevel.minimumStock,
          stockLevel.maximumStock
        ),
        urgencyLevel: getUrgencyLevel(
          getStockStatus(
            stockLevel.currentStock,
            stockLevel.minimumStock,
            stockLevel.maximumStock
          )
        ),
        valueAtCost: stockLevel.currentStock * stockLevel.sparePart.costPrice,
        valueAtSelling:
          stockLevel.currentStock * stockLevel.sparePart.sellingPrice,
        reorderRequired: stockLevel.currentStock <= stockLevel.reorderLevel,
        daysOfStock: this.calculateDaysOfStock(stockLevel),
      };

      return createSuccessResponse(
        enhanced,
        "Stock level retrieved successfully"
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to retrieve stock level",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Initialize stock level for a new spare part in a store
   */
  async initializeStock(
    sparePartId: string,
    storeId: string,
    storeName: string,
    initialStock: number = 0,
    minimumStock: number = 10,
    maximumStock: number = 100,
    reorderLevel: number = 20
  ): Promise<ApiResponse<InventoryLevel>> {
    try {
      // Check if stock level already exists
      const existing = await this.prisma.inventoryLevel.findUnique({
        where: {
          sparePartId_storeId: {
            sparePartId,
            storeId,
          },
        },
      });

      if (existing) {
        return createErrorResponse(
          "Stock level already exists for this spare part in this store"
        );
      }

      const stockLevel = await this.prisma.inventoryLevel.create({
        data: {
          sparePartId,
          storeId,
          storeName,
          currentStock: initialStock,
          availableStock: initialStock,
          minimumStock,
          maximumStock,
          reorderLevel,
          reorderQuantity: maximumStock - minimumStock,
          lastCountDate: new Date(),
          lastMovementDate: initialStock > 0 ? new Date() : null,
        },
      });

      // Create initial stock movement if there's initial stock
      if (initialStock > 0) {
        await this.createStockMovement(
          {
            sparePartId,
            storeId,
            movementType: "IN",
            quantity: initialStock,
            reason: "Initial stock setup",
            referenceType: "INITIALIZATION",
          },
          "SYSTEM"
        );
      }

      return createSuccessResponse(
        stockLevel,
        "Stock level initialized successfully"
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to initialize stock level",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Create stock movement and update stock levels
   */
  async createStockMovement(
    movementRequest: StockMovementRequest,
    createdBy: string
  ): Promise<ApiResponse<StockMovement>> {
    try {
      const {
        sparePartId,
        storeId,
        movementType,
        quantity,
        unitCost,
        reason,
        notes,
        referenceType,
        referenceId,
      } = movementRequest;

      // Get current stock level
      const stockLevel = await this.prisma.inventoryLevel.findUnique({
        where: {
          sparePartId_storeId: {
            sparePartId,
            storeId,
          },
        },
        include: {
          sparePart: true,
        },
      });

      if (!stockLevel) {
        return createErrorResponse(
          "Stock level not found. Please initialize stock first."
        );
      }

      // Validate movement
      const previousStock = stockLevel.currentStock;
      let newStock: number;

      switch (movementType) {
        case "IN":
          newStock = previousStock + quantity;
          break;
        case "OUT":
          if (previousStock < quantity) {
            return createErrorResponse("Insufficient stock for this movement");
          }
          newStock = previousStock - quantity;
          break;
        case "ADJUSTMENT":
          newStock = quantity; // Direct adjustment to specific quantity
          break;
        case "TRANSFER":
          if (previousStock < quantity) {
            return createErrorResponse("Insufficient stock for transfer");
          }
          newStock = previousStock - quantity;
          break;
        case "DAMAGED":
          if (previousStock < quantity) {
            return createErrorResponse(
              "Cannot mark more items as damaged than available"
            );
          }
          newStock = previousStock - quantity;
          break;
        case "RETURN":
          newStock = previousStock + quantity;
          break;
        default:
          return createErrorResponse("Invalid movement type");
      }

      // Create movement and update stock in transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Create stock movement record
        const movement = await tx.stockMovement.create({
          data: {
            stockLevelId: stockLevel.id,
            sparePartId,
            storeId,
            movementType,
            quantity:
              movementType === "OUT" || movementType === "DAMAGED"
                ? -quantity
                : quantity,
            previousStock,
            newStock,
            unitCost: unitCost || stockLevel.sparePart.costPrice,
            totalValue: (unitCost || stockLevel.sparePart.costPrice) * quantity,
            referenceType,
            referenceId,
            reason,
            notes,
            createdBy,
            movementDate: new Date(),
          },
        });

        // Update stock level
        await tx.inventoryLevel.update({
          where: { id: stockLevel.id },
          data: {
            currentStock: newStock,
            availableStock: newStock - stockLevel.reservedStock,
            damagedStock:
              movementType === "DAMAGED"
                ? stockLevel.damagedStock + quantity
                : stockLevel.damagedStock,
            lastMovementDate: new Date(),
          },
        });

        return movement;
      });

      return createSuccessResponse(
        result,
        "Stock movement created successfully"
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to create stock movement",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Reserve stock for pending orders/services
   */
  async reserveStock(
    sparePartId: string,
    storeId: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
    createdBy: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const stockLevel = await this.prisma.inventoryLevel.findUnique({
        where: {
          sparePartId_storeId: {
            sparePartId,
            storeId,
          },
        },
      });

      if (!stockLevel) {
        return createErrorResponse("Stock level not found");
      }

      if (stockLevel.availableStock < quantity) {
        return createErrorResponse(
          "Insufficient available stock for reservation"
        );
      }

      await this.prisma.inventoryLevel.update({
        where: { id: stockLevel.id },
        data: {
          reservedStock: stockLevel.reservedStock + quantity,
          availableStock: stockLevel.availableStock - quantity,
        },
      });

      // Create movement record for tracking
      await this.createStockMovement(
        {
          sparePartId,
          storeId,
          movementType: "OUT",
          quantity,
          reason: `Stock reserved for ${referenceType}`,
          referenceType,
          referenceId,
        },
        createdBy
      );

      return createSuccessResponse(true, "Stock reserved successfully");
    } catch (error) {
      return createErrorResponse(
        "Failed to reserve stock",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Release reserved stock
   */
  async releaseReservedStock(
    sparePartId: string,
    storeId: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
    createdBy: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const stockLevel = await this.prisma.inventoryLevel.findUnique({
        where: {
          sparePartId_storeId: {
            sparePartId,
            storeId,
          },
        },
      });

      if (!stockLevel) {
        return createErrorResponse("Stock level not found");
      }

      if (stockLevel.reservedStock < quantity) {
        return createErrorResponse("Cannot release more stock than reserved");
      }

      await this.prisma.inventoryLevel.update({
        where: { id: stockLevel.id },
        data: {
          reservedStock: stockLevel.reservedStock - quantity,
          availableStock: stockLevel.availableStock + quantity,
        },
      });

      // Create movement record for tracking
      await this.createStockMovement(
        {
          sparePartId,
          storeId,
          movementType: "IN",
          quantity,
          reason: `Stock released from ${referenceType}`,
          referenceType,
          referenceId,
        },
        createdBy
      );

      return createSuccessResponse(
        true,
        "Reserved stock released successfully"
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to release reserved stock",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(storeId?: string): Promise<ApiResponse<any[]>> {
    try {
      const where: any = {
        isActive: true,
        OR: [
          { currentStock: { lte: { reorderLevel: true } } },
          { currentStock: 0 },
        ],
      };

      if (storeId) {
        where.storeId = storeId;
      }

      const lowStockItems = await this.prisma.inventoryLevel.findMany({
        where,
        include: {
          sparePart: {
            include: {
              category: true,
              supplier: true,
            },
          },
        },
        orderBy: { currentStock: "asc" },
      });

      const alerts = lowStockItems.map((stock: any) => ({
        ...stock,
        stockStatus: getStockStatus(
          stock.currentStock,
          stock.minimumStock,
          stock.maximumStock
        ),
        urgencyLevel: getUrgencyLevel(
          getStockStatus(
            stock.currentStock,
            stock.minimumStock,
            stock.maximumStock
          )
        ),
        shortfallQuantity: Math.max(0, stock.reorderLevel - stock.currentStock),
        suggestedOrderQuantity: stock.reorderQuantity,
      }));

      return createSuccessResponse(
        alerts,
        "Low stock alerts retrieved successfully"
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to retrieve low stock alerts",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Perform stock count/audit
   */
  async performStockCount(
    storeId: string,
    countData: Array<{
      sparePartId: string;
      physicalCount: number;
      notes?: string;
    }>,
    countedBy: string
  ): Promise<ApiResponse<{ adjustments: number; totalVariance: number }>> {
    try {
      let adjustments = 0;
      let totalVariance = 0;

      for (const item of countData) {
        const stockLevel = await this.prisma.inventoryLevel.findUnique({
          where: {
            sparePartId_storeId: {
              sparePartId: item.sparePartId,
              storeId,
            },
          },
        });

        if (stockLevel) {
          const variance = item.physicalCount - stockLevel.currentStock;
          if (variance !== 0) {
            // Create adjustment movement
            await this.createStockMovement(
              {
                sparePartId: item.sparePartId,
                storeId,
                movementType: "ADJUSTMENT",
                quantity: Math.abs(variance),
                reason: "Stock count adjustment",
                notes: `Physical count: ${item.physicalCount}, System count: ${
                  stockLevel.currentStock
                }. ${item.notes || ""}`,
                referenceType: "STOCK_COUNT",
              },
              countedBy
            );

            adjustments++;
            totalVariance += Math.abs(variance);
          }

          // Update last count date
          await this.prisma.inventoryLevel.update({
            where: { id: stockLevel.id },
            data: { lastCountDate: new Date() },
          });
        }
      }

      return createSuccessResponse(
        { adjustments, totalVariance },
        `Stock count completed. ${adjustments} adjustments made.`
      );
    } catch (error) {
      return createErrorResponse(
        "Failed to perform stock count",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Calculate days of stock based on average consumption
   */
  private calculateDaysOfStock(stockLevel: any): number {
    // This is a simplified calculation
    // In production, you'd calculate based on historical usage patterns
    const averageDailyConsumption = 2; // Placeholder
    return stockLevel.currentStock / averageDailyConsumption;
  }
}
