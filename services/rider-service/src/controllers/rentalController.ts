import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../config/database";
import { getVehicleServiceClient } from "../services/VehicleServiceClient";
import RentalPricingService from "../services/RentalPricingService";
import PaymentScheduleService from "../services/PaymentScheduleService";
import PaymentDeductionService from "../services/PaymentDeductionService";
import NotificationService from "../services/NotificationService";

/**
 * Rider EV Rental Management Controller
 * Handles all rental operations including vehicle preference, rental creation, payments
 * Uses VehicleServiceClient for all cross-service communication
 * Integrated with Phase 4 business logic services for automation
 */

// Get singleton instance of Vehicle Service Client
const vehicleServiceClient = getVehicleServiceClient();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate 12-month payment schedule
 */
function generatePaymentSchedule(
  rentalId: string,
  riderId: string,
  monthlyAmount: number,
  startDate: Date
): any[] {
  const schedule = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < 12; i++) {
    const dueDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i + 1,
      1
    ); // 1st of each month

    schedule.push({
      riderId,
      rentalId,
      amount: monthlyAmount,
      dueDate,
      status: "PENDING",
      paymentMethod: "EARNINGS_DEDUCTION",
      deductedFromEarnings: false,
      isLate: false,
      isWaived: false,
    });
  }

  return schedule;
}

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

export const updateVehiclePreferenceValidation = [
  body("needsEvRental")
    .isBoolean()
    .withMessage("needsEvRental must be a boolean"),
  body("vehiclePreference")
    .optional()
    .isIn(["NEED_EV_RENTAL", "OWN_VEHICLE", "RENTED_VEHICLE", "CYCLE", "WALK"])
    .withMessage("Invalid vehicle preference"),
  body("preferredVehicleModelId")
    .optional()
    .isString()
    .withMessage("preferredVehicleModelId must be a string"),
];

export const createRentalValidation = [
  body("vehicleModelId").notEmpty().withMessage("Vehicle model ID is required"),
  body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
  body("monthlyRentalCost")
    .isFloat({ min: 0 })
    .withMessage("Monthly rental cost must be a positive number"),
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("securityDeposit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Security deposit must be a positive number"),
  body("notes").optional().isString(),
];

export const updateRentalValidation = [
  body("status")
    .optional()
    .isIn([
      "NOT_APPLICABLE",
      "PENDING",
      "APPROVED",
      "ACTIVE",
      "TERMINATED",
      "SUSPENDED",
    ])
    .withMessage("Invalid status"),
  body("terminationReason").optional().isString(),
  body("adminNotes").optional().isString(),
];

export const updatePaymentValidation = [
  body("status")
    .optional()
    .isIn(["PENDING", "PAID", "OVERDUE", "WAIVED", "FAILED"])
    .withMessage("Invalid payment status"),
  body("paidDate").optional().isISO8601(),
  body("paymentMethod").optional().isString(),
  body("transactionId").optional().isString(),
  body("isWaived").optional().isBoolean(),
  body("waiverReason").optional().isString(),
  body("adminNotes").optional().isString(),
];

// ==========================================
// CONTROLLER FUNCTIONS
// ==========================================

/**
 * Update rider's vehicle preference
 * PATCH /api/riders/:id/vehicle-preference
 */
