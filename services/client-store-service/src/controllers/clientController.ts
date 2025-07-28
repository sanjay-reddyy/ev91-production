import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Create a new client
export const createClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    clientCode,
    clientType,
    name,
    primaryContactPerson,
    email,
    phone,
    gstNumber,
    city,
    state,
    businessSize,
    baseOrderRate,
    bulkBonusEnabled,
    weeklyBonusEnabled,
    clientStatus,
    clientPriority
  } = req.body;

  // Validate required fields
  if (!clientCode || !clientType || !name || !baseOrderRate) {
    throw createError('Client code, type, name, and base order rate are required', 400, 'MISSING_REQUIRED_FIELDS');
  }

  // Check if client already exists
  const existingClient = await prisma.client.findFirst({
    where: { 
      OR: [
        { clientCode },
        { email: email || undefined }
      ]
    }
  });

  if (existingClient) {
    throw createError('Client with this code or email already exists', 409, 'CLIENT_EXISTS');
  }

  const client = await prisma.client.create({
    data: {
      clientCode,
      clientType,
      name,
      primaryContactPerson,
      email,
      phone,
      gstNumber,
      // city,
      // state,
      businessSize,
      baseOrderRate: parseFloat(baseOrderRate.toString()),
      bulkBonusEnabled: bulkBonusEnabled !== undefined ? bulkBonusEnabled : false,
      weeklyBonusEnabled: weeklyBonusEnabled !== undefined ? weeklyBonusEnabled : false,
      clientStatus: clientStatus || 'active',
      clientPriority: clientPriority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      stores: {
        select: {
          id: true,
          storeName: true,
          storeStatus: true
        }
      },
      _count: {
        select: {
          stores: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    data: client
  });
});

// Get all clients with filtering
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search,
    city,
    clientType,
    clientStatus,
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
      { email: { contains: search as string, mode: 'insensitive' } },
      { primaryContactPerson: { contains: search as string, mode: 'insensitive' } },
      { clientCode: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  if (city) {
    where.city = { contains: city as string, mode: 'insensitive' };
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
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      include: {
        stores: {
          select: {
            id: true,
            storeName: true,
            storeStatus: true
          }
        },
        _count: {
          select: {
            stores: true
          }
        }
      }
    }),
    prisma.client.count({ where })
  ]);

  res.json({
    success: true,
    data: clients,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  });
});

// Get client by ID
export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      stores: {
        include: {
          _count: {
            select: {
              riderEarnings: true
            }
          }
        }
      },
      _count: {
        select: {
          stores: true
        }
      }
    }
  });

  if (!client) {
    throw createError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: client
  });
});

// Update client
export const updateClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData.createdAt;

  // Handle numeric fields
  if (updateData.baseOrderRate) {
    updateData.baseOrderRate = parseFloat(updateData.baseOrderRate.toString());
  }

  // Add update tracking
  updateData.updatedAt = new Date();

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
    include: {
      stores: {
        select: {
          id: true,
          storeName: true,
          storeStatus: true
        }
      },
      _count: {
        select: {
          stores: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Client updated successfully',
    data: client
  });
});

// Delete client (soft delete)
export const deleteClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if client has active stores
  const activeStores = await prisma.store.count({
    where: {
      clientId: id,
      storeStatus: 'Active'
    }
  });

  if (activeStores > 0) {
    throw createError(
      'Cannot delete client with active stores. Please deactivate all stores first.',
      400,
      'CLIENT_HAS_ACTIVE_STORES'
    );
  }

  // Soft delete by setting clientStatus to inactive
  const client = await prisma.client.update({
    where: { id },
    data: {
      clientStatus: 'inactive',
      updatedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Client deleted successfully',
    data: client
  });
});

// Get clients by city
export const getClientsByCity = asyncHandler(async (req: Request, res: Response) => {
  const { city } = req.params;

  const clients = await prisma.client.findMany({
    // where: {
    //   city: { contains: city, mode: 'insensitive' },
    //   clientStatus: 'active'
    // },
    include: {
      _count: {
        select: {
          stores: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: clients
  });
});

// Get client statistics
export const getClientStats = asyncHandler(async (req: Request, res: Response) => {
  const { city } = req.query;

  const where: any = {};
  if (city) {
    where.city = { contains: city as string, mode: 'insensitive' };
  }

  const [totalClients, activeClients, typeStats] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.count({ where: { ...where, clientStatus: 'active' } }),
    prisma.client.groupBy({
      by: ['clientType'],
      where,
      _count: {
        clientType: true
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients,
      businessTypeDistribution: typeStats.reduce((acc, stat) => {
        acc[stat.clientType || 'Unknown'] = stat._count.clientType;
        return acc;
      }, {} as Record<string, number>)
    }
  });
});
