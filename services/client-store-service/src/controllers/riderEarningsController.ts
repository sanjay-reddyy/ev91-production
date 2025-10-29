import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler, createError } from "../middleware/errorHandler";

const prisma = new PrismaClient();

// List earnings with basic filtering & pagination
export const listEarnings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "50",
      riderId,
      clientRiderId,
      storeId,
      clientId,
      paymentStatus,
      dateFrom,
      dateTo,
      sortBy = "orderDate",
      sortOrder = "desc",
    } = req.query as any;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (riderId) where.riderId = riderId;
    if (clientRiderId) {
      where.clientRiderId = {
        contains: clientRiderId,
        mode: "insensitive",
      };
    }
    if (storeId) where.storeId = storeId;
    if (clientId) where.clientId = clientId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Date range filtering
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.riderEarning.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              clientCode: true,
            },
          },
          store: {
            select: {
              id: true,
              storeName: true,
              storeCode: true,
              city: true,
            },
          },
        },
      }),
      prisma.riderEarning.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, totalItems: total },
    });
  }
);

export const getEarning = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const earning = await prisma.riderEarning.findUnique({ where: { id } });
  if (!earning) throw createError("Earning not found", 404, "NOT_FOUND");
  res.json({ success: true, data: earning });
});

export const getEarningsByRider = asyncHandler(
  async (req: Request, res: Response) => {
    const { riderId } = req.params;
    const earnings = await prisma.riderEarning.findMany({
      where: { riderId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: earnings });
  }
);

export const getEarningsByStore = asyncHandler(
  async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const earnings = await prisma.riderEarning.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: earnings });
  }
);

export const createEarning = asyncHandler(async (req: Request, res: Response) => {
  const {
    riderId,
    clientId,
    storeId,
    orderId,
    baseRate,
    storeOfferRate,
    totalRate,
    bulkOrderBonus,
    performanceBonus,
    weeklyTargetBonus,
    specialEventBonus,
    finalEarning,
    paymentStatus,
    orderDate,
    deliveryTime,
    distance,
    riderRating,
    bonusesApplied,
    rateCalculationLog,
    paymentDate,
    paymentMethod,
    paymentReference,
  } = req.body;

  // ✅ Fixed validation
  if (!riderId || !clientId || !storeId || finalEarning === undefined) {
    throw createError(
      "Missing required fields: riderId, clientId, storeId, and finalEarning are required",
      400,
      "MISSING_FIELDS"
    );
  }

  // ✅ Client check
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw createError(`Client with ID ${clientId} not found`, 404, "CLIENT_NOT_FOUND");
  }

  // ✅ Store check
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw createError(`Store with ID ${storeId} not found`, 404, "STORE_NOT_FOUND");
  }

  // ✅ Validate store-client link
  if (store.clientId !== clientId) {
    throw createError(
      `Store ${storeId} does not belong to client ${clientId}`,
      400,
      "STORE_CLIENT_MISMATCH"
    );
  }

  // ✅ Prepare payload
  const earningData = {
    riderId,
    clientId,
    storeId,
    orderId,
    baseRate,
    storeOfferRate,
    totalRate,
    bulkOrderBonus,
    performanceBonus,
    weeklyTargetBonus,
    specialEventBonus,
    finalEarning,
    paymentStatus,
    orderDate: orderDate ? new Date(orderDate) : new Date(),
    deliveryTime,
    distance,
    riderRating,
    bonusesApplied,
    rateCalculationLog,
    paymentDate: paymentDate ? new Date(paymentDate) : null,
    paymentMethod,
    paymentReference,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ✅ Create record
  const created = await prisma.riderEarning.create({ data: earningData });
  res.status(201).json({ success: true, data: created });
});

export const updateEarning = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const existing = await prisma.riderEarning.findUnique({ where: { id } });
    if (!existing) throw createError("Earning not found", 404, "NOT_FOUND");

    const updated = await prisma.riderEarning.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() } as any,
    });
    res.json({ success: true, data: updated });
  }
);

export const deleteEarning = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = await prisma.riderEarning.findUnique({ where: { id } });
    if (!existing) throw createError("Earning not found", 404, "NOT_FOUND");
    await prisma.riderEarning.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  }
);

// Weekly summary stub - simple aggregation
export const weeklySummary = asyncHandler(
  async (req: Request, res: Response) => {
    const { riderId } = req.params;
    const earnings = await prisma.riderEarning.findMany({ where: { riderId } });
    const totalEarnings = earnings.reduce(
      (s, e) => s + (e.finalEarning || 0),
      0
    );
    res.json({
      success: true,
      data: { totalEarnings, totalOrders: earnings.length },
    });
  }
);