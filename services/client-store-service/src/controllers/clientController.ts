import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

// Create a new client
export const createClient = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log(
      `🆕 Creating new client with data:`,
      JSON.stringify(req.body, null, 2)
    );

    const {
      clientCode,
      clientType,
      name,
      primaryContactPerson,
      designation,
      email,
      secondaryEmail,
      phone,
      secondaryPhone,
      city,
      state,
      pinCode,
      registrationNumber,
      panNumber,
      gstNumber,
      industrySector,
      businessCategory,
      evPortfolio,
      fleetSize,
      hasChargingInfra,
      chargingInfraDetails,
      batteryTechPreference,
      serviceRequirements,
      paymentTerms,
      preferredPaymentMethod,
      taxCategory,
      discountCategory,
      baseOrderRate,
      rateEffectiveDate,
      rateType,
      minimumRate,
      maximumRate,
      bulkBonusEnabled,
      bulkOrdersThreshold,
      bulkBonusAmount,
      bulkResetPeriod,
      weeklyBonusEnabled,
      weeklyOrderTarget,
      weeklyBonusAmount,
      performanceMultiplierEnabled,
      topPerformerRate,
      performanceCriteria,
      paymentCycle,
      paymentMethods,
      minimumPayout,
      payoutDay,
      clientStatus,
      acquisitionDate,
      accountManagerId,
      clientPriority,
      relationshipType,
    } = req.body;

    // Validate required fields
    if (
      !clientCode ||
      !clientType ||
      !name ||
      baseOrderRate === undefined ||
      baseOrderRate === null
    ) {
      throw createError(
        "Client code, type, name, and base order rate are required",
        400,
        "MISSING_REQUIRED_FIELDS"
      );
    }

    // Validate account manager if provided
    if (accountManagerId) {
      const accountManager = await prisma.user.findUnique({
        where: { id: accountManagerId },
      });
      if (!accountManager) {
        throw createError("Account manager not found", 404, "USER_NOT_FOUND");
      }
    }

    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [{ clientCode }, { email: email || undefined }],
      },
    });

    if (existingClient) {
      throw createError(
        "Client with this code or email already exists",
        409,
        "CLIENT_EXISTS"
      );
    }

    try {
      console.log(`📝 Creating client with data:`, {
        clientCode,
        name,
        email,
        accountManagerId,
        clientType,
        city,
      });

      const client = await prisma.client.create({
        data: {
          clientCode,
          clientType,
          name,
          primaryContactPerson,
          designation,
          email,
          secondaryEmail,
          phone,
          secondaryPhone,
          city,
          state,
          pinCode,
          registrationNumber,
          panNumber,
          gstNumber,
          industrySector,
          businessCategory,
          evPortfolio,
          fleetSize: fleetSize ? parseInt(fleetSize.toString()) : null,
          hasChargingInfra: hasChargingInfra || false,
          chargingInfraDetails,
          batteryTechPreference,
          serviceRequirements,
          paymentTerms,
          preferredPaymentMethod,
          taxCategory,
          discountCategory,
          baseOrderRate: parseFloat(baseOrderRate.toString()),
          rateEffectiveDate: rateEffectiveDate
            ? new Date(rateEffectiveDate)
            : new Date(),
          rateType: rateType || "fixed",
          minimumRate: minimumRate ? parseFloat(minimumRate.toString()) : 15.0,
          maximumRate: maximumRate ? parseFloat(maximumRate.toString()) : 50.0,
          bulkBonusEnabled: bulkBonusEnabled || false,
          bulkOrdersThreshold: bulkOrdersThreshold
            ? parseInt(bulkOrdersThreshold.toString())
            : 10,
          bulkBonusAmount: bulkBonusAmount
            ? parseFloat(bulkBonusAmount.toString())
            : 0.0,
          bulkResetPeriod: bulkResetPeriod || "daily",
          weeklyBonusEnabled: weeklyBonusEnabled || false,
          weeklyOrderTarget: weeklyOrderTarget
            ? parseInt(weeklyOrderTarget.toString())
            : 0,
          weeklyBonusAmount: weeklyBonusAmount
            ? parseFloat(weeklyBonusAmount.toString())
            : 0.0,
          performanceMultiplierEnabled: performanceMultiplierEnabled || false,
          topPerformerRate: topPerformerRate
            ? parseFloat(topPerformerRate.toString())
            : 1.2,
          performanceCriteria: performanceCriteria || "rating",
          paymentCycle: paymentCycle || "weekly",
          paymentMethods,
          minimumPayout: minimumPayout
            ? parseFloat(minimumPayout.toString())
            : 100.0,
          payoutDay: payoutDay || "Friday",
          clientStatus: clientStatus || "Active",
          acquisitionDate: acquisitionDate
            ? new Date(acquisitionDate)
            : new Date(),
          accountManagerId,
          clientPriority: clientPriority || "Medium",
          relationshipType: relationshipType || "Direct",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          stores: {
            select: {
              id: true,
              storeName: true,
              storeStatus: true,
            },
          },
          accountManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              stores: true,
            },
          },
        },
      });

      console.log(`✅ Client created successfully: ${client.id}`);

      res.status(201).json({
        success: true,
        message: "Client created successfully",
        data: client,
      });
    } catch (error: any) {
      console.error(`❌ Error creating client:`, error);
      throw error;
    }
  }
);

