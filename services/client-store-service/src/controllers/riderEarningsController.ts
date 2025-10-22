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
      storeId,
      paymentStatus,
    } = req.query as any;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (riderId) where.riderId = riderId;
    if (storeId) where.storeId = storeId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [data, total] = await Promise.all([
      prisma.riderEarning.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
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

export const createEarning = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = req.body;
    // Basic validation
    if (
      !payload.riderId ||
      !payload.clientId ||
      !payload.storeId ||
      payload.finalEarning === undefined
    ) {
      throw createError(
        "Missing required fields for creating earning",
        400,
        "MISSING_FIELDS"
      );
    }

    const created = await prisma.riderEarning.create({
      data: { ...payload, createdAt: new Date(), updatedAt: new Date() } as any,
    });
    res.status(201).json({ success: true, data: created });
  }
);

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
