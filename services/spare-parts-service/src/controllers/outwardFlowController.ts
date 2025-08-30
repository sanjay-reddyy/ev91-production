import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { OutwardFlowService } from "../services/OutwardFlowService";
import { ApiResponse, PaginationParams } from "../types";
import {
  createSuccessResponse,
  createErrorResponse,
  getPaginationParams,
} from "../utils";

const prisma = new PrismaClient();
const outwardFlowService = new OutwardFlowService(prisma);

/**
 * Controller for Spare Parts Outward Flow Operations
 * Handles technician requests, approvals, issuance, installation, and returns
 */
export class OutwardFlowController {
  /**
   * Create a spare part request from technician
   * POST /api/spare-parts/outward/request
   */
  static async createPartRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;

      // Validate required fields
      const requiredFields = [
        "serviceRequestId",
        "sparePartId",
        "technicianId",
        "requestedQuantity",
      ];

      const missingFields = requiredFields.filter(
        (field) => !requestData[field]
      );
      if (missingFields.length > 0) {
        res
          .status(400)
          .json(
            createErrorResponse(
              `Missing required fields: ${missingFields.join(", ")}`
            )
          );
        return;
      }

      const result = await outwardFlowService.createPartRequest(requestData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error creating part request:", error);
      res
        .status(500)
        .json(createErrorResponse("Failed to create part request"));
    }
  }

  /**
   * Get spare part requests with filters
   * GET /api/spare-parts/outward/requests
   */
  static async getPartRequests(req: Request, res: Response): Promise<void> {
    try {
      const pagination = getPaginationParams(req.query);
      const {
        serviceRequestId,
        sparePartId,
        technicianId,
        storeId,
        status,
        urgency,
        dateFrom,
        dateTo,
      } = req.query;

      const filters = {
        serviceRequestId: serviceRequestId as string,
        sparePartId: sparePartId as string,
        technicianId: technicianId as string,
        storeId: storeId as string,
        status: status as string,
        urgency: urgency as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof typeof filters] === undefined &&
          delete filters[key as keyof typeof filters]
      );

      // Build Prisma query
      const where: any = {};

      if (filters.serviceRequestId)
        where.serviceRequestId = filters.serviceRequestId;
      if (filters.sparePartId) where.sparePartId = filters.sparePartId;
      if (filters.technicianId) where.requestedBy = filters.technicianId;
      if (filters.storeId) where.storeId = filters.storeId;
      if (filters.status) where.status = filters.status;
      if (filters.urgency) where.urgency = filters.urgency;

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }

      const [requests, totalCount] = await Promise.all([
        prisma.sparePartRequest.findMany({
          where,
          include: {
            sparePart: {
              include: { category: true },
            },
            serviceRequest: true,
            approvalHistory: {
              orderBy: { assignedAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
          take: pagination.limit || 10,
        }),
        prisma.sparePartRequest.count({ where }),
      ]);

      const pageSize = pagination.limit || 10;
      const currentPage = pagination.page || 1;

      const paginationInfo = {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: currentPage,
        pageSize: pageSize,
        hasNext: currentPage < Math.ceil(totalCount / pageSize),
        hasPrev: currentPage > 1,
      };

      res.json(
        createSuccessResponse(
          requests,
          "Requests retrieved successfully",
          paginationInfo
        )
      );
    } catch (error) {
      console.error("Error fetching part requests:", error);
      res
        .status(500)
        .json(createErrorResponse("Failed to fetch part requests"));
    }
  }

  /**
   * Approve a spare part request
   * POST /api/spare-parts/outward/requests/:id/approve
   */
  static async approvePartRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approverId, comments, conditions } = req.body;

      if (!approverId) {
        res.status(400).json(createErrorResponse("Approver ID is required"));
        return;
      }

      const result = await outwardFlowService.approvePartRequest(
        id,
        approverId,
        comments,
        conditions
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json(createErrorResponse("Failed to approve request"));
    }
  }

  /**
   * Issue parts to technician
   * POST /api/spare-parts/outward/requests/:id/issue
   */
  static async issuePartsToTechnician(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      const result = await outwardFlowService.issuePartsToTechnician(id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error issuing parts:", error);
      res.status(500).json(createErrorResponse("Failed to issue parts"));
    }
  }

  /**
   * Install spare part on vehicle
   * POST /api/spare-parts/outward/install
   */
  static async installSparePart(req: Request, res: Response): Promise<void> {
    try {
      const installationData = req.body;

      // Validate required fields
      const requiredFields = [
        "serviceRequestId",
        "sparePartId",
        "technicianId",
        "quantity",
        "unitCost",
      ];

      const missingFields = requiredFields.filter(
        (field) => !installationData[field]
      );
      if (missingFields.length > 0) {
        res
          .status(400)
          .json(
            createErrorResponse(
              `Missing required fields: ${missingFields.join(", ")}`
            )
          );
        return;
      }

      const result = await outwardFlowService.installSparePart(
        installationData
      );

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error installing part:", error);
      res.status(500).json(createErrorResponse("Failed to install part"));
    }
  }

  /**
   * Return unused parts to inventory
   * POST /api/spare-parts/outward/return
   */
  static async returnUnusedParts(req: Request, res: Response): Promise<void> {
    try {
      const { serviceRequestId, returns } = req.body;

      if (!serviceRequestId || !returns || !Array.isArray(returns)) {
        res
          .status(400)
          .json(
            createErrorResponse(
              "Service request ID and returns array are required"
            )
          );
        return;
      }

      const result = await outwardFlowService.returnUnusedParts(
        serviceRequestId,
        returns
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error returning parts:", error);
      res.status(500).json(createErrorResponse("Failed to return parts"));
    }
  }

  /**
   * Calculate service cost breakdown
   * GET /api/spare-parts/outward/cost/:serviceRequestId
   */
  static async calculateServiceCost(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { serviceRequestId } = req.params;

      const result = await outwardFlowService.calculateServiceCost(
        serviceRequestId
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error calculating service cost:", error);
      res
        .status(500)
        .json(createErrorResponse("Failed to calculate service cost"));
    }
  }

  /**
   * Get installed parts for a service request
   * GET /api/spare-parts/outward/installed/:serviceRequestId
   */
  static async getInstalledParts(req: Request, res: Response): Promise<void> {
    try {
      const { serviceRequestId } = req.params;

      const installedParts = await prisma.installedPart.findMany({
        where: { serviceRequestId },
        include: {
          sparePart: {
            include: { category: true },
          },
        },
        orderBy: { installedAt: "desc" },
      });

      res.json(
        createSuccessResponse(
          installedParts,
          "Installed parts retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error fetching installed parts:", error);
      res
        .status(500)
        .json(createErrorResponse("Failed to fetch installed parts"));
    }
  }

  /**
   * Get approval history for a request
   * GET /api/spare-parts/outward/requests/:id/approval-history
   */
  static async getApprovalHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const approvalHistory = await prisma.approvalHistory.findMany({
        where: { requestId: id },
        orderBy: { assignedAt: "desc" },
      });

      res.json(
        createSuccessResponse(
          approvalHistory,
          "Approval history retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error fetching approval history:", error);
      res
        .status(500)
        .json(createErrorResponse("Failed to fetch approval history"));
    }
  }

  /**
   * Get stock availability for a part
   * GET /api/spare-parts/outward/stock-availability/:sparePartId/:storeId
   */
  static async getStockAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { sparePartId, storeId } = req.params;
      const { quantity } = req.query;

      const requestedQuantity = quantity ? parseInt(quantity as string) : 1;

      const inventoryLevel = await prisma.inventoryLevel.findFirst({
        where: {
          sparePartId,
          storeId,
          isActive: true,
        },
        include: {
          sparePart: true,
        },
      });

      if (!inventoryLevel) {
        res.json(
          createSuccessResponse({
            sparePartId,
            storeId,
            availableQuantity: 0,
            reservedQuantity: 0,
            totalStock: 0,
            available: false,
          })
        );
        return;
      }

      const stockAvailability = {
        sparePartId,
        storeId,
        availableQuantity: inventoryLevel.availableStock,
        reservedQuantity: inventoryLevel.reservedStock,
        totalStock: inventoryLevel.currentStock,
        available: inventoryLevel.availableStock >= requestedQuantity,
        sparePart: inventoryLevel.sparePart,
      };

      res.json(
        createSuccessResponse(
          stockAvailability,
          "Stock availability retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error checking stock availability:", error);
      res
        .status(500)
        .json(createErrorResponse("Failed to check stock availability"));
    }
  }

  /**
   * Get outward flow analytics
   * GET /api/spare-parts/outward/analytics
   */
  static async getOutwardAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, dateFrom, dateTo } = req.query;

      const dateFilters: any = {};
      if (dateFrom) dateFilters.gte = new Date(dateFrom as string);
      if (dateTo) dateFilters.lte = new Date(dateTo as string);

      const baseWhere: any = {};
      if (storeId) baseWhere.storeId = storeId;
      if (Object.keys(dateFilters).length > 0) {
        baseWhere.createdAt = dateFilters;
      }

      const [
        totalRequests,
        pendingRequests,
        approvedRequests,
        issuedRequests,
        installedParts,
        totalPartsValue,
        avgApprovalTime,
      ] = await Promise.all([
        prisma.sparePartRequest.count({ where: baseWhere }),
        prisma.sparePartRequest.count({
          where: { ...baseWhere, status: "Pending" },
        }),
        prisma.sparePartRequest.count({
          where: { ...baseWhere, status: "Approved" },
        }),
        prisma.sparePartRequest.count({
          where: { ...baseWhere, status: "Issued" },
        }),
        prisma.installedPart.count({ where: baseWhere }),
        prisma.installedPart.aggregate({
          where: baseWhere,
          _sum: { totalCost: true },
        }),
        // This would need a more complex query to calculate actual approval time
        Promise.resolve(2.5), // Mock average approval time in hours
      ]);

      const analytics = {
        summary: {
          totalRequests,
          pendingRequests,
          approvedRequests,
          issuedRequests,
          installedParts,
          totalPartsValue: totalPartsValue._sum.totalCost || 0,
          avgApprovalTime,
        },
        trends: {
          // This would be calculated based on historical data
          requestTrend: "increasing",
          approvalRate:
            totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
          installationRate:
            issuedRequests > 0 ? (installedParts / issuedRequests) * 100 : 0,
        },
      };

      res.json(
        createSuccessResponse(analytics, "Analytics retrieved successfully")
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json(createErrorResponse("Failed to fetch analytics"));
    }
  }
}

export default OutwardFlowController;
