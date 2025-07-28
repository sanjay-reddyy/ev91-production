import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Create new service record
export const createServiceRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    vehicleId,
    serviceType,
    serviceDate,
    description,
    issueReported,
    workPerformed,
    mechanicName,
    serviceCenter,
    laborCost = 0,
    partsCost = 0,
    totalCost,
    partsReplaced,
    nextServiceDue,
    mileageAtService,
    serviceNotes
  } = req.body;

  // Check if vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  // Calculate total cost if not provided
  const calculatedTotalCost = totalCost || (laborCost + partsCost);

  const serviceRecord = await prisma.serviceRecord.create({
    data: {
      vehicleId,
      serviceType,
      serviceDate: new Date(serviceDate),
      description,
      issueReported,
      workPerformed,
      mechanicName,
      serviceCenter,
      laborCost,
      partsCost,
      totalCost: calculatedTotalCost,
      partsReplaced: partsReplaced ? JSON.stringify(partsReplaced) : null,
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      mileageAtService,
      serviceNotes
    },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Update vehicle mileage if provided
  if (mileageAtService && mileageAtService > vehicle.mileage) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { mileage: mileageAtService }
    });
  }

  // Update vehicle status if it was under maintenance
  if (vehicle.operationalStatus === 'Under Maintenance' && serviceRecord.serviceStatus === 'Completed') {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { operationalStatus: 'Available' }
    });

    // Add status history entry
    await prisma.vehicleStatusHistory.create({
      data: {
        vehicleId,
        previousStatus: 'Under Maintenance',
        newStatus: 'Available',
        changeReason: 'Service completed',
        changedBy: req.user?.id || 'system'
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Service record created successfully',
    data: serviceRecord
  });
});

// Get service records with filtering and pagination
export const getServiceRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    vehicleId,
    serviceType,
    serviceStatus,
    mechanicName,
    serviceCenter,
    startDate,
    endDate,
    sortBy = 'serviceDate',
    sortOrder = 'desc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Build filter conditions
  const where: any = {};
  
  if (vehicleId) where.vehicleId = vehicleId;
  if (serviceType) where.serviceType = serviceType;
  if (serviceStatus) where.serviceStatus = serviceStatus;
  if (mechanicName) where.mechanicName = { contains: mechanicName as string, mode: 'insensitive' };
  if (serviceCenter) where.serviceCenter = { contains: serviceCenter as string, mode: 'insensitive' };
  
  if (startDate || endDate) {
    where.serviceDate = {};
    if (startDate) where.serviceDate.gte = new Date(startDate as string);
    if (endDate) where.serviceDate.lte = new Date(endDate as string);
  }

  // Get total count for pagination
  const total = await prisma.serviceRecord.count({ where });

  // Get service records
  const serviceRecords = await prisma.serviceRecord.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy as string]: sortOrder },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          },
          operationalStatus: true
        }
      },
      mediaFiles: true
    }
  });

  res.json({
    success: true,
    data: serviceRecords,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / take),
      totalItems: total,
      itemsPerPage: take,
      hasNextPage: skip + take < total,
      hasPreviousPage: Number(page) > 1
    }
  });
});

// Get service record by ID
export const getServiceRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const serviceRecord = await prisma.serviceRecord.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          },
          operationalStatus: true,
          mileage: true
        }
      },
      mediaFiles: {
        orderBy: { uploadDate: 'desc' }
      }
    }
  });

  if (!serviceRecord) {
    throw createError('Service record not found', 404);
  }

  res.json({
    success: true,
    data: serviceRecord
  });
});

// Update service record
export const updateServiceRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if service record exists
  const existingRecord = await prisma.serviceRecord.findUnique({
    where: { id },
    include: { vehicle: true }
  });

  if (!existingRecord) {
    throw createError('Service record not found', 404);
  }

  // Recalculate total cost if labor or parts cost changed
  if (updateData.laborCost !== undefined || updateData.partsCost !== undefined) {
    const laborCost = updateData.laborCost ?? existingRecord.laborCost;
    const partsCost = updateData.partsCost ?? existingRecord.partsCost;
    updateData.totalCost = laborCost + partsCost;
  }

  // Handle parts replaced as JSON
  if (updateData.partsReplaced) {
    updateData.partsReplaced = JSON.stringify(updateData.partsReplaced);
  }

  // Convert date strings to Date objects
  if (updateData.serviceDate) {
    updateData.serviceDate = new Date(updateData.serviceDate);
  }
  if (updateData.nextServiceDue) {
    updateData.nextServiceDue = new Date(updateData.nextServiceDue);
  }

  const serviceRecord = await prisma.serviceRecord.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      mediaFiles: true
    }
  });

  // If service is marked as completed and vehicle was under maintenance, update vehicle status
  if (updateData.serviceStatus === 'Completed' && existingRecord.vehicle.operationalStatus === 'Under Maintenance') {
    await prisma.vehicle.update({
      where: { id: existingRecord.vehicleId },
      data: { operationalStatus: 'Available' }
    });

    // Add status history entry
    await prisma.vehicleStatusHistory.create({
      data: {
        vehicleId: existingRecord.vehicleId,
        previousStatus: 'Under Maintenance',
        newStatus: 'Available',
        changeReason: 'Service completed',
        changedBy: req.user?.id || 'system'
      }
    });
  }

  res.json({
    success: true,
    message: 'Service record updated successfully',
    data: serviceRecord
  });
});