export const updateVehiclePreference = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { id: riderId } = req.params;
    const { needsEvRental, vehiclePreference, preferredVehicleModelId } =
      req.body;

    // Check if rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      res.status(404).json({
        success: false,
        message: "Rider not found",
      });
      return;
    }

    // If needsEvRental is true and preferredVehicleModelId is provided, validate it exists in vehicle service
    if (needsEvRental && preferredVehicleModelId) {
      const vehicleModel = await vehicleServiceClient.getVehicleModel(
        preferredVehicleModelId
      );
      if (!vehicleModel) {
        res.status(400).json({
          success: false,
          message:
            "Invalid vehicle model ID - model not found in vehicle service",
        });
        return;
      }

      // Check if model is available for rent
      if (!vehicleModel.isAvailableForRent) {
        res.status(400).json({
          success: false,
          message: "Selected vehicle model is not available for rent",
        });
        return;
      }
    }

    // Update rider preferences
    const updateData: any = {
      needsEvRental,
      updatedAt: new Date(),
    };

    if (needsEvRental) {
      // If needs EV rental, set preference to null and update rental status
      updateData.vehiclePreference = null;
      updateData.preferredVehicleModelId = preferredVehicleModelId || null;
      updateData.rentalStatus =
        updateData.rentalStatus === "NOT_APPLICABLE"
          ? "PENDING"
          : updateData.rentalStatus;
    } else {
      // If doesn't need EV rental, set vehicle preference
      updateData.vehiclePreference = vehiclePreference || null;
      updateData.preferredVehicleModelId = null;
      updateData.rentalStatus = "NOT_APPLICABLE";
    }

    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Vehicle preference updated successfully",
      data: {
        riderId: updatedRider.id,
        needsEvRental: updatedRider.needsEvRental,
        vehiclePreference: updatedRider.vehiclePreference,
        preferredVehicleModelId: updatedRider.preferredVehicleModelId,
        rentalStatus: updatedRider.rentalStatus,
      },
    });
  } catch (error: any) {
    console.error("Error updating vehicle preference:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle preference",
      error: error.message,
    });
  }
};

/**
 * Get current active rental for rider
 * GET /api/riders/:id/rental
 */
export const getCurrentRental = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: riderId } = req.params;

    // Check if rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: {
        id: true,
        name: true,
        needsEvRental: true,
        rentalStatus: true,
        monthlyRentalAmount: true,
        rentalStartDate: true,
        currentVehicleId: true,
      },
    });

    if (!rider) {
      res.status(404).json({
        success: false,
        message: "Rider not found",
      });
      return;
    }

    // Find active rental
    const activeRental = await prisma.riderVehicleRental.findFirst({
      where: {
        riderId,
        status: "ACTIVE",
      },
      include: {
        payments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    if (!activeRental) {
      res.status(200).json({
        success: true,
        message: "No active rental found",
        data: null,
      });
      return;
    }

    // Fetch vehicle model details from vehicle service
    let vehicleModelDetails = null;
    if (activeRental.vehicleModelId) {
      vehicleModelDetails = await vehicleServiceClient.getVehicleModel(
        activeRental.vehicleModelId
      );
    }

    res.status(200).json({
      success: true,
      data: {
        rental: activeRental,
        vehicleModel: vehicleModelDetails,
        riderInfo: rider,
      },
    });
  } catch (error: any) {
    console.error("Error fetching current rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current rental",
      error: error.message,
    });
  }
};

/**
 * Create new rental (assign vehicle to rider)
 * POST /api/riders/:id/rental
 */
export const createRental = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { id: riderId } = req.params;
    const {
      vehicleModelId,
      vehicleId,
      monthlyRentalCost,
      startDate,
      securityDeposit,
      notes,
      adminNotes,
    } = req.body;

    // Check if rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      res.status(404).json({
        success: false,
        message: "Rider not found",
      });
      return;
    }

    // Check if rider already has active rental
    const existingRental = await prisma.riderVehicleRental.findFirst({
      where: {
        riderId,
        status: "ACTIVE",
      },
    });

    if (existingRental) {
      res.status(400).json({
        success: false,
        message: "Rider already has an active rental",
      });
      return;
    }

    // Validate vehicle model exists in vehicle service
    const vehicleModel = await vehicleServiceClient.getVehicleModel(
      vehicleModelId
    );
    if (!vehicleModel) {
      res.status(400).json({
        success: false,
        message: "Invalid vehicle model ID",
      });
      return;
    }

    if (!vehicleModel.isAvailableForRent) {
      res.status(400).json({
        success: false,
        message: "Vehicle model is not available for rent",
      });
      return;
    }

    // Create rental record
    const rental = await prisma.riderVehicleRental.create({
      data: {
        riderId,
        vehicleId,
        vehicleModelId,
        monthlyRentalCost,
        startDate: new Date(startDate),
        status: "ACTIVE",
        securityDeposit: securityDeposit || 0,
        securityDepositPaid: false,
        notes,
        adminNotes,
      },
    });

    // Generate 12-month payment schedule using PaymentScheduleService
    const createdPayments =
      await PaymentScheduleService.createPaymentScheduleInDB({
        rentalId: rental.id,
        riderId,
        monthlyRentalCost,
        startDate: new Date(startDate),
        numberOfMonths: 12,
      });

    console.log(
      `✅ Created ${createdPayments.length} payment records for rental ${rental.id}`
    );

    // Update rider record
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        rentalStatus: "ACTIVE",
        monthlyRentalAmount: monthlyRentalCost,
        rentalStartDate: new Date(startDate),
        currentVehicleId: vehicleId,
        preferredVehicleModelId: vehicleModelId,
      },
    });

    // Send rental started notification (async, don't wait)
    NotificationService.sendRentalStartedNotification(rental.id).catch(
      (error) => {
        console.error("Failed to send rental started notification:", error);
      }
    );

    // Fetch complete rental with payments
    const completeRental = await prisma.riderVehicleRental.findUnique({
      where: { id: rental.id },
      include: {
        payments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Rental created successfully",
      data: {
        rental: completeRental,
        vehicleModel,
      },
    });
  } catch (error: any) {
    console.error("Error creating rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create rental",
      error: error.message,
    });
  }
};

