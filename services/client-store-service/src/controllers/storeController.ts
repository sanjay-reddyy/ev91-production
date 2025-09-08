import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

// Create a new store
export const createStore = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log(
      `🏪 Creating store with data:`,
      JSON.stringify(req.body, null, 2)
    );

    // Map frontend field names to backend field names
    const requestBody = { ...req.body };

    // Handle contactPersonName -> storeManagerName mapping
    if ("contactPersonName" in requestBody) {
      requestBody.storeManagerName = requestBody.contactPersonName;
      delete requestBody.contactPersonName;
    }

    // Handle latitude/longitude -> gpsLatitude/gpsLongitude mapping
    if ("latitude" in requestBody) {
      requestBody.gpsLatitude = requestBody.latitude;
      delete requestBody.latitude;
    }

    if ("longitude" in requestBody) {
      requestBody.gpsLongitude = requestBody.longitude;
      delete requestBody.longitude;
    }

    // Extract only valid schema fields
    const {
      clientId,
      storeName,
      storeCode,
      storeType = "Showroom",
      completeAddress,
      city,
      state = "",
      pinCode = "",
      storeStatus = "Active",
      contactNumber,
      emailAddress,
    } = requestBody;

    // Validate required fields
    if (!clientId || !storeName || !completeAddress || !city) {
      throw createError(
        "ClientId, storeName, completeAddress, and city are required",
        400,
        "MISSING_REQUIRED_FIELDS"
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw createError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const store = await prisma.store.create({
      data: {
        // Required fields
        clientId,
        storeName,
        completeAddress,
        city,
        state,
        pinCode,
        storeType,
        storeStatus,

        // Optional fields from frontend
        storeCode: storeCode || `STORE_${Date.now()}`,

        // GPS coordinates - use mapped values
        gpsLatitude: requestBody.gpsLatitude
          ? parseFloat(requestBody.gpsLatitude)
          : null,
        gpsLongitude: requestBody.gpsLongitude
          ? parseFloat(requestBody.gpsLongitude)
          : null,

        // Contact fields - use mapped values
        storeManagerName: requestBody.storeManagerName || null,
        contactNumber: contactNumber || null,
        emailAddress: emailAddress || null,

        // Default values for new schema fields
        country: "India",
        currentOfferRate: 0.0,
        offerType: "none",
        isOfferActive: false,
        busyLevel: "medium",
        averageOrdersPerDay: 0,
        orderDifficultyLevel: "medium",
        averageDeliveryDistance: 0.0,
        monthlyOrderVolume: 0,
        riderRating: 0.0,
        averagePickupTime: 0,
        storePriority: "standard",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: store,
    });
  }
);

// Get all stores with filtering
export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    search,
    clientId,
    city,
    storeType,
    storeStatus,
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
      { storeName: { contains: search as string, mode: "insensitive" } },
      { storeCode: { contains: search as string, mode: "insensitive" } },
      { completeAddress: { contains: search as string, mode: "insensitive" } },
      { storeManagerName: { contains: search as string, mode: "insensitive" } },
    ];
  }

  if (clientId) where.clientId = clientId as string;
  if (city) where.city = city as string;
  if (storeType) where.storeType = storeType as string;
  if (storeStatus) where.storeStatus = storeStatus as string;

  // Get stores with pagination
  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as "asc" | "desc",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
    }),
    prisma.store.count({ where }),
  ]);

  res.json({
    success: true,
    data: stores,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

// Get store by ID
export const getStoreById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: {
        id: id as string,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
    });

    if (!store) {
      throw createError("Store not found", 404, "STORE_NOT_FOUND");
    }

    res.json({
      success: true,
      data: store,
    });
  }
);

