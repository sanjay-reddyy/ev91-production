import { PrismaClient, SparePart, Category, Supplier } from "@prisma/client";
import {
  SparePartFilters,
  PaginationParams,
  ApiResponse,
  PaginationInfo,
} from "../types";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginationInfo,
  getPrismaSkipTake,
} from "../utils";

export class SparePartService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all spare parts with filtering and pagination
   */
  async getAll(
    filters: SparePartFilters = {},
    pagination: PaginationParams = {}
  ): Promise<
    ApiResponse<{ spareParts: SparePart[]; pagination: PaginationInfo }>
  > {
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

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { partNumber: { contains: filters.search, mode: "insensitive" } },
          { internalCode: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.minPrice || filters.maxPrice) {
        where.sellingPrice = {};
        if (filters.minPrice) where.sellingPrice.gte = filters.minPrice;
        if (filters.maxPrice) where.sellingPrice.lte = filters.maxPrice;
      }

      if (filters.compatibility) {
        where.compatibility = {
          contains: filters.compatibility,
        };
      }

      // Handle stock-based filters
      if (filters.inStock || filters.lowStock) {
        where.stockLevels = {
          some: filters.inStock
            ? { currentStock: { gt: 0 } }
            : { currentStock: { lte: { stockLevel: { reorderLevel: true } } } },
        };
      }

      // Get total count
      const totalItems = await this.prisma.sparePart.count({ where });

      // Get spare parts with relations
      const spareParts = await this.prisma.sparePart.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              displayName: true,
              code: true,
              supplierType: true,
            },
          },
          stockLevels: {
            select: {
              storeId: true,
              storeName: true,
              currentStock: true,
              availableStock: true,
              minimumStock: true,
            },
          },
          // _count: {
          //   select: {
          //     installedParts: true,
          //     purchaseOrderItems: true,
          //   },
          // },
        },
      });

      const paginationInfo = createPaginationInfo(totalItems, page, limit);

      return createSuccessResponse(
        { spareParts, pagination: paginationInfo },
        "Spare parts retrieved successfully"
      );
    } catch (error) {
      console.error("Error in SparePartService.getAll:", error);
      return createErrorResponse(
        "Failed to retrieve spare parts",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get spare part by ID
   */
  async getById(id: string): Promise<ApiResponse<SparePart>> {
    try {
      const sparePart = await this.prisma.sparePart.findUnique({
        where: { id },
        include: {
          category: true,
          supplier: {
            include: {
              supplierContacts: {
                where: { isActive: true },
              },
            },
          },
          stockLevels: {
            include: {
              stockMovements: {
                take: 10,
                orderBy: { movementDate: "desc" },
              },
            },
          },
          priceHistories: {
            take: 10,
            orderBy: { effectiveDate: "desc" },
          },
          // servicePartUsages: {
          //   take: 5,
          //   orderBy: { usageDate: "desc" },
          // },
        },
      });

      if (!sparePart) {
        return createErrorResponse("Spare part not found");
      }

      return createSuccessResponse(
        sparePart,
        "Spare part retrieved successfully"
      );
    } catch (error) {
      console.error("Error in SparePartService.getById:", error);
      return createErrorResponse(
        "Failed to retrieve spare part",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Create new spare part
   */
  async create(data: Partial<SparePart>): Promise<ApiResponse<SparePart>> {
    try {
      // Validate required fields
      if (
        !data.name ||
        !data.partNumber ||
        !data.categoryId ||
        !data.supplierId
      ) {
        return createErrorResponse(
          "Missing required fields: name, partNumber, categoryId, supplierId"
        );
      }

      // Check if part number already exists
      const existingPart = await this.prisma.sparePart.findUnique({
        where: { partNumber: data.partNumber },
      });

      if (existingPart) {
        return createErrorResponse("Part number already exists");
      }

      // Generate internal code if not provided
      if (!data.internalCode) {
        const category = await this.prisma.category.findUnique({
          where: { id: data.categoryId! },
        });
        data.internalCode = `${category?.code || "SP"}-${Date.now()}`;
      }

      // Calculate selling price if not provided
      if (!data.sellingPrice && data.costPrice && data.markupPercent) {
        data.sellingPrice = data.costPrice * (1 + data.markupPercent / 100);
      }

      // Extract fields that are valid for the Prisma schema
      const { createdBy, updatedBy, ...validData } = data as any;

      const sparePart = await this.prisma.sparePart.create({
        data: {
          ...validData,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        include: {
          category: true,
          supplier: true,
        },
      });

      return createSuccessResponse(
        sparePart,
        "Spare part created successfully"
      );
    } catch (error) {
      console.error("Error in SparePartService.create:", error);
      return createErrorResponse(
        "Failed to create spare part",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Update spare part
   */
  async update(
    id: string,
    data: Partial<SparePart>
  ): Promise<ApiResponse<SparePart>> {
    try {
      // Check if spare part exists
      const existingSparePart = await this.prisma.sparePart.findUnique({
        where: { id },
      });

      if (!existingSparePart) {
        return createErrorResponse("Spare part not found");
      }

      // Check if part number is being changed and if it already exists
      if (data.partNumber && data.partNumber !== existingSparePart.partNumber) {
        const existingPartWithNumber = await this.prisma.sparePart.findUnique({
          where: { partNumber: data.partNumber },
        });

        if (existingPartWithNumber) {
          return createErrorResponse("Part number already exists");
        }
      }

      // Recalculate selling price if cost price or markup changed
      if (data.costPrice || data.markupPercent) {
        const costPrice = data.costPrice || existingSparePart.costPrice;
        const markupPercent =
          data.markupPercent || existingSparePart.markupPercent;
        data.sellingPrice = costPrice * (1 + markupPercent / 100);
      }

      // Filter out fields that are not part of the Prisma schema
      const { createdBy, updatedBy, ...validData } = data as any;

      const sparePart = await this.prisma.sparePart.update({
        where: { id },
        data: {
          ...validData,
          updatedAt: new Date(),
        } as any,
        include: {
          category: true,
          supplier: true,
        },
      });

      return createSuccessResponse(
        sparePart,
        "Spare part updated successfully"
      );
    } catch (error) {
      console.error("Error in SparePartService.update:", error);
      return createErrorResponse(
        "Failed to update spare part",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Delete spare part
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Check if spare part exists
      const existingSparePart = await this.prisma.sparePart.findUnique({
        where: { id },
        include: {
          stockLevels: true,
          // servicePartUsages: true,
          // purchaseOrderItems: true,
        },
      });

      if (!existingSparePart) {
        return createErrorResponse("Spare part not found");
      }

      // Check if spare part is being used (temporarily disabled - check only stock levels)
      if (
        existingSparePart.stockLevels.length > 0
        // existingSparePart.servicePartUsages.length > 0 ||
        // existingSparePart.purchaseOrderItems.length > 0
      ) {
        // Soft delete - mark as inactive instead of hard delete
        await this.prisma.sparePart.update({
          where: { id },
          data: {
            isActive: false,
            isDiscontinued: true,
            updatedAt: new Date(),
          },
        });

        return createSuccessResponse(
          true,
          "Spare part marked as inactive due to existing usage"
        );
      }

      // Hard delete if no usage
      await this.prisma.sparePart.delete({
        where: { id },
      });

      return createSuccessResponse(true, "Spare part deleted successfully");
    } catch (error) {
      console.error("Error in SparePartService.delete:", error);
      return createErrorResponse(
        "Failed to delete spare part",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get spare parts by vehicle model compatibility
   */
  async getByVehicleModel(modelId: string): Promise<ApiResponse<SparePart[]>> {
    try {
      const spareParts = await this.prisma.sparePart.findMany({
        where: {
          compatibility: {
            contains: modelId,
          },
          isActive: true,
        },
        include: {
          category: true,
          supplier: true,
          stockLevels: {
            select: {
              storeId: true,
              storeName: true,
              currentStock: true,
              availableStock: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return createSuccessResponse(
        spareParts,
        "Compatible spare parts retrieved successfully"
      );
    } catch (error) {
      console.error("Error in SparePartService.getByVehicleModel:", error);
      return createErrorResponse(
        "Failed to retrieve compatible spare parts",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Update spare part prices
   */
  async updatePricing(
    id: string,
    costPrice: number,
    sellingPrice: number,
    mrp: number,
    markupPercent: number,
    reason: string,
    changedBy: string
  ): Promise<ApiResponse<SparePart>> {
    try {
      const existingSparePart = await this.prisma.sparePart.findUnique({
        where: { id },
      });

      if (!existingSparePart) {
        return createErrorResponse("Spare part not found");
      }

      // Update spare part prices in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create price history record
        await tx.partPriceHistory.create({
          data: {
            sparePartId: id,
            costPrice: existingSparePart.costPrice,
            sellingPrice: existingSparePart.sellingPrice,
            mrp: existingSparePart.mrp,
            markupPercent: existingSparePart.markupPercent,
            changeReason: reason,
            effectiveDate: new Date(),
            changedBy,
          },
        });

        // Update spare part with new prices
        return await tx.sparePart.update({
          where: { id },
          data: {
            costPrice,
            sellingPrice,
            mrp,
            markupPercent,
            updatedAt: new Date(),
          },
          include: {
            category: true,
            supplier: true,
          },
        });
      });

      return createSuccessResponse(
        result,
        "Spare part pricing updated successfully"
      );
    } catch (error) {
      console.error("Error in SparePartService.updatePricing:", error);
      return createErrorResponse(
        "Failed to update spare part pricing",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Bulk update spare parts
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: Partial<SparePart> }>
  ): Promise<
    ApiResponse<{ successful: number; failed: number; errors: any[] }>
  > {
    try {
      let successful = 0;
      let failed = 0;
      const errors: any[] = [];

      for (const update of updates) {
        try {
          await this.prisma.sparePart.update({
            where: { id: update.id },
            data: {
              ...update.data,
              updatedAt: new Date(),
            } as any,
          });
          successful++;
        } catch (error) {
          failed++;
          errors.push({
            id: update.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return createSuccessResponse(
        { successful, failed, errors },
        `Bulk update completed: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error("Error in SparePartService.bulkUpdate:", error);
      return createErrorResponse(
        "Failed to perform bulk update",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
}
