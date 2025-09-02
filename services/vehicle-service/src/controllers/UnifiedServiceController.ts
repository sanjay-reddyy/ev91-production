import { Request, Response } from "express";
import {
  PrismaClient,
  ServiceRequestType,
  ServiceRequestStatus,
  ServiceRequestPriority,
  ApprovalType,
  ApprovalStatus,
} from "@prisma/client";
import {
  ServiceRequest,
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  ServiceRequestFilters,
} from "../types/unifiedService";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

/**
 * Unified Service Request Controller
 * Handles both vehicle service scheduling and spare parts integration
 */
export class UnifiedServiceController {
  /**
   * Create a new service request
   */
  static async createServiceRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const requestData: CreateServiceRequestInput = req.body;
      const userId = req.user?.id || "system";

      // Generate unique ticket number
      const ticketNumber =
        await UnifiedServiceController.generateTicketNumber();

      // Create the main service request
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          ticketNumber,
          vehicleId: requestData.vehicleId,
          requestedBy: userId,
          serviceType: requestData.serviceType,
          priority: requestData.priority || "MEDIUM",
          status: "DRAFT",
          title: requestData.title,
          description: requestData.description,
          issueReported: requestData.issueReported,
          symptoms: requestData.symptoms
            ? JSON.stringify(requestData.symptoms)
            : null,
          requestedDate: requestData.requestedDate
            ? new Date(requestData.requestedDate)
            : null,
          serviceLocation: requestData.serviceLocation,
          estimatedDuration: requestData.estimatedDuration,
          customerApprovalRequired:
            requestData.customerApprovalRequired || false,
          tags: requestData.tags ? JSON.stringify(requestData.tags) : null,
          notes: requestData.notes,
          createdBy: userId,
          lastModifiedBy: userId,
        },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              model: {
                select: {
                  name: true,
                  oem: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      // Create parts requests if provided
      if (requestData.partsRequests && requestData.partsRequests.length > 0) {
        const partsRequests = await Promise.all(
          requestData.partsRequests.map((partRequest) =>
            prisma.servicePartsRequest.create({
              data: {
                serviceRequestId: serviceRequest.id,
                sparePartId: partRequest.sparePartId,
                partName: partRequest.partName,
                partNumber: partRequest.partNumber,
                requestedQuantity: partRequest.requestedQuantity,
                urgency: partRequest.urgency || "Normal",
                justification: partRequest.justification,
                status: "Pending",
                requestedBy: userId,
              },
            })
          )
        );
      }

      // Auto-submit if not a draft
      if (
        requestData.priority === "EMERGENCY" ||
        requestData.priority === "CRITICAL"
      ) {
        await UnifiedServiceController.submitServiceRequest(
          serviceRequest.id,
          userId
        );
      }

      res.status(201).json({
        success: true,
        message: "Service request created successfully",
        data: serviceRequest,
      });
    } catch (error) {
      console.error("Error creating service request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create service request",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get service requests with filtering and pagination
   */
  static async getServiceRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const filters: ServiceRequestFilters = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Build where clause based on filters
      const whereClause: any = {};

      if (filters.vehicleId) whereClause.vehicleId = filters.vehicleId;
      if (filters.assignedTo) whereClause.assignedTo = filters.assignedTo;
      if (filters.serviceType) whereClause.serviceType = filters.serviceType;
      if (filters.priority) whereClause.priority = filters.priority;
      if (filters.status) whereClause.status = filters.status;
      if (filters.serviceCenter)
        whereClause.serviceCenter = filters.serviceCenter;
      if (filters.createdBy) whereClause.createdBy = filters.createdBy;

      // Date range filters
      if (filters.requestedDateFrom || filters.requestedDateTo) {
        whereClause.requestedDate = {};
        if (filters.requestedDateFrom)
          whereClause.requestedDate.gte = new Date(filters.requestedDateFrom);
        if (filters.requestedDateTo)
          whereClause.requestedDate.lte = new Date(filters.requestedDateTo);
      }

      if (filters.scheduledDateFrom || filters.scheduledDateTo) {
        whereClause.scheduledDate = {};
        if (filters.scheduledDateFrom)
          whereClause.scheduledDate.gte = new Date(filters.scheduledDateFrom);
        if (filters.scheduledDateTo)
          whereClause.scheduledDate.lte = new Date(filters.scheduledDateTo);
      }

      // Search in title, description, ticket number
      if (filters.search) {
        whereClause.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { ticketNumber: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [serviceRequests, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereClause,
          include: {
            vehicle: {
              select: {
                id: true,
                registrationNumber: true,
                model: {
                  select: {
                    name: true,
                    oem: { select: { name: true } },
                  },
                },
              },
            },
            partsRequests: true,
            partsUsed: true,
            approvals: true,
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.serviceRequest.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: serviceRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching service requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch service requests",
      });
    }
  }

  /**
   * Get a single service request by ID
   */
  static async getServiceRequestById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              model: {
                select: {
                  name: true,
                  oem: { select: { name: true } },
                },
              },
              operationalStatus: true,
              mileage: true,
            },
          },
          partsRequests: true,
          partsUsed: true,
          approvals: true,
          attachments: true,
          workflowSteps: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message: "Service request not found",
        });
      }

      return res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      console.error("Error fetching service request:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch service request",
      });
    }
  }

  /**
   * Update a service request
   */
  static async updateServiceRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateServiceRequestInput = req.body;
      const userId = req.user?.id || "system";

      const serviceRequest = await prisma.serviceRequest.update({
        where: { id },
        data: {
          ...updateData,
          scheduledDate: updateData.scheduledDate
            ? new Date(updateData.scheduledDate)
            : undefined,
          tags: updateData.tags ? JSON.stringify(updateData.tags) : undefined,
          lastModifiedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              model: {
                select: {
                  name: true,
                  oem: { select: { name: true } },
                },
              },
            },
          },
          partsRequests: true,
          partsUsed: true,
        },
      });

      // If status changed to IN_PROGRESS, set actual start time
      if (updateData.status === "IN_PROGRESS") {
        await prisma.serviceRequest.update({
          where: { id },
          data: { actualStartTime: new Date() },
        });
      }

      // If status changed to COMPLETED, set actual end time and create service record
      if (updateData.status === "COMPLETED") {
        await prisma.serviceRequest.update({
          where: { id },
          data: { actualEndTime: new Date() },
        });

        // Create corresponding service record
        await UnifiedServiceController.createServiceRecordFromRequest(
          id,
          userId
        );
      }

      res.json({
        success: true,
        message: "Service request updated successfully",
        data: serviceRequest,
      });
    } catch (error) {
      console.error("Error updating service request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update service request",
      });
    }
  }

  /**
   * Submit a service request (change status from DRAFT to SUBMITTED)
   */
  static async submitServiceRequest(serviceRequestId: string, userId: string) {
    try {
      const serviceRequest = await prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          status: "SUBMITTED",
          lastModifiedBy: userId,
          updatedAt: new Date(),
        },
      });

      // Create approval workflow if required
      await UnifiedServiceController.createApprovalWorkflow(serviceRequestId);

      return serviceRequest;
    } catch (error) {
      console.error("Error submitting service request:", error);
      throw error;
    }
  }

  /**
   * Approve or reject a service request
   */
  static async processApproval(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { action, comments } = req.body; // action: 'approve' | 'reject'
      const userId = req.user?.id || "system";

      const approval = await prisma.serviceApproval.update({
        where: {
          serviceRequestId_approverRole: {
            serviceRequestId: id,
            approverRole: req.user?.role || "Manager",
          },
        },
        data: {
          status: action === "approve" ? "Approved" : "Rejected",
          approvedBy: userId,
          approvedAt: new Date(),
          comments,
        },
      });

      // Update service request status based on approval
      if (action === "approve") {
        await prisma.serviceRequest.update({
          where: { id },
          data: { status: "APPROVED" },
        });
      } else {
        await prisma.serviceRequest.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
      }

      res.json({
        success: true,
        message: `Service request ${action}d successfully`,
        data: approval,
      });
    } catch (error) {
      console.error("Error processing approval:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process approval",
      });
    }
  }

  /**
   * Add parts request to a service request
   */
  static async addPartsRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const partsData = req.body;
      const userId = req.user?.id || "system";

      const partsRequest = await prisma.servicePartsRequest.create({
        data: {
          serviceRequestId: id,
          ...partsData,
          requestedBy: userId,
          status: "Pending",
        },
      });

      res.status(201).json({
        success: true,
        message: "Parts request added successfully",
        data: partsRequest,
      });
    } catch (error) {
      console.error("Error adding parts request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add parts request",
      });
    }
  }

  /**
   * Record parts usage during service
   */
  static async recordPartsUsage(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const usageData = req.body;
      const userId = req.user?.id || "system";

      const partsUsed = await prisma.servicePartsUsed.create({
        data: {
          serviceRequestId: id,
          ...usageData,
          installedBy: userId,
          installedAt: new Date(),
        },
      });

      // Update parts request status to 'Issued' if it exists
      if (usageData.partsRequestId) {
        await prisma.servicePartsRequest.update({
          where: { id: usageData.partsRequestId },
          data: {
            status: "Issued",
            issuedQuantity: usageData.quantity,
            issuedAt: new Date(),
            issuedBy: userId,
          },
        });
      }

      res.status(201).json({
        success: true,
        message: "Parts usage recorded successfully",
        data: partsUsed,
      });
    } catch (error) {
      console.error("Error recording parts usage:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record parts usage",
      });
    }
  }

  /**
   * Get service request analytics
   */
  static async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const whereClause: any = {};
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const [
        totalRequests,
        requestsByStatus,
        requestsByPriority,
        requestsByType,
        avgCompletionTime,
        totalCost,
      ] = await Promise.all([
        prisma.serviceRequest.count({ where: whereClause }),
        prisma.serviceRequest.groupBy({
          by: ["status"],
          where: whereClause,
          _count: { status: true },
        }),
        prisma.serviceRequest.groupBy({
          by: ["priority"],
          where: whereClause,
          _count: { priority: true },
        }),
        prisma.serviceRequest.groupBy({
          by: ["serviceType"],
          where: whereClause,
          _count: { serviceType: true },
        }),
        prisma.serviceRequest.aggregate({
          where: {
            ...whereClause,
            status: "COMPLETED",
            actualStartTime: { not: null },
            actualEndTime: { not: null },
          },
          _avg: {
            // This would need a computed field for duration
          },
        }),
        prisma.serviceRequest.aggregate({
          where: whereClause,
          _sum: { actualTotalCost: true },
        }),
      ]);

      const analytics = {
        totalRequests,
        requestsByStatus: Object.fromEntries(
          requestsByStatus.map((item) => [item.status, item._count.status])
        ),
        requestsByPriority: Object.fromEntries(
          requestsByPriority.map((item) => [
            item.priority,
            item._count.priority,
          ])
        ),
        requestsByType: Object.fromEntries(
          requestsByType.map((item) => [
            item.serviceType,
            item._count.serviceType,
          ])
        ),
        totalCost: totalCost._sum.actualTotalCost || 0,
        averageCost:
          totalRequests > 0
            ? (totalCost._sum.actualTotalCost || 0) / totalRequests
            : 0,
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
      });
    }
  }

  // Helper methods

  private static async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const prefix = `SR-${year}${month}${day}`;

    const lastTicket = await prisma.serviceRequest.findFirst({
      where: {
        ticketNumber: { startsWith: prefix },
      },
      orderBy: { ticketNumber: "desc" },
    });

    let sequence = 1;
    if (lastTicket) {
      const lastSequence = parseInt(
        lastTicket.ticketNumber.split("-").pop() || "0"
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, "0")}`;
  }

  private static async createApprovalWorkflow(serviceRequestId: string) {
    // Create approval requirements based on service request details
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!serviceRequest) return;

    const approvals: Array<{
      serviceRequestId: string;
      approvalType: ApprovalType;
      requiredFor: string;
      status: ApprovalStatus;
      approverRole: string;
    }> = [];

    // High priority or high cost requests need manager approval
    if (
      serviceRequest.priority === "HIGH" ||
      serviceRequest.priority === "CRITICAL" ||
      (serviceRequest.estimatedTotalCost &&
        serviceRequest.estimatedTotalCost > 10000)
    ) {
      approvals.push({
        serviceRequestId,
        approvalType: ApprovalType.Manager,
        requiredFor: "High priority or high cost service approval",
        status: ApprovalStatus.Pending,
        approverRole: "Manager",
      });
    }

    // Customer approval required
    if (serviceRequest.customerApprovalRequired) {
      approvals.push({
        serviceRequestId,
        approvalType: ApprovalType.Customer,
        requiredFor: "Customer approval for service work",
        status: ApprovalStatus.Pending,
        approverRole: "Customer",
      });
    }

    if (approvals.length > 0) {
      await prisma.serviceApproval.createMany({
        data: approvals,
      });
    }
  }

  private static async createServiceRecordFromRequest(
    serviceRequestId: string,
    userId: string
  ) {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        partsUsed: true,
      },
    });

    if (!serviceRequest) return;

    // Calculate total parts cost
    const partsCost = serviceRequest.partsUsed.reduce(
      (sum, part) => sum + part.totalCost,
      0
    );

    // Create service record
    const serviceRecord = await prisma.serviceRecord.create({
      data: {
        vehicleId: serviceRequest.vehicleId,
        serviceType: serviceRequest.serviceType,
        serviceDate: serviceRequest.actualEndTime || new Date(),
        description: serviceRequest.description,
        issueReported: serviceRequest.issueReported,
        workPerformed: serviceRequest.workPerformed || "",
        mechanicName: serviceRequest.assignedTo || "",
        serviceCenter: serviceRequest.serviceCenter || "",
        laborCost: serviceRequest.actualLaborCost || 0,
        partsCost,
        totalCost:
          serviceRequest.actualTotalCost ||
          (serviceRequest.actualLaborCost || 0) + partsCost,
        partsReplaced: JSON.stringify(serviceRequest.partsUsed),
        serviceNotes: serviceRequest.completionNotes,
        serviceStatus: "Completed",
      },
    });

    // Link service request to service record
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { serviceRecordId: serviceRecord.id },
    });

    return serviceRecord;
  }
}
