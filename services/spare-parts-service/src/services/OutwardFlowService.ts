import { PrismaClient } from "@prisma/client";
import {
  SparePartRequestInput,
  PartRequestFilters,
  PartInstallationInput,
  PartReturnInput,
  ServiceCostBreakdown,
  StockAvailability,
} from "../types/outward";
import { ApiResponse, PaginationParams, PaginationInfo } from "../types";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginationInfo,
  getPrismaSkipTake,
} from "../utils";

export class OutwardFlowService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create spare part request from technician
   */
  async createPartRequest(
    requestData: SparePartRequestInput
  ): Promise<ApiResponse<any>> {
    try {
      // Validate service request exists
      const serviceRequest = await this.prisma.serviceRequest.findUnique({
        where: { id: requestData.serviceRequestId },
      });

      if (!serviceRequest) {
        return createErrorResponse("Service request not found");
      }

      // Check stock availability
      const availability = await this.checkStockAvailability(
        requestData.sparePartId,
        requestData.requestedQuantity,
        serviceRequest.storeId
      );

      // Get spare part details for cost estimation
      const sparePart = await this.prisma.sparePart.findUnique({
        where: { id: requestData.sparePartId },
        include: { category: true },
      });

      if (!sparePart) {
        return createErrorResponse("Spare part not found");
      }

      // Calculate estimated cost
      const estimatedCost =
        sparePart.sellingPrice * requestData.requestedQuantity;

      // Check technician limits
      const canAutoApprove = await this.checkTechnicianLimits(
        requestData.technicianId,
        requestData.sparePartId,
        sparePart.categoryId,
        requestData.requestedQuantity,
        estimatedCost
      );

      // Create the request
      const partRequest = await this.prisma.sparePartRequest.create({
        data: {
          serviceRequestId: requestData.serviceRequestId,
          sparePartId: requestData.sparePartId,
          storeId: serviceRequest.storeId,
          requestedBy: requestData.technicianId,
          requestedQuantity: requestData.requestedQuantity,
          urgency: requestData.urgency,
          justification: requestData.justification,
          estimatedCost,
          status:
            availability.available && canAutoApprove ? "Approved" : "Pending",
          approvalLevel: canAutoApprove
            ? 1
            : this.getRequiredApprovalLevel(estimatedCost),
        },
        include: {
          sparePart: {
            include: { category: true },
          },
          serviceRequest: true,
        },
      });

      // Create approval history entry
      await this.prisma.approvalHistory.create({
        data: {
          requestId: partRequest.id,
          level: 1,
          approverId: canAutoApprove ? "system" : "pending",
          decision: canAutoApprove ? "Approved" : "Pending",
          comments: canAutoApprove
            ? "Auto-approved within limits"
            : "Awaiting approval",
          requestValue: estimatedCost,
          availableStock: availability.availableQuantity,
        },
      });

      // Reserve stock if approved and available
      if (partRequest.status === "Approved" && availability.available) {
        await this.reserveStock(
          partRequest.id,
          requestData.sparePartId,
          serviceRequest.storeId,
          requestData.requestedQuantity,
          requestData.technicianId
        );

        // Auto-issue if policy allows
        if (await this.shouldAutoIssue(sparePart.categoryId)) {
          await this.issuePartsToTechnician(partRequest.id);
        }
      }

      // Update service request status if waiting for parts
      if (!availability.available) {
        await this.prisma.serviceRequest.update({
          where: { id: requestData.serviceRequestId },
          data: { status: "Waiting Parts" },
        });
      }

      return createSuccessResponse(
        partRequest,
        "Part request created successfully"
      );
    } catch (error) {
      console.error("Error creating part request:", error);
      return createErrorResponse("Failed to create part request");
    }
  }

  /**
   * Approve spare part request
   */
  async approvePartRequest(
    requestId: string,
    approverId: string,
    comments?: string,
    conditions?: string
  ): Promise<ApiResponse<any>> {
    try {
      const request = await this.prisma.sparePartRequest.findUnique({
        where: { id: requestId },
        include: {
          sparePart: true,
          serviceRequest: true,
        },
      });

      if (!request) {
        return createErrorResponse("Request not found");
      }

      if (request.status !== "Pending") {
        return createErrorResponse("Request is not in pending status");
      }

      // Check stock availability again
      const availability = await this.checkStockAvailability(
        request.sparePartId,
        request.requestedQuantity,
        request.storeId
      );

      if (!availability.available) {
        return createErrorResponse(
          `Insufficient stock. Available: ${availability.availableQuantity}, Requested: ${request.requestedQuantity}`
        );
      }

      // Update request status
      await this.prisma.sparePartRequest.update({
        where: { id: requestId },
        data: {
          status: "Approved",
          approvedBy: approverId,
          approvedAt: new Date(),
        },
      });

      // Update approval history
      await this.prisma.approvalHistory.create({
        data: {
          requestId,
          level: request.approvalLevel,
          approverId,
          decision: "Approved",
          comments: comments || "Approved",
          conditions,
          processedAt: new Date(),
          requestValue: request.estimatedCost,
          availableStock: availability.availableQuantity,
        },
      });

      // Reserve stock
      await this.reserveStock(
        requestId,
        request.sparePartId,
        request.storeId,
        request.requestedQuantity,
        request.requestedBy
      );

      // Auto-issue if policy allows
      if (await this.shouldAutoIssue(request.sparePart.categoryId)) {
        await this.issuePartsToTechnician(requestId);
      }

      // Update service request status
      await this.prisma.serviceRequest.update({
        where: { id: request.serviceRequestId },
        data: { status: "In Progress" },
      });

      return createSuccessResponse(null, "Request approved successfully");
    } catch (error) {
      console.error("Error approving request:", error);
      return createErrorResponse("Failed to approve request");
    }
  }

  /**
   * Issue spare parts to technician
   */
  async issuePartsToTechnician(requestId: string): Promise<ApiResponse<any>> {
    try {
      const request = await this.prisma.sparePartRequest.findUnique({
        where: { id: requestId },
        include: {
          sparePart: true,
          serviceRequest: true,
          stockReservations: {
            where: { status: "Active" },
          },
        },
      });

      if (!request) {
        return createErrorResponse("Request not found");
      }

      if (request.status !== "Approved") {
        return createErrorResponse("Request must be approved before issuance");
      }

      return await this.prisma.$transaction(async (tx) => {
        // Get stock using FIFO method
        const stockBatches = await this.getStockBatchesFIFO(
          request.sparePartId,
          request.requestedQuantity,
          request.storeId
        );

        if (stockBatches.totalAvailable < request.requestedQuantity) {
          throw new Error("Insufficient stock for issuance");
        }

        let issuedQuantity = 0;
        const batchNumbers: string[] = [];
        let totalCost = 0;

        // Process each batch
        for (const batch of stockBatches.batches) {
          const issueQty = Math.min(
            batch.availableQuantity,
            request.requestedQuantity - issuedQuantity
          );

          // Update inventory level
          await tx.inventoryLevel.update({
            where: { id: batch.inventoryLevelId },
            data: {
              currentStock: { decrement: issueQty },
              availableStock: { decrement: issueQty },
              lastMovementDate: new Date(),
            },
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              stockLevelId: batch.inventoryLevelId,
              sparePartId: request.sparePartId,
              storeId: request.storeId,
              movementType: "OUT",
              quantity: issueQty,
              previousStock: batch.currentStock,
              newStock: batch.currentStock - issueQty,
              unitCost: batch.unitCost,
              totalValue: issueQty * batch.unitCost,
              referenceType: "SERVICE",
              referenceId: request.serviceRequestId,
              reason: "Issued to technician",
              notes: `Issued for service request ${request.serviceRequest.ticketNumber}`,
              createdBy: "system",
            },
          });

          if (batch.batchNumber) {
            batchNumbers.push(batch.batchNumber);
          }

          totalCost += issueQty * batch.unitCost;
          issuedQuantity += issueQty;

          if (issuedQuantity >= request.requestedQuantity) break;
        }

        // Update request with issuance details
        await tx.sparePartRequest.update({
          where: { id: requestId },
          data: {
            status: "Issued",
            issuedQuantity,
            issuedAt: new Date(),
            issuedBy: "system",
            issuedCost: totalCost,
            batchNumbers: JSON.stringify(batchNumbers),
          },
        });

        // Consume stock reservations
        await tx.stockReservation.updateMany({
          where: {
            requestId: requestId,
            status: "Active",
          },
          data: {
            status: "Consumed",
          },
        });

        return createSuccessResponse(
          { issuedQuantity, totalCost, batchNumbers },
          "Parts issued successfully"
        );
      });
    } catch (error) {
      console.error("Error issuing parts:", error);
      return createErrorResponse("Failed to issue parts");
    }
  }

  /**
   * Install spare parts and track usage
   */
  async installSparePart(
    installationData: PartInstallationInput
  ): Promise<ApiResponse<any>> {
    try {
      // Verify part was issued for this service request
      const request = await this.prisma.sparePartRequest.findFirst({
        where: {
          serviceRequestId: installationData.serviceRequestId,
          sparePartId: installationData.sparePartId,
          status: "Issued",
        },
        include: {
          sparePart: true,
        },
      });

      if (!request) {
        return createErrorResponse("Part not issued for this service request");
      }

      if (installationData.quantity > (request.issuedQuantity || 0)) {
        return createErrorResponse(
          "Installation quantity exceeds issued quantity"
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        // Calculate warranty expiry
        const warrantyExpiry = this.calculateWarrantyExpiry(
          request.sparePart,
          installationData.quantity
        );

        // Create installation record
        const installation = await tx.installedPart.create({
          data: {
            serviceRequestId: installationData.serviceRequestId,
            sparePartId: installationData.sparePartId,
            technicianId: installationData.technicianId,
            storeId: request.storeId,
            batchNumber: installationData.batchNumber,
            serialNumber: installationData.serialNumber,
            quantity: installationData.quantity,
            unitCost: installationData.unitCost,
            totalCost: installationData.quantity * installationData.unitCost,
            sellingPrice: request.sparePart.sellingPrice,
            totalRevenue:
              installationData.quantity * request.sparePart.sellingPrice,
            installationNotes: installationData.installationNotes,
            replacedPartId: installationData.replacedPartId,
            warrantyMonths: request.sparePart.warranty,
            warrantyExpiry: warrantyExpiry,
            warrantyTerms: "Standard OEM warranty",
            warrantyProvider: "OEM",
          },
          include: {
            sparePart: {
              include: { category: true },
            },
          },
        });

        // Update part request status
        await tx.sparePartRequest.update({
          where: { id: request.id },
          data: { status: "Installed" },
        });

        // Update service request cost
        await this.updateServiceRequestCost(installationData.serviceRequestId);

        // Handle replaced part if any
        if (installationData.replacedPartId) {
          await tx.installedPart.update({
            where: { id: installationData.replacedPartId },
            data: {
              removalDate: new Date(),
              removalReason: "Replaced with new part",
              removedBy: installationData.technicianId,
            },
          });
        }

        return createSuccessResponse(
          installation,
          "Part installed successfully"
        );
      });
    } catch (error) {
      console.error("Error installing part:", error);
      return createErrorResponse("Failed to install part");
    }
  }

  /**
   * Return unused parts to inventory
   */
  async returnUnusedParts(
    serviceRequestId: string,
    returns: PartReturnInput[]
  ): Promise<ApiResponse<any>> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const returnResults = [];

        for (const returnItem of returns) {
          // Verify part was issued for this service
          const request = await tx.sparePartRequest.findFirst({
            where: {
              serviceRequestId,
              sparePartId: returnItem.sparePartId,
              status: { in: ["Issued", "Installed"] },
            },
            include: { sparePart: true },
          });

          if (!request) {
            continue; // Skip if not found
          }

          // Find inventory level for this store and part
          const inventoryLevel = await tx.inventoryLevel.findFirst({
            where: {
              sparePartId: returnItem.sparePartId,
              storeId: request.storeId,
            },
          });

          if (!inventoryLevel) {
            continue; // Skip if inventory level not found
          }

          // Return to stock based on condition
          if (returnItem.condition === "Good") {
            // Return to available stock
            await tx.inventoryLevel.update({
              where: { id: inventoryLevel.id },
              data: {
                currentStock: { increment: returnItem.quantity },
                availableStock: { increment: returnItem.quantity },
                lastMovementDate: new Date(),
              },
            });

            // Record stock movement
            await tx.stockMovement.create({
              data: {
                stockLevelId: inventoryLevel.id,
                sparePartId: returnItem.sparePartId,
                storeId: request.storeId,
                movementType: "RETURN",
                quantity: returnItem.quantity,
                previousStock: inventoryLevel.currentStock,
                newStock: inventoryLevel.currentStock + returnItem.quantity,
                unitCost: returnItem.unitCost,
                totalValue: returnItem.quantity * returnItem.unitCost,
                referenceType: "SERVICE",
                referenceId: serviceRequestId,
                reason: returnItem.returnReason,
                notes: `Returned by technician: ${returnItem.condition}`,
                createdBy: returnItem.technicianId,
              },
            });
          } else {
            // Add to damaged stock
            await tx.inventoryLevel.update({
              where: { id: inventoryLevel.id },
              data: {
                currentStock: { increment: returnItem.quantity },
                damagedStock: { increment: returnItem.quantity },
                lastMovementDate: new Date(),
              },
            });

            // Record stock movement
            await tx.stockMovement.create({
              data: {
                stockLevelId: inventoryLevel.id,
                sparePartId: returnItem.sparePartId,
                storeId: request.storeId,
                movementType: "DAMAGED",
                quantity: returnItem.quantity,
                previousStock: inventoryLevel.currentStock,
                newStock: inventoryLevel.currentStock + returnItem.quantity,
                unitCost: returnItem.unitCost,
                totalValue: returnItem.quantity * returnItem.unitCost,
                referenceType: "SERVICE",
                referenceId: serviceRequestId,
                reason: returnItem.returnReason,
                notes: `Returned damaged by technician: ${returnItem.condition}`,
                createdBy: returnItem.technicianId,
              },
            });
          }

          // Update request with return details
          await tx.sparePartRequest.update({
            where: { id: request.id },
            data: {
              returnedQuantity: returnItem.quantity,
              returnedBy: returnItem.technicianId,
              returnedAt: new Date(),
              returnReason: returnItem.returnReason,
              returnCondition: returnItem.condition,
              status:
                returnItem.quantity === request.issuedQuantity
                  ? "Returned"
                  : "Installed",
            },
          });

          returnResults.push({
            sparePartId: returnItem.sparePartId,
            quantity: returnItem.quantity,
            condition: returnItem.condition,
            status: "Processed",
          });
        }

        return createSuccessResponse(
          returnResults,
          "Parts returned successfully"
        );
      });
    } catch (error) {
      console.error("Error returning parts:", error);
      return createErrorResponse("Failed to return parts");
    }
  }

  /**
   * Calculate service cost breakdown
   */
  async calculateServiceCost(
    serviceRequestId: string
  ): Promise<ApiResponse<ServiceCostBreakdown>> {
    try {
      // Get all installed parts for this service
      const installedParts = await this.prisma.installedPart.findMany({
        where: { serviceRequestId },
        include: {
          sparePart: {
            include: { category: true },
          },
        },
      });

      // Calculate parts cost
      const partsCost = installedParts.reduce(
        (total, part) => total + part.totalCost,
        0
      );
      const partsRevenue = installedParts.reduce(
        (total, part) => total + (part.totalRevenue || 0),
        0
      );
      const partsMarkup = partsRevenue - partsCost;

      // Get labor cost (this would come from service system)
      const laborCost = await this.calculateLaborCost(serviceRequestId);
      const laborMarkup = laborCost * 0.2; // 20% markup example
      const laborTotal = laborCost + laborMarkup;

      // Calculate overhead and other costs
      const overheadCost = (partsCost + laborCost) * 0.1; // 10% overhead

      // Calculate totals
      const subtotal = partsRevenue + laborTotal + overheadCost;
      const taxPercent = 18; // GST in India
      const taxAmount = subtotal * (taxPercent / 100);
      const totalCost = subtotal + taxAmount;
      const netMargin = totalCost - (partsCost + laborCost + overheadCost);
      const marginPercent = totalCost > 0 ? (netMargin / totalCost) * 100 : 0;

      // Create or update cost breakdown
      const costBreakdown = await this.prisma.serviceCostBreakdown.upsert({
        where: { serviceRequestId },
        create: {
          serviceRequestId,
          partsCost,
          partsMarkup,
          partsTotal: partsRevenue,
          laborCost,
          laborMarkup,
          laborTotal,
          overheadCost,
          subtotal,
          taxPercent,
          taxAmount,
          totalCost,
          totalRevenue: totalCost,
          netMargin,
          marginPercent,
          calculatedBy: "system",
          breakdown: JSON.stringify({
            parts: installedParts.map((part) => ({
              partName: part.sparePart.name,
              quantity: part.quantity,
              unitCost: part.unitCost,
              totalCost: part.totalCost,
              sellingPrice: part.sellingPrice,
              totalRevenue: part.totalRevenue,
            })),
            labor: {
              baseCost: laborCost,
              markup: laborMarkup,
              total: laborTotal,
            },
            overhead: {
              amount: overheadCost,
            },
          }),
        },
        update: {
          partsCost,
          partsMarkup,
          partsTotal: partsRevenue,
          laborCost,
          laborMarkup,
          laborTotal,
          overheadCost,
          subtotal,
          taxPercent,
          taxAmount,
          totalCost,
          totalRevenue: totalCost,
          netMargin,
          marginPercent,
          calculatedBy: "system",
          calculatedAt: new Date(),
        },
      });

      // Update service request with total cost
      await this.prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          actualCost: totalCost,
          partsCost,
          laborCost: laborTotal,
        },
      });

      const breakdown: ServiceCostBreakdown = {
        partsCost,
        laborCost: laborTotal,
        overheadCost,
        taxAmount,
        discountAmount: 0,
        totalCost,
        margin: netMargin,
        marginPercent,
      };

      return createSuccessResponse(
        breakdown,
        "Service cost calculated successfully"
      );
    } catch (error) {
      console.error("Error calculating service cost:", error);
      return createErrorResponse("Failed to calculate service cost");
    }
  }

  // Helper methods

  private async checkStockAvailability(
    sparePartId: string,
    requestedQuantity: number,
    storeId: string
  ): Promise<StockAvailability> {
    const inventoryLevel = await this.prisma.inventoryLevel.findFirst({
      where: {
        sparePartId,
        storeId,
        isActive: true,
      },
    });

    if (!inventoryLevel) {
      return {
        sparePartId,
        storeId,
        availableQuantity: 0,
        reservedQuantity: 0,
        totalStock: 0,
        available: false,
      };
    }

    return {
      sparePartId,
      storeId,
      availableQuantity: inventoryLevel.availableStock,
      reservedQuantity: inventoryLevel.reservedStock,
      totalStock: inventoryLevel.currentStock,
      available: inventoryLevel.availableStock >= requestedQuantity,
    };
  }

  private async checkTechnicianLimits(
    technicianId: string,
    sparePartId: string,
    categoryId: string,
    quantity: number,
    estimatedCost: number
  ): Promise<boolean> {
    // Check specific part limit
    const partLimit = await this.prisma.technicianLimit.findFirst({
      where: {
        technicianId,
        sparePartId,
        isActive: true,
      },
    });

    if (partLimit) {
      if (
        partLimit.maxValuePerRequest &&
        estimatedCost > partLimit.maxValuePerRequest
      ) {
        return false;
      }
      if (
        partLimit.maxQuantityPerRequest &&
        quantity > partLimit.maxQuantityPerRequest
      ) {
        return false;
      }
      return (!partLimit.requiresApproval ||
        (partLimit.autoApproveBelow !== null &&
          estimatedCost <= partLimit.autoApproveBelow)) as boolean;
    }

    // Check category limit
    const categoryLimit = await this.prisma.technicianLimit.findFirst({
      where: {
        technicianId,
        categoryId,
        isActive: true,
      },
    });

    if (categoryLimit) {
      if (
        categoryLimit.maxValuePerRequest &&
        estimatedCost > categoryLimit.maxValuePerRequest
      ) {
        return false;
      }
      if (
        categoryLimit.maxQuantityPerRequest &&
        quantity > categoryLimit.maxQuantityPerRequest
      ) {
        return false;
      }
      return (!categoryLimit.requiresApproval ||
        (categoryLimit.autoApproveBelow !== null &&
          estimatedCost <= categoryLimit.autoApproveBelow)) as boolean;
    }

    // Default approval policy
    return estimatedCost <= 500; // Auto-approve below ₹500
  }

  private getRequiredApprovalLevel(estimatedCost: number): number {
    if (estimatedCost <= 1000) return 1; // Supervisor
    if (estimatedCost <= 5000) return 2; // Manager
    return 3; // Admin
  }

  private async shouldAutoIssue(categoryId: string): Promise<boolean> {
    // Check if category allows auto-issuance
    // This could be configurable per category
    return true; // For now, auto-issue all approved requests
  }

  private async reserveStock(
    requestId: string,
    sparePartId: string,
    storeId: string,
    quantity: number,
    technicianId: string
  ): Promise<void> {
    const inventoryLevel = await this.prisma.inventoryLevel.findFirst({
      where: { sparePartId, storeId },
    });

    if (!inventoryLevel) {
      throw new Error("Inventory level not found");
    }

    // Create reservation
    await this.prisma.stockReservation.create({
      data: {
        requestId,
        sparePartId,
        storeId,
        inventoryLevelId: inventoryLevel.id,
        reservedQuantity: quantity,
        reservedBy: "system",
        reservedFor: technicianId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Update inventory level
    await this.prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        reservedStock: { increment: quantity },
        availableStock: { decrement: quantity },
      },
    });
  }

  private async getStockBatchesFIFO(
    sparePartId: string,
    requiredQuantity: number,
    storeId: string
  ): Promise<{ batches: any[]; totalAvailable: number }> {
    // Get available stock batches ordered by creation date (FIFO)
    const inventoryLevels = await this.prisma.inventoryLevel.findMany({
      where: {
        sparePartId,
        storeId,
        availableStock: { gt: 0 },
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const batches = inventoryLevels.map((level) => ({
      inventoryLevelId: level.id,
      availableQuantity: level.availableStock,
      currentStock: level.currentStock,
      unitCost: 0, // You might want to track this per batch
      batchNumber: null, // You might want to implement batch tracking
    }));

    const totalAvailable = batches.reduce(
      (sum, batch) => sum + batch.availableQuantity,
      0
    );

    return { batches, totalAvailable };
  }

  private calculateWarrantyExpiry(
    sparePart: any,
    quantity: number
  ): Date | null {
    if (!sparePart.warranty) return null;

    const warrantyMonths = sparePart.warranty;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
    return expiryDate;
  }

  private async calculateLaborCost(serviceRequestId: string): Promise<number> {
    // This would integrate with the main service system to get labor hours and rates
    // For now, return a placeholder value
    return 500; // ₹500 default labor cost
  }

  private async updateServiceRequestCost(
    serviceRequestId: string
  ): Promise<void> {
    const costResult = await this.calculateServiceCost(serviceRequestId);
    // The calculateServiceCost method already updates the service request
  }
}