/**
 * Update rental details
 * PATCH /api/riders/:id/rental/:rentalId
 */
export const updateRental = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { id: riderId, rentalId } = req.params;
    const { status, terminationReason, adminNotes } = req.body;

    // Check if rental exists
    const rental = await prisma.riderVehicleRental.findFirst({
      where: {
        id: rentalId,
        riderId,
      },
    });

    if (!rental) {
      res.status(404).json({
        success: false,
        message: "Rental not found",
      });
      return;
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;

      // If terminating, set termination details
      if (status === "TERMINATED" || status === "SUSPENDED") {
        updateData.terminationDate = new Date();
        updateData.terminationReason =
          terminationReason || "Terminated by admin";
        updateData.endDate = new Date();

        // Also update rider status
        await prisma.rider.update({
          where: { id: riderId },
          data: {
            rentalStatus: status,
            rentalEndDate: new Date(),
          },
        });
      }
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const updatedRental = await prisma.riderVehicleRental.update({
      where: { id: rentalId },
      data: updateData,
      include: {
        payments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Rental updated successfully",
      data: updatedRental,
    });
  } catch (error: any) {
    console.error("Error updating rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update rental",
      error: error.message,
    });
  }
};

/**
 * Terminate rental
 * DELETE /api/riders/:id/rental/:rentalId
 */
export const terminateRental = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: riderId, rentalId } = req.params;
    const { terminationReason, terminatedBy } = req.body;

    // Check if rental exists
    const rental = await prisma.riderVehicleRental.findFirst({
      where: {
        id: rentalId,
        riderId,
      },
    });

    if (!rental) {
      res.status(404).json({
        success: false,
        message: "Rental not found",
      });
      return;
    }

    if (rental.status === "TERMINATED") {
      res.status(400).json({
        success: false,
        message: "Rental is already terminated",
      });
      return;
    }

    // Update rental to terminated
    const terminatedRental = await prisma.riderVehicleRental.update({
      where: { id: rentalId },
      data: {
        status: "TERMINATED",
        terminationReason: terminationReason || "Terminated by admin",
        terminationDate: new Date(),
        terminatedBy: terminatedBy || "system",
        endDate: new Date(),
      },
    });

    // Update rider status
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        rentalStatus: "TERMINATED",
        rentalEndDate: new Date(),
        currentVehicleId: null,
      },
    });

    // Cancel pending payments
    await prisma.riderRentalPayment.updateMany({
      where: {
        rentalId,
        status: "PENDING",
      },
      data: {
        status: "WAIVED",
        waiverReason: "Rental terminated early",
        waivedAt: new Date(),
      },
    });

    // Send rental terminated notification (async, don't wait)
    NotificationService.sendRentalTerminatedNotification(
      rentalId,
      terminationReason || "Terminated by admin"
    ).catch((error) => {
      console.error("Failed to send rental terminated notification:", error);
    });

    res.status(200).json({
      success: true,
      message: "Rental terminated successfully",
      data: terminatedRental,
    });
  } catch (error: any) {
    console.error("Error terminating rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to terminate rental",
      error: error.message,
    });
  }
};