// Get all clients with filtering
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    search,
    city,
    clientType,
    clientStatus,
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
      { email: { contains: search as string, mode: "insensitive" } },
      {
        primaryContactPerson: {
          contains: search as string,
          mode: "insensitive",
        },
      },
      { clientCode: { contains: search as string, mode: "insensitive" } },
    ];
  }

  if (city) {
    where.city = { contains: city as string, mode: "insensitive" };
  }

  if (clientType) {
    where.clientType = clientType as string;
  }

  if (clientStatus) {
    where.clientStatus = clientStatus as string;
  }

  // Get clients with pagination
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as "asc" | "desc",
      },
      include: {
        stores: {
          select: {
            id: true,
            storeName: true,
            storeStatus: true,
          },
        },
        accountManager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            stores: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  res.json({
    success: true,
    data: clients,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

// Get client by ID
export const getClientById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        stores: {
          select: {
            id: true,
            storeName: true,
            storeStatus: true,
          },
        },
        accountManager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            stores: true,
          },
        },
      },
    });

    if (!client) {
      throw createError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    res.json({
      success: true,
      data: client,
    });
  }
);

// Update client
export const updateClient = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log(
      `🔄 Updating client ${id} with data:`,
      JSON.stringify(updateData, null, 2)
    );

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.stores;
    delete updateData.accountManager;
    delete updateData._count;

    // Handle numeric fields
    if (updateData.baseOrderRate) {
      updateData.baseOrderRate = parseFloat(
        updateData.baseOrderRate.toString()
      );
    }
    if (updateData.fleetSize) {
      updateData.fleetSize = parseInt(updateData.fleetSize.toString());
    }
    if (updateData.minimumRate) {
      updateData.minimumRate = parseFloat(updateData.minimumRate.toString());
    }
    if (updateData.maximumRate) {
      updateData.maximumRate = parseFloat(updateData.maximumRate.toString());
    }
    if (updateData.bulkOrdersThreshold) {
      updateData.bulkOrdersThreshold = parseInt(
        updateData.bulkOrdersThreshold.toString()
      );
    }
    if (updateData.bulkBonusAmount) {
      updateData.bulkBonusAmount = parseFloat(
        updateData.bulkBonusAmount.toString()
      );
    }
    if (updateData.weeklyOrderTarget) {
      updateData.weeklyOrderTarget = parseInt(
        updateData.weeklyOrderTarget.toString()
      );
    }
    if (updateData.weeklyBonusAmount) {
      updateData.weeklyBonusAmount = parseFloat(
        updateData.weeklyBonusAmount.toString()
      );
    }
    if (updateData.topPerformerRate) {
      updateData.topPerformerRate = parseFloat(
        updateData.topPerformerRate.toString()
      );
    }
    if (updateData.minimumPayout) {
      updateData.minimumPayout = parseFloat(
        updateData.minimumPayout.toString()
      );
    }

    // Handle date fields
    if (updateData.rateEffectiveDate) {
      updateData.rateEffectiveDate = new Date(updateData.rateEffectiveDate);
    }
    if (updateData.acquisitionDate) {
      updateData.acquisitionDate = new Date(updateData.acquisitionDate);
    }

    // Handle empty string values that should be null for foreign keys
    if (updateData.accountManagerId === "") {
      updateData.accountManagerId = null;
    }

    // Add update tracking
    updateData.updatedAt = new Date();

    console.log(
      `🔄 Processed update data:`,
      JSON.stringify(updateData, null, 2)
    );

    try {
      const client = await prisma.client.update({
        where: { id },
        data: updateData,
        include: {
          stores: {
            select: {
              id: true,
              storeName: true,
              storeStatus: true,
            },
          },
          accountManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              stores: true,
            },
          },
        },
      });

      console.log(`✅ Client updated successfully: ${id}`);

      res.json({
        success: true,
        message: "Client updated successfully",
        data: client,
      });
    } catch (error: any) {
      console.error(`❌ Error updating client ${id}:`, error);
      throw error;
    }
  }
);

// Delete client (soft delete)
export const deleteClient = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if client has active stores
    const activeStores = await prisma.store.count({
      where: {
        clientId: id,
        storeStatus: "Active",
      },
    });

    if (activeStores > 0) {
      throw createError(
        "Cannot delete client with active stores. Please deactivate all stores first.",
        400,
        "CLIENT_HAS_ACTIVE_STORES"
      );
    }

    // Soft delete by setting clientStatus to inactive
    const client = await prisma.client.update({
      where: { id },
      data: {
        clientStatus: "inactive",
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Client deleted successfully",
      data: client,
    });
  }
);

// Get clients by city
export const getClientsByCity = asyncHandler(
  async (req: Request, res: Response) => {
    const { city } = req.params;

    const clients = await prisma.client.findMany({
      where: {
        city: { contains: city, mode: "insensitive" },
        clientStatus: "Active",
      },
      include: {
        _count: {
          select: {
            stores: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: clients,
    });
  }
);

// Get client statistics
export const getClientStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { city } = req.query;

    const where: any = {};
    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    const [totalClients, activeClients, typeStats] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.count({ where: { ...where, clientStatus: "active" } }),
      prisma.client.groupBy({
        by: ["clientType"],
        where,
        _count: {
          clientType: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients,
        businessTypeDistribution: typeStats.reduce((acc, stat) => {
          acc[stat.clientType || "Unknown"] = stat._count.clientType;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  }
);

// Get available account managers (users)
export const getAccountManagers = asyncHandler(
  async (req: Request, res: Response) => {
    const accountManagers = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    res.json({
      success: true,
      data: accountManagers,
    });
  }
);
