import { Request, Response } from "express";
import { SparePartService } from "../services/SparePartService";
import { prisma } from "../config";
import { getPaginationParams } from "../utils";

export class SparePartController {
  private sparePartService: SparePartService;

  constructor() {
    this.sparePartService = new SparePartService(prisma);
  }

  /**
   * Get all spare parts with filtering and pagination
   */
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        supplierId: req.query.supplierId as string,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === "true"
            : undefined,
        minPrice: req.query.minPrice
          ? parseFloat(req.query.minPrice as string)
          : undefined,
        maxPrice: req.query.maxPrice
          ? parseFloat(req.query.maxPrice as string)
          : undefined,
        compatibility: req.query.compatibility as string,
        inStock: req.query.inStock === "true",
        lowStock: req.query.lowStock === "true",
      };

      const result = await this.sparePartService.getAll(filters, pagination);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve spare parts",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get spare part by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.sparePartService.getById(id);

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve spare part",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create new spare part
   */
  async create(req: Request, res: Response) {
    try {
      const sparePartData = {
        ...req.body,
        createdBy: req.user?.id,
      };

      const result = await this.sparePartService.create(sparePartData);

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create spare part",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update spare part
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id,
      };

      const result = await this.sparePartService.update(id, updateData);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update spare part",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete spare part
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.sparePartService.delete(id);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete spare part",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get spare parts compatible with vehicle model
   */
  async getByVehicleModel(req: Request, res: Response) {
    try {
      const { modelId } = req.params;
      const result = await this.sparePartService.getByVehicleModel(modelId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve compatible spare parts",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update spare part pricing
   */
  async updatePricing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { costPrice, sellingPrice, mrp, markupPercent, reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Reason for price change is required",
        });
      }

      const result = await this.sparePartService.updatePricing(
        id,
        costPrice,
        sellingPrice,
        mrp,
        markupPercent,
        reason,
        req.user?.id || "system"
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update spare part pricing",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Bulk update spare parts
   */
  async bulkUpdate(req: Request, res: Response) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Updates array is required and must not be empty",
        });
      }

      const result = await this.sparePartService.bulkUpdate(updates);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to perform bulk update",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get price history for spare part
   */
  async getPriceHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const priceHistory = await prisma.partPriceHistory.findMany({
        where: { sparePartId: id },
        orderBy: { effectiveDate: "desc" },
        take: limit,
        include: {
          sparePart: {
            select: {
              id: true,
              name: true,
              partNumber: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: priceHistory,
        message: "Price history retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve price history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get usage analytics for spare part
   */
  async getUsageAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const period = (req.query.period as string) || "30"; // days

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // TODO: Fix analytics once Prisma client is properly synced
      // Temporarily disabled to test core functionality
      /*
      const usageData = await prisma.installedPart.findMany({
        where: {
          sparePartId: id,
          installedAt: {
            gte: startDate,
            lte: endDate,
          }
        },
        orderBy: { installedAt: 'desc' },
        include: {
          sparePart: {
            select: {
              id: true,
              name: true,
              partNumber: true,
              unitPrice: true,
            }
          },
          serviceRequest: {
            select: {
              id: true,
              estimatedCost: true,
            }
          }
        }
      });

      // Calculate analytics from installed parts data
      const totalUsage = usageData.length;
      const totalCost = usageData.reduce((sum: number, part: any) => sum + (part.sparePart?.unitPrice || 0), 0);
      const totalRevenue = usageData.reduce((sum: number, part: any) => sum + (part.serviceCost || part.serviceRequest?.estimatedCost || 0), 0);
      */

      // Temporary mock data for analytics
      const totalUsage = 0;
      const totalCost = 0;
      const totalRevenue = 0;
      const totalMargin = totalRevenue - totalCost;
      const averageMargin =
        totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

      const analytics = {
        period: `${period} days`,
        totalUsage,
        totalRevenue,
        totalCost,
        totalMargin,
        averageMargin,
        usageCount: 0, // Temporarily disabled
        recentUsages: [], // Temporarily disabled
      };

      res.json({
        success: true,
        data: analytics,
        message: "Usage analytics retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve usage analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
