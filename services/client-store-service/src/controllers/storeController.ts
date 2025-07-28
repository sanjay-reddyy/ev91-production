import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Create a new store
export const createStore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    clientId,
    name,
    address,
    cityId,
    latitude,
    longitude,
    phone,
    email,
    managerName,
    managerPhone,
    managerEmail,
    storeType,
    businessHours,
    deliveryRadius,
    minimumOrderAmount,
    deliveryFee,
    isEVChargingAvailable,
    chargingStationType,
    chargingPower,
    averagePreparationTime,
    peakHours,
    specialInstructions,
    acceptsCash,
    acceptsCard,
    acceptsDigitalPayment,
    commission,
    isActive,
    metadata
  } = req.body;

  // Validate required fields
  if (!clientId || !name || !address || !cityId) {
    throw createError('ClientId, name, address, and cityId are required', 400, 'MISSING_REQUIRED_FIELDS');
  }

  // Verify client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw createError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  const store = await prisma.store.create({
    data: {
      clientId,
      name,
      address,
      cityId,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phone,
      email,
      managerName,
      managerPhone,
      managerEmail,
      storeType,
      businessHours: businessHours || {},
      deliveryRadius: deliveryRadius ? parseFloat(deliveryRadius) : null,
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
      deliveryFee: deliveryFee ? parseFloat(deliveryFee) : null,
      isEVChargingAvailable: isEVChargingAvailable || false,
      chargingStationType,
      chargingPower: chargingPower ? parseFloat(chargingPower) : null,
      averagePreparationTime: averagePreparationTime ? parseInt(averagePreparationTime) : null,
      peakHours: peakHours || {},
      specialInstructions,
      acceptsCash: acceptsCash !== undefined ? acceptsCash : true,
      acceptsCard: acceptsCard !== undefined ? acceptsCard : true,
      acceptsDigitalPayment: acceptsDigitalPayment !== undefined ? acceptsDigitalPayment : true,
      commission: commission ? parseFloat(commission) : null,
      isActive: isActive !== undefined ? isActive : true,
      metadata: metadata || {},
      createdBy: req.user?.id
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Store created successfully',
    data: store
  });
});

// Get all stores with filtering
export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search,
    clientId,
    cityId,
    storeType,
    isActive,
    isEVChargingAvailable,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { address: { contains: search as string, mode: 'insensitive' } },
      { managerName: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  if (clientId) {
    where.clientId = clientId as string;
  }

  if (cityId) {
    where.cityId = cityId as string;
  }

  if (storeType) {
    where.storeType = storeType as string;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (isEVChargingAvailable !== undefined) {
    where.isEVChargingAvailable = isEVChargingAvailable === 'true';
  }

  // Get stores with pagination
  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            riderEarnings: true
          }
        }
      }
    }),
    prisma.store.count({ where })
  ]);

  res.json({
    success: true,
    data: stores,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  });
});

// Get store by ID
export const getStoreById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          businessType: true
        }
      },
      riderEarnings: {
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          riderId: true,
          baseEarning: true,
          bonusEarning: true,
          totalEarning: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          riderEarnings: true
        }
      }
    }
  });

  if (!store) {
    throw createError('Store not found', 404, 'STORE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: store
  });
});

// Update store
export const updateStore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.createdBy;

  // Handle numeric fields
  if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
  if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
  if (updateData.deliveryRadius) updateData.deliveryRadius = parseFloat(updateData.deliveryRadius);
  if (updateData.minimumOrderAmount) updateData.minimumOrderAmount = parseFloat(updateData.minimumOrderAmount);
  if (updateData.deliveryFee) updateData.deliveryFee = parseFloat(updateData.deliveryFee);
  if (updateData.chargingPower) updateData.chargingPower = parseFloat(updateData.chargingPower);
  if (updateData.averagePreparationTime) updateData.averagePreparationTime = parseInt(updateData.averagePreparationTime);
  if (updateData.commission) updateData.commission = parseFloat(updateData.commission);

  // Add update tracking
  updateData.updatedAt = new Date();
  updateData.updatedBy = req.user?.id;

  const store = await prisma.store.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Store updated successfully',
    data: store
  });
});

// Delete store (soft delete)
export const deleteStore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if store has recent earnings
  const recentEarnings = await prisma.riderEarning.count({
    where: {
      storeId: id,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    }
  });

  if (recentEarnings > 0) {
    throw createError(
      'Cannot delete store with recent rider earnings. Please contact administrator.',
      400,
      'STORE_HAS_RECENT_ACTIVITY'
    );
  }

  // Soft delete by setting isActive to false
  const store = await prisma.store.update({
    where: { id },
    data: {
      isActive: false,
      updatedAt: new Date(),
      updatedBy: req.user?.id
    }
  });

  res.json({
    success: true,
    message: 'Store deleted successfully',
    data: store
  });
});

// Get stores by client
export const getStoresByClient = asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  const stores = await prisma.store.findMany({
    where: {
      clientId,
      isActive: true
    },
    include: {
      _count: {
        select: {
          riderEarnings: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: stores
  });
});

// Get stores by city
export const getStoresByCity = asyncHandler(async (req: Request, res: Response) => {
  const { cityId } = req.params;

  const stores = await prisma.store.findMany({
    where: {
      cityId,
      isActive: true
    },
    include: {
      client: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: stores
  });
});

// Get store statistics
export const getStoreStats = asyncHandler(async (req: Request, res: Response) => {
  const { cityId, clientId } = req.query;

  const where: any = {};
  if (cityId) where.cityId = cityId as string;
  if (clientId) where.clientId = clientId as string;

  const [
    totalStores,
    activeStores,
    evChargingStores,
    storeTypeStats
  ] = await Promise.all([
    prisma.store.count({ where }),
    prisma.store.count({ where: { ...where, isActive: true } }),
    prisma.store.count({ where: { ...where, isEVChargingAvailable: true } }),
    prisma.store.groupBy({
      by: ['storeType'],
      where,
      _count: {
        storeType: true
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalStores,
      activeStores,
      inactiveStores: totalStores - activeStores,
      evChargingStores,
      storeTypeDistribution: storeTypeStats.reduce((acc, stat) => {
        acc[stat.storeType || 'Unknown'] = stat._count.storeType;
        return acc;
      }, {} as Record<string, number>)
    }
  });
});