/**
 * Get rental history for rider
 * GET /api/riders/:id/rental-history
 */
export const getRentalHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: riderId } = req.params;

    // Check if rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      res.status(404).json({
        success: false,
        message: "Rider not found",
      });
      return;
    }

    // Fetch all rentals for rider
    const rentals = await prisma.riderVehicleRental.findMany({
      where: { riderId },
      orderBy: {
        startDate: "desc",
      },
      include: {
        payments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    // Fetch vehicle model details for each rental
    const rentalsWithModels = await Promise.all(
      rentals.map(async (rental) => {
        let vehicleModel = null;
        if (rental.vehicleModelId) {
          vehicleModel = await vehicleServiceClient.getVehicleModel(
            rental.vehicleModelId
          );
        }
        return {
          ...rental,
          vehicleModel,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalRentals: rentals.length,
        rentals: rentalsWithModels,
      },
    });
  } catch (error: any) {
    console.error("Error fetching rental history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental history",
      error: error.message,
    });
  }
};

/**
 * Get rental payments for rider
 * GET /api/riders/:id/rental-payments
 */
export const getRentalPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: riderId } = req.params;
    const { status, rentalId } = req.query;

    // Check if rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      res.status(404).json({
        success: false,
        message: "Rider not found",
      });
      return;
    }

    // Build query filters
    const where: any = { riderId };
    if (status) {
      where.status = status;
    }
    if (rentalId) {
      where.rentalId = rentalId as string;
    }

    // Fetch payments
    const payments = await prisma.riderRentalPayment.findMany({
      where,
      orderBy: {
        dueDate: "desc",
      },
      include: {
        rental: {
          select: {
            id: true,
            vehicleModelId: true,
            monthlyRentalCost: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    // Calculate summary
    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: payments
        .filter((p) => p.status === "OVERDUE")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        payments,
      },
    });
  } catch (error: any) {
    console.error("Error fetching rental payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental payments",
      error: error.message,
    });
  }
};

/**
 * Update rental payment status
 * PATCH /api/riders/:id/rental-payments/:paymentId
 */
export const updateRentalPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { id: riderId, paymentId } = req.params;
    const {
      status,
      paidDate,
      paymentMethod,
      transactionId,
      isWaived,
      waiverReason,
      adminNotes,
    } = req.body;

    // Check if payment exists
    const payment = await prisma.riderRentalPayment.findFirst({
      where: {
        id: paymentId,
        riderId,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (paidDate) {
      updateData.paidDate = new Date(paidDate);
    }

    if (status === "PAID" && !paidDate) {
      updateData.paidDate = new Date();
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (isWaived !== undefined) {
      updateData.isWaived = isWaived;
      if (isWaived) {
        updateData.waivedAt = new Date();
        updateData.waiverReason = waiverReason || "Waived by admin";
        updateData.status = "WAIVED";
      }
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const updatedPayment = await prisma.riderRentalPayment.update({
      where: { id: paymentId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: updatedPayment,
    });
  } catch (error: any) {
    console.error("Error updating rental payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update rental payment",
      error: error.message,
    });
  }
};

// ==========================================
// PHASE 4: AUTOMATED BUSINESS LOGIC ENDPOINTS
// ==========================================

/**
 * Calculate rental cost with depreciation
 * POST /api/rentals/calculate-cost
 * Uses RentalPricingService for consistent pricing
 */
export const calculateRentalCost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { vehicleModelId, vehicleAge, rentalPeriodMonths } = req.body;

    if (!vehicleModelId) {
      res.status(400).json({
        success: false,
        message: "Vehicle model ID is required",
      });
      return;
    }

    const age = vehicleAge || 0; // Default to new vehicle
    const months = rentalPeriodMonths || 12; // Default to 12 months

    // Get rental estimate using pricing service
    const estimate = await RentalPricingService.getRentalEstimate(
      vehicleModelId,
      age,
      months
    );

    res.status(200).json({
      success: true,
      message: "Rental cost calculated successfully",
      data: estimate,
    });
  } catch (error: any) {
    console.error("Error calculating rental cost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate rental cost",
      error: error.message,
    });
  }
};