// Update store
export const updateStore = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    console.log(
      `🔄 Updating store ${id} with data:`,
      JSON.stringify(req.body, null, 2)
    );

    // First, handle field mapping before destructuring
    let requestBody = { ...req.body };

    // Handle contactPersonName -> storeManagerName mapping
    if ("contactPersonName" in requestBody) {
      requestBody.storeManagerName = requestBody.contactPersonName;
      delete requestBody.contactPersonName;
    }

    // Handle latitude/longitude -> gpsLatitude/gpsLongitude mapping
    if ("latitude" in requestBody) {
      requestBody.gpsLatitude = requestBody.latitude;
      delete requestBody.latitude;
    }

    if ("longitude" in requestBody) {
      requestBody.gpsLongitude = requestBody.longitude;
      delete requestBody.longitude;
    }

    // Strip relation fields and computed fields from update data
    const {
      client,
      clientId,
      totalOrders,
      averageRating,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
      // Remove invalid fields that don't exist in the schema
      deliveryRadius,
      minimumOrderAmount,
      deliveryFee,
      chargingPower,
      averagePreparationTime,
      commission,
      businessHours,
      peakHours,
      specialInstructions,
      acceptsCash,
      acceptsCard,
      acceptsDigitalPayment,
      metadata,
      primaryContact,
      secondaryContact,
      email,
      storeManagerContact,
      storeManagerEmail,
      chargingStationType,
      ...validUpdateData
    } = requestBody;

    // Only include fields that exist in the Store schema
    const updateData: any = {};

    // Basic info fields
    if (validUpdateData.storeName)
      updateData.storeName = validUpdateData.storeName;
    if (validUpdateData.storeCode)
      updateData.storeCode = validUpdateData.storeCode;
    if (validUpdateData.storeType)
      updateData.storeType = validUpdateData.storeType;
    if (validUpdateData.brandFranchise)
      updateData.brandFranchise = validUpdateData.brandFranchise;

    // Address fields
    if (validUpdateData.completeAddress)
      updateData.completeAddress = validUpdateData.completeAddress;
    if (validUpdateData.city) updateData.city = validUpdateData.city;
    if (validUpdateData.state) updateData.state = validUpdateData.state;
    if (validUpdateData.country) updateData.country = validUpdateData.country;
    if (validUpdateData.pinCode) updateData.pinCode = validUpdateData.pinCode;
    if (validUpdateData.landmark)
      updateData.landmark = validUpdateData.landmark;
    if (validUpdateData.zoneRegion)
      updateData.zoneRegion = validUpdateData.zoneRegion;

    // GPS coordinates
    if (validUpdateData.gpsLatitude)
      updateData.gpsLatitude = parseFloat(validUpdateData.gpsLatitude);
    if (validUpdateData.gpsLongitude)
      updateData.gpsLongitude = parseFloat(validUpdateData.gpsLongitude);

    // Contact fields
    if (validUpdateData.storeManagerName)
      updateData.storeManagerName = validUpdateData.storeManagerName;
    if (validUpdateData.contactNumber)
      updateData.contactNumber = validUpdateData.contactNumber;
    if (validUpdateData.emailAddress)
      updateData.emailAddress = validUpdateData.emailAddress;
    if (validUpdateData.whatsappNumber)
      updateData.whatsappNumber = validUpdateData.whatsappNumber;

    // Status
    if (validUpdateData.storeStatus)
      updateData.storeStatus = validUpdateData.storeStatus;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    console.log(
      `🔄 Processed update data:`,
      JSON.stringify(updateData, null, 2)
    );

    try {
      const store = await prisma.store.update({
        where: {
          id: id as string,
        },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              clientCode: true,
            },
          },
        },
      });

      console.log(`✅ Store updated successfully: ${id}`);

      res.json({
        success: true,
        message: "Store updated successfully",
        data: store,
      });
    } catch (error) {
      console.error(`❌ Error updating store ${id}:`, error);
      throw error;
    }
  }
);

// Delete store
export const deleteStore = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if store exists
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      throw createError("Store not found", 404, "STORE_NOT_FOUND");
    }

    // Delete store record
    await prisma.store.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Store deleted successfully",
      data: { id },
    });
  }
);

// Get stores by client
export const getStoresByClient = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const stores = await prisma.store.findMany({
      where: {
        clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
      orderBy: {
        storeName: "asc",
      },
    });

    res.json({
      success: true,
      data: stores,
    });
  }
);

// Get stores by city
export const getStoresByCity = asyncHandler(
  async (req: Request, res: Response) => {
    const { city } = req.params;

    const stores = await prisma.store.findMany({
      where: {
        city,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
      orderBy: {
        storeName: "asc",
      },
    });

    res.json({
      success: true,
      data: stores,
    });
  }
);

// Get store statistics
export const getStoreStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId, city, storeType, storeStatus } = req.query;

    // Build where clause for filtering
    const where: any = {};
    if (clientId) where.clientId = clientId as string;
    if (city) where.city = city as string;
    if (storeType) where.storeType = storeType as string;
    if (storeStatus) where.storeStatus = storeStatus as string;

    // Get basic counts
    const [
      totalStores,
      activeStores,
      inactiveStores,
      pendingStores,
      storesByType,
      storesByCity,
      storesByClient,
    ] = await Promise.all([
      // Total stores count
      prisma.store.count({ where }),

      // Active stores count
      prisma.store.count({
        where: { ...where, storeStatus: "ACTIVE" },
      }),

      // Inactive stores count
      prisma.store.count({
        where: { ...where, storeStatus: "INACTIVE" },
      }),

      // Pending stores count
      prisma.store.count({
        where: { ...where, storeStatus: "PENDING" },
      }),

      // Stores by type
      prisma.store.groupBy({
        by: ["storeType"],
        where,
        _count: {
          id: true,
        },
      }),

      // Stores by city
      prisma.store.groupBy({
        by: ["city"],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),

      // Stores by client
      prisma.store.groupBy({
        by: ["clientId"],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Get client details for top clients
    const topClients = await Promise.all(
      storesByClient.map(async (item) => {
        const client = await prisma.client.findUnique({
          where: { id: item.clientId },
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        });
        return {
          client,
          storeCount: item._count.id,
        };
      })
    );

    const stats = {
      overview: {
        totalStores,
        activeStores,
        inactiveStores,
        pendingStores,
      },
      distribution: {
        byType: storesByType.map((item) => ({
          storeType: item.storeType,
          count: item._count.id,
        })),
        byCity: storesByCity.map((item) => ({
          city: item.city,
          count: item._count.id,
        })),
        byClient: topClients,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  }
);

// Get all unique cities from stores
export const getStoreCities = asyncHandler(
  async (req: Request, res: Response) => {
    const cities = await prisma.store.findMany({
      select: {
        city: true,
      },
      distinct: ["city"],
      where: {
        city: {
          not: "",
        },
      },
      orderBy: {
        city: "asc",
      },
    });

    res.json({
      success: true,
      data: cities.map((item) => item.city).filter(Boolean),
    });
  }
);