// Schedule upcoming service
export const scheduleService = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    vehicleId,
    serviceType,
    scheduledDate,
    description,
    mechanicName,
    serviceCenter,
    estimatedCost,
    serviceNotes
  } = req.body;

  // Check if vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  // Create scheduled service record
  const serviceRecord = await prisma.serviceRecord.create({
    data: {
      vehicleId,
      serviceType,
      serviceDate: new Date(scheduledDate),
      description,
      workPerformed: 'Scheduled - not yet performed',
      mechanicName,
      serviceCenter,
      totalCost: estimatedCost || 0,
      serviceStatus: 'Scheduled',
      serviceNotes
    },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Service scheduled successfully',
    data: serviceRecord
  });
});

// Get upcoming services
export const getUpcomingServices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { days = 30 } = req.query;
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Number(days));

  const upcomingServices = await prisma.serviceRecord.findMany({
    where: {
      serviceStatus: 'Scheduled',
      serviceDate: {
        gte: new Date(),
        lte: futureDate
      }
    },
    orderBy: { serviceDate: 'asc' },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          },
          operationalStatus: true,
          location: true
        }
      }
    }
  });

  // Also get vehicles that need service based on mileage or time
  const vehiclesNeedingService = await prisma.vehicle.findMany({
    where: {
      operationalStatus: { in: ['Available', 'Assigned'] },
      serviceStatus: 'Active'
    },
    include: {
      serviceHistory: {
        orderBy: { serviceDate: 'desc' },
        take: 1
      }
    }
  });

  // Filter vehicles that need preventive service (example: every 3000 km or 3 months)
  const vehiclesNeedingPreventiveService = vehiclesNeedingService.filter((vehicle: any) => {
    const lastService = vehicle.serviceHistory[0];
    if (!lastService) return true; // Never serviced
    
    const daysSinceLastService = Math.floor((Date.now() - lastService.serviceDate.getTime()) / (1000 * 60 * 60 * 24));
    const mileageSinceLastService = vehicle.mileage - (lastService.mileageAtService || 0);
    
    return daysSinceLastService > 90 || mileageSinceLastService > 3000; // 3 months or 3000 km
  });

  res.json({
    success: true,
    data: {
      scheduledServices: upcomingServices,
      vehiclesNeedingService: vehiclesNeedingPreventiveService.map((v: any) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        oemType: v.model?.oem?.name || 'Unknown',
        vehicleModel: v.model?.name || 'Unknown',
        mileage: v.mileage,
        lastServiceDate: v.serviceHistory[0]?.serviceDate || null,
        daysSinceLastService: v.serviceHistory[0] 
          ? Math.floor((Date.now() - v.serviceHistory[0].serviceDate.getTime()) / (1000 * 60 * 60 * 24))
          : null
      })),
      summary: {
        totalScheduled: upcomingServices.length,
        vehiclesNeedingService: vehiclesNeedingPreventiveService.length,
        daysAhead: Number(days)
      }
    }
  });
});

// Get service analytics
export const getServiceAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { period = 'month' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  // Get service records in the period
  const serviceRecords = await prisma.serviceRecord.findMany({
    where: {
      serviceDate: {
        gte: startDate,
        lte: now
      }
    },
    include: {
      vehicle: {
        select: {
          id: true,
          model: {
            select: {
              name: true,
              oem: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Calculate analytics
  const analytics = {
    period: period as string,
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    },
    totalServices: serviceRecords.length,
    servicesByType: {
      Preventive: serviceRecords.filter((s: any) => s.serviceType === 'Preventive').length,
      Corrective: serviceRecords.filter((s: any) => s.serviceType === 'Corrective').length,
      Emergency: serviceRecords.filter((s: any) => s.serviceType === 'Emergency').length
    },
    servicesByStatus: {
      Completed: serviceRecords.filter((s: any) => s.serviceStatus === 'Completed').length,
      'In Progress': serviceRecords.filter((s: any) => s.serviceStatus === 'In Progress').length,
      Scheduled: serviceRecords.filter((s: any) => s.serviceStatus === 'Scheduled').length,
      Cancelled: serviceRecords.filter((s: any) => s.serviceStatus === 'Cancelled').length
    },
    costs: {
      totalCost: serviceRecords.reduce((sum: number, s: any) => sum + s.totalCost, 0),
      averageCost: serviceRecords.length ? serviceRecords.reduce((sum: number, s: any) => sum + s.totalCost, 0) / serviceRecords.length : 0,
      laborCosts: serviceRecords.reduce((sum: number, s: any) => sum + s.laborCost, 0),
      partsCosts: serviceRecords.reduce((sum: number, s: any) => sum + s.partsCost, 0)
    },
    vehicleBreakdown: serviceRecords.reduce((acc: any, service: any) => {
      const key = `${service.vehicle.model?.oem?.name || 'Unknown'} ${service.vehicle.model?.name || 'Unknown'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    averageServiceTime: {
      // This would need actual completion time tracking
      // For now, return placeholder
      Preventive: 2.5, // hours
      Corrective: 4.0,
      Emergency: 1.5
    }
  };

  res.json({
    success: true,
    data: analytics
  });
});
