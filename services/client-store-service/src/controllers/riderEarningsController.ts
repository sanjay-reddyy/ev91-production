import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

// Create a new rider earning record
export const createRiderEarning = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      riderId,
      storeId,
      orderId,
      orderValue,
      baseRate,
      baseEarning,
      distanceBonus,
      timeBonus,
      storeOfferBonus,
      evBonus,
      peakTimeBonus,
      qualityBonus,
      penaltyAmount,
      bonusEarning,
      totalEarning,
      paymentStatus,
      orderDate,
      deliveryStartTime,
      deliveryEndTime,
      distanceTraveled,
      fuelUsed,
      energyUsed,
      notes,
      metadata,
    } = req.body;

    // Validate required fields
    if (!riderId || !storeId || !orderId) {
      throw createError(
        "RiderId, storeId, and orderId are required",
        400,
        "MISSING_REQUIRED_FIELDS"
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw createError("Store not found", 404, "STORE_NOT_FOUND");
    }

    // Check if earning record already exists for this order
    const existingEarning = await prisma.riderEarning.findFirst({
      where: { orderId },
    });

    if (existingEarning) {
      throw createError(
        "Earning record already exists for this order",
        409,
        "EARNING_EXISTS"
      );
    }

    const riderEarning = await prisma.riderEarning.create({
      data: {
        riderId,
        storeId,
        orderId,
        orderValue: orderValue ? parseFloat(orderValue) : null,
        baseRate: baseRate ? parseFloat(baseRate) : null,
        baseEarning: baseEarning ? parseFloat(baseEarning) : 0,
        distanceBonus: distanceBonus ? parseFloat(distanceBonus) : 0,
        timeBonus: timeBonus ? parseFloat(timeBonus) : 0,
        storeOfferBonus: storeOfferBonus ? parseFloat(storeOfferBonus) : 0,
        evBonus: evBonus ? parseFloat(evBonus) : 0,
        peakTimeBonus: peakTimeBonus ? parseFloat(peakTimeBonus) : 0,
        qualityBonus: qualityBonus ? parseFloat(qualityBonus) : 0,
        penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : 0,
        bonusEarning: bonusEarning ? parseFloat(bonusEarning) : 0,
        totalEarning: totalEarning ? parseFloat(totalEarning) : 0,
        paymentStatus: paymentStatus || "pending",
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        deliveryStartTime: deliveryStartTime
          ? new Date(deliveryStartTime)
          : null,
        deliveryEndTime: deliveryEndTime ? new Date(deliveryEndTime) : null,
        distanceTraveled: distanceTraveled
          ? parseFloat(distanceTraveled)
          : null,
        fuelUsed: fuelUsed ? parseFloat(fuelUsed) : null,
        energyUsed: energyUsed ? parseFloat(energyUsed) : null,
        notes,
        metadata: metadata || {},
        createdBy: req.user?.id,
      },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Rider earning created successfully",
      data: riderEarning,
    });
  }
);

// Get all rider earnings with filtering
export const getRiderEarnings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "10",
      riderId,
      storeId,
      paymentStatus,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (riderId) {
      where.riderId = riderId as string;
    }

    if (storeId) {
      where.storeId = storeId as string;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as string;
    }

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom as string);
      if (dateTo) where.orderDate.lte = new Date(dateTo as string);
    }

    // Get earnings with pagination
    const [earnings, total] = await Promise.all([
      prisma.riderEarning.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder as "asc" | "desc",
        },
        include: {
          store: {
            select: {
              id: true,
              storeName: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.riderEarning.count({ where }),
    ]);

    res.json({
      success: true,
      data: earnings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  }
);

// Get rider earning by ID
export const getRiderEarningById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const earning = await prisma.riderEarning.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            completeAddress: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!earning) {
      throw createError("Rider earning not found", 404, "EARNING_NOT_FOUND");
    }

    res.json({
      success: true,
      data: earning,
    });
  }
);