/**
 * Compare pricing for new vs used vehicles
 * POST /api/rentals/compare-pricing
 */
export const comparePricing = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      vehicleModelId,
      newVehicleAge,
      usedVehicleAge,
      rentalPeriodMonths,
    } = req.body;

    if (!vehicleModelId) {
      res.status(400).json({
        success: false,
        message: "Vehicle model ID is required",
      });
      return;
    }

    const newAge = newVehicleAge || 0;
    const usedAge = usedVehicleAge || 12;
    const months = rentalPeriodMonths || 12;

    const comparison = await RentalPricingService.comparePricing(
      vehicleModelId,
      newAge,
      usedAge,
      months
    );

    res.status(200).json({
      success: true,
      message: "Pricing comparison completed",
      data: comparison,
    });
  } catch (error: any) {
    console.error("Error comparing pricing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to compare pricing",
      error: error.message,
    });
  }
};

/**
 * Get rider balance and payment eligibility
 * GET /api/riders/:id/balance
 */
export const getRiderBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: riderId } = req.params;

    const balanceInfo = await PaymentDeductionService.getRiderBalanceInfo(
      riderId
    );

    res.status(200).json({
      success: true,
      data: balanceInfo,
    });
  } catch (error: any) {
    console.error("Error fetching rider balance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rider balance",
      error: error.message,
    });
  }
};

/**
 * Process payment deduction manually
 * POST /api/rentals/payments/:paymentId/deduct
 */
export const processPaymentDeduction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const result = await PaymentDeductionService.deductPaymentFromEarnings(
      paymentId
    );

    if (result.success) {
      // Send payment confirmation notification
      try {
        await NotificationService.sendPaymentConfirmation(paymentId);
      } catch (notifError) {
        console.error("Failed to send payment confirmation:", notifError);
        // Don't fail the request if notification fails
      }

      res.status(200).json({
        success: true,
        message: "Payment deducted successfully",
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || "Failed to deduct payment",
        data: result,
      });
    }
  } catch (error: any) {
    console.error("Error processing payment deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment deduction",
      error: error.message,
    });
  }
};

/**
 * Get payment statistics for a rental
 * GET /api/rentals/:rentalId/payment-stats
 */
export const getPaymentStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { rentalId } = req.params;

    const stats = await PaymentScheduleService.getPaymentStatistics(rentalId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching payment statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
      error: error.message,
    });
  }
};

/**
 * Send test notification
 * POST /api/rentals/notifications/test
 * (Admin only - for testing notification system)
 */
export const sendTestNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { riderId, type, paymentId } = req.body;

    if (!riderId || !type) {
      res.status(400).json({
        success: false,
        message: "Rider ID and notification type are required",
      });
      return;
    }

    let result;

    switch (type) {
      case "PAYMENT_REMINDER":
      case "PAYMENT_OVERDUE":
      case "PAYMENT_CONFIRMED":
        if (!paymentId) {
          res.status(400).json({
            success: false,
            message: "Payment ID is required for payment notifications",
          });
          return;
        }

        if (type === "PAYMENT_CONFIRMED") {
          result = await NotificationService.sendPaymentConfirmation(paymentId);
        } else {
          // For testing, fetch payment data and send notification
          const payment = await prisma.riderRentalPayment.findUnique({
            where: { id: paymentId },
            include: { rider: true },
          });

          if (!payment) {
            res.status(404).json({
              success: false,
              message: "Payment not found",
            });
            return;
          }

          const paymentMonth = payment.dueDate
            ? new Date(payment.dueDate).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })
            : "N/A";

          result = await NotificationService.sendNotification({
            riderId: payment.riderId,
            riderName: payment.rider.name || undefined,
            riderPhone: payment.rider.phone,
            type: type as any,
            channels: ["SMS", "EMAIL"] as any,
            data: {
              paymentId: payment.id,
              rentalId: payment.rentalId,
              amount: payment.amount,
              dueDate: payment.dueDate,
              paymentMonth,
            },
          });
        }
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Invalid notification type",
        });
        return;
    }

    res.status(200).json({
      success: true,
      message: "Test notification sent",
      data: result,
    });
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
};
