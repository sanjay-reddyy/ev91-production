import express, { Request, Response } from "express";
import { prisma } from "../config/database";

const router = express.Router();

// ==========================================
// ADMIN RIDER MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Get all riders with filtering, pagination, and search
 */
router.get("/riders", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      registrationStatus,
      kycStatus,
      city,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string } },
      ];
    }

    if (registrationStatus) {
      where.registrationStatus = registrationStatus;
    }

    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    // Get riders with pagination
    const [riders, totalCount] = await Promise.all([
      prisma.rider.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === "desc" ? "desc" : "asc",
        },
      }),
      prisma.rider.count({ where }),
    ]);

    // Add basic metrics (will be enhanced later)
    const ridersWithMetrics = riders.map((rider) => ({
      ...rider,
      isActive: rider.registrationStatus === "COMPLETED",
      totalOrders: 0,
      averageRating: 0,
      totalEarnings: 0,
      completionRate: 0,
    }));

    res.json({
      success: true,
      data: ridersWithMetrics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching riders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch riders",
    });
  }
});

/**
 * Get rider by ID with full details
 */
router.get("/riders/:riderId", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Add computed fields to match frontend expectations
    const riderWithExtras = {
      ...rider,
      isActive: rider.registrationStatus === "COMPLETED",
      email: null, // Not in current schema
      phoneVerified: rider.phoneVerified,
      address1: rider.address1,
      address2: rider.address2,
      aadharNumber: rider.aadhaar,
      panNumber: rider.pan,
      drivingLicenseNumber: rider.dl,
    };

    res.json({
      success: true,
      data: riderWithExtras,
    });
  } catch (error) {
    console.error("Error fetching rider:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rider",
    });
  }
});

/**
 * Get rider statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const [
      totalRiders,
      completedRegistrations,
      pendingRegistrations,
      pendingKYC,
      verifiedRiders,
    ] = await Promise.all([
      prisma.rider.count(),
      prisma.rider.count({ where: { registrationStatus: "COMPLETED" } }),
      prisma.rider.count({ where: { registrationStatus: "PENDING" } }),
      prisma.rider.count({ where: { kycStatus: "pending" } }),
      prisma.rider.count({ where: { kycStatus: "verified" } }),
    ]);

    res.json({
      success: true,
      data: {
        totalRiders,
        activeRiders: completedRegistrations,
        pendingRegistrations,
        pendingKYC,
        verifiedRiders,
        totalEarnings: 0,
        averageRating: 0,
        completionRate: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching rider stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rider statistics",
    });
  }
});

/**
 * Update rider status (activate/deactivate)
 */
router.patch("/riders/:riderId/status", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;
    const { isActive } = req.body;

    const status = isActive ? "COMPLETED" : "PENDING";

    const rider = await prisma.rider.update({
      where: { id: riderId },
      data: { registrationStatus: status },
    });

    res.json({
      success: true,
      data: { ...rider, isActive },
      message: `Rider ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error updating rider status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update rider status",
    });
  }
});

/**
 * Approve rider registration
 */
router.patch(
  "/riders/:riderId/approve",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          registrationStatus: "COMPLETED",
        },
      });

      res.json({
        success: true,
        data: { ...rider, isActive: true },
        message: "Rider approved successfully",
      });
    } catch (error) {
      console.error("Error approving rider:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve rider",
      });
    }
  }
);

/**
 * Reject rider registration
 */
router.patch("/riders/:riderId/reject", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;
    const { reason } = req.body;

    const rider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        registrationStatus: "REJECTED",
      },
    });

    res.json({
      success: true,
      data: { ...rider, isActive: false },
      message: "Rider rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting rider:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject rider",
    });
  }
});

// Placeholder endpoints for frontend compatibility
router.get("/riders/:riderId/kyc", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get("/riders/:riderId/orders", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get("/riders/:riderId/earnings", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get(
  "/riders/:riderId/earnings/summary",
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        totalEarnings: 0,
        totalOrders: 0,
        averageEarningPerOrder: 0,
        totalDistance: 0,
      },
    });
  }
);

router.get("/vehicles/available", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

export default router;