// Update rider earning
export const updateRiderEarning = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.orderId; // Order ID should not be changed

    // Handle numeric fields
    if (updateData.orderValue)
      updateData.orderValue = parseFloat(updateData.orderValue);
    if (updateData.baseRate)
      updateData.baseRate = parseFloat(updateData.baseRate);
    if (updateData.baseEarning)
      updateData.baseEarning = parseFloat(updateData.baseEarning);
    if (updateData.distanceBonus)
      updateData.distanceBonus = parseFloat(updateData.distanceBonus);
    if (updateData.timeBonus)
      updateData.timeBonus = parseFloat(updateData.timeBonus);
    if (updateData.storeOfferBonus)
      updateData.storeOfferBonus = parseFloat(updateData.storeOfferBonus);
    if (updateData.evBonus) updateData.evBonus = parseFloat(updateData.evBonus);
    if (updateData.peakTimeBonus)
      updateData.peakTimeBonus = parseFloat(updateData.peakTimeBonus);
    if (updateData.qualityBonus)
      updateData.qualityBonus = parseFloat(updateData.qualityBonus);
    if (updateData.penaltyAmount)
      updateData.penaltyAmount = parseFloat(updateData.penaltyAmount);
    if (updateData.bonusEarning)
      updateData.bonusEarning = parseFloat(updateData.bonusEarning);
    if (updateData.totalEarning)
      updateData.totalEarning = parseFloat(updateData.totalEarning);
    if (updateData.distanceTraveled)
      updateData.distanceTraveled = parseFloat(updateData.distanceTraveled);
    if (updateData.fuelUsed)
      updateData.fuelUsed = parseFloat(updateData.fuelUsed);
    if (updateData.energyUsed)
      updateData.energyUsed = parseFloat(updateData.energyUsed);

    // Handle date fields
    if (updateData.orderDate)
      updateData.orderDate = new Date(updateData.orderDate);
    if (updateData.deliveryStartTime)
      updateData.deliveryStartTime = new Date(updateData.deliveryStartTime);
    if (updateData.deliveryEndTime)
      updateData.deliveryEndTime = new Date(updateData.deliveryEndTime);

    // Add update tracking
    updateData.updatedAt = new Date();
    updateData.updatedBy = req.user?.id;

    const earning = await prisma.riderEarning.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Rider earning updated successfully",
      data: earning,
    });
  }
);

// Delete rider earning
export const deleteRiderEarning = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if earning is already paid
    const earning = await prisma.riderEarning.findUnique({
      where: { id },
    });

    if (!earning) {
      throw createError("Rider earning not found", 404, "EARNING_NOT_FOUND");
    }

    if (earning.paymentStatus === "paid") {
      throw createError(
        "Cannot delete a paid earning record",
        400,
        "CANNOT_DELETE_PAID_EARNING"
      );
    }

    await prisma.riderEarning.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Rider earning deleted successfully",
    });
  }
);

// Get rider earnings by rider ID
export const getRiderEarningsByRider = asyncHandler(
  async (req: Request, res: Response) => {
    const { riderId } = req.params;
    const { dateFrom, dateTo, paymentStatus } = req.query;

    const where: any = { riderId };

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as string;
    }

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom as string);
      if (dateTo) where.orderDate.lte = new Date(dateTo as string);
    }

    const earnings = await prisma.riderEarning.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // Calculate summary
    const summary = earnings.reduce(
      (acc, earning) => {
        acc.totalEarnings += earning.totalEarning;
        acc.totalOrders += 1;
        acc.totalBaseEarnings += earning.baseEarning;
        acc.totalBonuses += earning.bonusEarning;
        acc.totalPenalties += earning.penaltyAmount;

        if (earning.paymentStatus === "paid") {
          acc.paidEarnings += earning.totalEarning;
          acc.paidOrders += 1;
        } else {
          acc.pendingEarnings += earning.totalEarning;
          acc.pendingOrders += 1;
        }

        return acc;
      },
      {
        totalEarnings: 0,
        totalOrders: 0,
        totalBaseEarnings: 0,
        totalBonuses: 0,
        totalPenalties: 0,
        paidEarnings: 0,
        paidOrders: 0,
        pendingEarnings: 0,
        pendingOrders: 0,
      }
    );

    res.json({
      success: true,
      data: {
        earnings,
        summary,
      },
    });
  }
);

// Get rider earnings by store ID
export const getRiderEarningsByStore = asyncHandler(
  async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const where: any = { storeId };

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom as string);
      if (dateTo) where.orderDate.lte = new Date(dateTo as string);
    }

    const earnings = await prisma.riderEarning.findMany({
      where,
      orderBy: {
        orderDate: "desc",
      },
    });

    res.json({
      success: true,
      data: earnings,
    });
  }
);

// Get weekly rider summary
export const getWeeklyRiderSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const { riderId } = req.params;
    const { year, week } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (year && week) {
      // Calculate start and end of the specified week
      const yearNum = parseInt(year as string);
      const weekNum = parseInt(week as string);
      const firstDayOfYear = new Date(yearNum, 0, 1);
      const daysToAdd = (weekNum - 1) * 7;
      startDate = new Date(
        firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000
      );
      endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    } else {
      // Current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);
    }

    // Check if weekly summary already exists
    let weeklySummary = await prisma.weeklyRiderSummary.findFirst({
      where: {
        riderId,
        weekStartDate: startDate,
        weekEndDate: endDate,
      },
    });

    if (!weeklySummary) {
      // Generate summary from earnings
      const earnings = await prisma.riderEarning.findMany({
        where: {
          riderId,
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const summaryData = earnings.reduce(
        (acc, earning) => {
          acc.totalEarnings += earning.totalEarning;
          acc.totalOrders += 1;
          acc.totalBaseEarnings += earning.baseEarning;
          acc.totalBonuses += earning.bonusEarning;
          acc.totalPenalties += earning.penaltyAmount;
          acc.totalDistance += earning.distanceTraveled || 0;
          acc.totalFuelUsed += earning.fuelUsed || 0;
          acc.totalEnergyUsed += earning.energyUsed || 0;
          return acc;
        },
        {
          totalEarnings: 0,
          totalOrders: 0,
          totalBaseEarnings: 0,
          totalBonuses: 0,
          totalPenalties: 0,
          totalDistance: 0,
          totalFuelUsed: 0,
          totalEnergyUsed: 0,
        }
      );

      // Create weekly summary record
      weeklySummary = await prisma.weeklyRiderSummary.create({
        data: {
          riderId,
          weekStartDate: startDate,
          weekEndDate: endDate,
          ...summaryData,
          averageEarningPerOrder:
            summaryData.totalOrders > 0
              ? summaryData.totalEarnings / summaryData.totalOrders
              : 0,
          metadata: {},
        },
      });
    }

    res.json({
      success: true,
      data: weeklySummary,
    });
  }
);

// Generate weekly report for multiple riders
export const generateWeeklyReport = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { riderIds, startDate, endDate } = req.body;

    if (!riderIds || !Array.isArray(riderIds) || riderIds.length === 0) {
      throw createError("RiderIds array is required", 400, "MISSING_RIDER_IDS");
    }

    const reports = await Promise.all(
      riderIds.map(async (riderId: string) => {
        const earnings = await prisma.riderEarning.findMany({
          where: {
            riderId,
            orderDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            store: {
              select: {
                storeName: true,
                client: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        const summary = earnings.reduce(
          (acc, earning) => {
            acc.totalEarnings += earning.totalEarning;
            acc.totalOrders += 1;
            acc.totalBaseEarnings += earning.baseEarning;
            acc.totalBonuses += earning.bonusEarning;
            acc.totalPenalties += earning.penaltyAmount;
            acc.totalDistance += earning.distanceTraveled || 0;
            return acc;
          },
          {
            totalEarnings: 0,
            totalOrders: 0,
            totalBaseEarnings: 0,
            totalBonuses: 0,
            totalPenalties: 0,
            totalDistance: 0,
          }
        );

        return {
          riderId,
          earnings,
          summary: {
            ...summary,
            averageEarningPerOrder:
              summary.totalOrders > 0
                ? summary.totalEarnings / summary.totalOrders
                : 0,
          },
        };
      })
    );

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        reports,
      },
    });
  }
);
