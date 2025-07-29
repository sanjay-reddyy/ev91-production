import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Helper function to calculate vehicle age
const calculateVehicleAge = (registrationDate: Date, purchaseDate?: Date): number => {
  const referenceDate = purchaseDate || registrationDate;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
};

// Create new vehicle
export const createVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  console.log('🚀 Creating vehicle with data:', JSON.stringify(req.body, null, 2));
  
  const {
    modelId,
    registrationNumber,
    chassisNumber,
    engineNumber,
    variant,
    color,
    year,
    vehicleType,
    batteryType,
    batteryCapacity,
    maxRange,
    maxSpeed,
    purchaseDate,
    registrationDate,
    purchasePrice,
    currentValue,
    fleetOperatorId,
    operationalStatus = 'Available',
    serviceStatus = 'Active',
    location,
    mileage = 0,
    // RC Details
    rcNumber,
    rcExpiryDate,
    ownerName,
    ownerAddress,
    seatingCapacity,
    // Insurance Details
    insuranceNumber,
    insuranceProvider,
    insuranceExpiryDate,
    insuranceType,
    premiumAmount,
    coverageAmount
  } = req.body;

  // Check if registration number already exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { registrationNumber }
  });

  if (existingVehicle) {
    throw createError('Vehicle with this registration number already exists', 409);
  }

  // Validate that model exists
  console.log('🔍 Looking for model with ID:', modelId);
  const vehicleModel = await prisma.vehicleModel.findUnique({
    where: { id: modelId },
    include: { oem: true }
  });

  if (!vehicleModel) {
    console.log('❌ Model not found with ID:', modelId);
    throw createError('Invalid vehicle model ID', 400);
  }
  
  console.log('✅ Found model:', vehicleModel.name);

  // Calculate age
  const registrationDateToUse = registrationDate ? new Date(registrationDate) : new Date();
  const ageInMonths = calculateVehicleAge(registrationDateToUse, purchaseDate ? new Date(purchaseDate) : undefined);

  // Prepare vehicle data, filtering out undefined values
  const vehicleData: any = {
    modelId,
    registrationNumber,
    color,  
    year,
    vehicleType: vehicleType || vehicleModel.vehicleType,
    purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    registrationDate: registrationDateToUse,
    ageInMonths,
    operationalStatus,
    serviceStatus,
    mileage
  };

  // Handle numeric fields with proper conversion
  if (batteryCapacity) {
    vehicleData.batteryCapacity = typeof batteryCapacity === 'string' 
      ? parseFloat(batteryCapacity.replace(/[^\d.]/g, '')) 
      : batteryCapacity;
  } else if (vehicleModel.batteryCapacity) {
    const modelBatteryCapacity = typeof vehicleModel.batteryCapacity === 'string'
      ? parseFloat(vehicleModel.batteryCapacity.replace(/[^\d.]/g, ''))
      : vehicleModel.batteryCapacity;
    if (!isNaN(modelBatteryCapacity)) {
      vehicleData.batteryCapacity = modelBatteryCapacity;
    }
  }

  if (maxRange || vehicleModel.range) {
    vehicleData.maxRange = maxRange || vehicleModel.range;
  }

  if (maxSpeed || vehicleModel.maxSpeed) {
    vehicleData.maxSpeed = maxSpeed || vehicleModel.maxSpeed;
  }

  // Add optional fields only if they have values
  if (chassisNumber) vehicleData.chassisNumber = chassisNumber;
  if (engineNumber) vehicleData.engineNumber = engineNumber;
  if (variant) vehicleData.variant = variant;
  if (batteryType) vehicleData.batteryType = batteryType;
  if (purchasePrice) vehicleData.purchasePrice = purchasePrice;
  if (currentValue) vehicleData.currentValue = currentValue;
  if (fleetOperatorId) vehicleData.fleetOperatorId = fleetOperatorId;
  if (location) vehicleData.location = location;

  // Use transaction to create vehicle with RC and Insurance details
  const result = await prisma.$transaction(async (tx) => {
    // Create the vehicle first
    const vehicle = await tx.vehicle.create({
      data: vehicleData,
      include: {
        model: {
          include: {
            oem: true
          }
        }
      }
    });

    // Create RC Details if provided
    let rcDetails = null;
    if (rcNumber || rcExpiryDate || ownerName || ownerAddress) {
      rcDetails = await tx.rCDetails.create({
        data: {
          vehicleId: vehicle.id,
          rcNumber: rcNumber || registrationNumber, // Use registration number as fallback
          ownerName: ownerName || 'Fleet Owner',
          ownerAddress: ownerAddress || 'Fleet Address',
          registrationDate: registrationDateToUse,
          validUpto: rcExpiryDate ? new Date(rcExpiryDate) : null,
          fuelType: vehicleModel.fuelType || 'Electric',
          seatingCapacity: seatingCapacity || vehicleModel.seatingCapacity || 2
        }
      });
    }

    // Create Insurance Details if provided
    let insuranceDetails = null;
    if (insuranceNumber || insuranceProvider || insuranceExpiryDate) {
      insuranceDetails = await tx.insuranceDetails.create({
        data: {
          vehicleId: vehicle.id,
          insuranceType: insuranceType || 'Comprehensive',
          providerName: insuranceProvider || 'TBD',
          policyNumber: insuranceNumber || 'TBD',
          policyStartDate: new Date(), // Default to current date
          policyEndDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
          premiumAmount: premiumAmount || 0,
          coverageAmount: coverageAmount || 0
        }
      });
    }

    // Create initial status history entry
    await tx.vehicleStatusHistory.create({
      data: {
        vehicleId: vehicle.id,
        newStatus: operationalStatus,
        changeReason: 'Vehicle created',
        changedBy: req.user?.id || 'system'
      }
    });

    // Return vehicle with all related data
    return await tx.vehicle.findUnique({
      where: { id: vehicle.id },
      include: {
        model: {
          include: {
            oem: true
          }
        },
        rcDetails: true,
        insuranceDetails: true,
        statusHistory: true
      }
    });
  });

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully with RC and Insurance details',
    data: result
  });
});

// Get all vehicles with filtering and pagination
export const getVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    oemId,
    modelId,
    operationalStatus,
    serviceStatus,
    assignedRider,
    fleetOperatorId,
    location,
    minAge,
    maxAge,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Build filter conditions
  const where: any = {};
  
  if (oemId || modelId) {
    where.model = {};
    if (oemId) where.model.oemId = oemId;
    if (modelId) where.modelId = modelId;
  }
  
  if (operationalStatus) where.operationalStatus = operationalStatus;
  if (serviceStatus) where.serviceStatus = serviceStatus;
  if (assignedRider) where.currentRiderId = assignedRider;
  if (fleetOperatorId) where.fleetOperatorId = fleetOperatorId;
  if (location) where.location = { contains: location as string, mode: 'insensitive' };
  
  if (minAge || maxAge) {
    where.ageInMonths = {};
    if (minAge) where.ageInMonths.gte = Number(minAge);
    if (maxAge) where.ageInMonths.lte = Number(maxAge);
  }

  // Get total count for pagination
  const total = await prisma.vehicle.count({ where });

  // Get vehicles
  const vehicles = await prisma.vehicle.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy as string]: sortOrder },
    include: {
      model: {
        include: {
          oem: true
        }
      },
      rcDetails: true,
      insuranceDetails: {
        where: { isActive: true },
        orderBy: { policyEndDate: 'desc' },
        take: 1
      },
      serviceHistory: {
        orderBy: { serviceDate: 'desc' },
        take: 1
      },
      damageRecords: {
        where: { resolutionStatus: { not: 'Repaired' } },
        orderBy: { damageDate: 'desc' }
      },
      _count: {
        select: {
          serviceHistory: true,
          damageRecords: true,
          handoverRecords: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: vehicles,
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

// Get vehicle by ID
export const getVehicleById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      model: {
        include: {
          oem: true
        }
      },
      rcDetails: true,
      insuranceDetails: {
        orderBy: { policyEndDate: 'desc' }
      },
      serviceHistory: {
        orderBy: { serviceDate: 'desc' },
        take: 10,
        include: {
          mediaFiles: true
        }
      },
      damageRecords: {
        orderBy: { damageDate: 'desc' },
        take: 10,
        include: {
          mediaFiles: true
        }
      },
      handoverRecords: {
        orderBy: { handoverDate: 'desc' },
        take: 10,
        include: {
          handoverMedia: true
        }
      },
      statusHistory: {
        orderBy: { changeDate: 'desc' },
        take: 20
      },
      mediaFiles: {
        where: { isActive: true },
        orderBy: { uploadDate: 'desc' }
      }
    }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  res.json({
    success: true,
    data: vehicle
  });
});

// Update vehicle
export const updateVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    // Vehicle data
    modelId,
    registrationNumber,
    chassisNumber,
    engineNumber,
    variant,
    color,
    year,
    vehicleType,
    batteryType,
    batteryCapacity,
    maxRange,
    maxSpeed,
    purchaseDate,
    registrationDate,
    purchasePrice,
    currentValue,
    fleetOperatorId,
    operationalStatus,
    serviceStatus,
    location,
    mileage,
    // RC Details
    rcNumber,
    rcExpiryDate,
    ownerName,
    ownerAddress,
    seatingCapacity,
    // Insurance Details
    insuranceNumber,
    insuranceProvider,
    insuranceExpiryDate,
    insuranceType,
    premiumAmount,
    coverageAmount,
    ...otherData
  } = req.body;

  // Check if vehicle exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      rcDetails: true,
      insuranceDetails: true,
      model: true
    }
  });

  if (!existingVehicle) {
    throw createError('Vehicle not found', 404);
  }

  // Prepare vehicle update data
  const vehicleUpdateData: any = { ...otherData };
  
  if (modelId) vehicleUpdateData.modelId = modelId;
  if (registrationNumber) vehicleUpdateData.registrationNumber = registrationNumber;
  if (chassisNumber) vehicleUpdateData.chassisNumber = chassisNumber;
  if (engineNumber) vehicleUpdateData.engineNumber = engineNumber;
  if (variant) vehicleUpdateData.variant = variant;
  if (color) vehicleUpdateData.color = color;
  if (year) vehicleUpdateData.year = year;
  if (vehicleType) vehicleUpdateData.vehicleType = vehicleType;
  if (batteryType) vehicleUpdateData.batteryType = batteryType;
  if (batteryCapacity) vehicleUpdateData.batteryCapacity = batteryCapacity;
  if (maxRange) vehicleUpdateData.maxRange = maxRange;
  if (maxSpeed) vehicleUpdateData.maxSpeed = maxSpeed;
  if (purchaseDate) vehicleUpdateData.purchaseDate = new Date(purchaseDate);
  if (registrationDate) vehicleUpdateData.registrationDate = new Date(registrationDate);
  if (purchasePrice) vehicleUpdateData.purchasePrice = purchasePrice;
  if (currentValue) vehicleUpdateData.currentValue = currentValue;
  if (fleetOperatorId) vehicleUpdateData.fleetOperatorId = fleetOperatorId;
  if (operationalStatus) vehicleUpdateData.operationalStatus = operationalStatus;
  if (serviceStatus) vehicleUpdateData.serviceStatus = serviceStatus;
  if (location) vehicleUpdateData.location = location;
  if (mileage !== undefined) vehicleUpdateData.mileage = mileage;

  // If registration date is being updated, recalculate age
  if (vehicleUpdateData.registrationDate || vehicleUpdateData.purchaseDate) {
    const regDate = vehicleUpdateData.registrationDate || existingVehicle.registrationDate;
    const purDate = vehicleUpdateData.purchaseDate || existingVehicle.purchaseDate;
    vehicleUpdateData.ageInMonths = calculateVehicleAge(regDate, purDate || undefined);
  }

  // Use transaction to update vehicle with RC and Insurance details
  const result = await prisma.$transaction(async (tx) => {
    // Update the vehicle
    const vehicle = await tx.vehicle.update({
      where: { id },
      data: {
        ...vehicleUpdateData,
        updatedAt: new Date()
      }
    });

    // Handle RC Details
    const hasRcData = rcNumber || rcExpiryDate || ownerName || ownerAddress || seatingCapacity;
    if (hasRcData) {
      const rcData: any = {};
      if (rcNumber) rcData.rcNumber = rcNumber;
      if (rcExpiryDate) rcData.validUpto = new Date(rcExpiryDate);
      if (ownerName) rcData.ownerName = ownerName;
      if (ownerAddress) rcData.ownerAddress = ownerAddress;
      if (seatingCapacity) rcData.seatingCapacity = seatingCapacity;
      if (vehicleUpdateData.registrationDate) rcData.registrationDate = vehicleUpdateData.registrationDate;

      if (existingVehicle.rcDetails) {
        // Update existing RC details
        await tx.rCDetails.update({
          where: { vehicleId: id },
          data: rcData
        });
      } else {
        // Create new RC details
        await tx.rCDetails.create({
          data: {
            vehicleId: id,
            rcNumber: rcNumber || existingVehicle.registrationNumber,
            ownerName: ownerName || 'Fleet Owner',
            ownerAddress: ownerAddress || 'Fleet Address',
            registrationDate: vehicleUpdateData.registrationDate || existingVehicle.registrationDate,
            validUpto: rcExpiryDate ? new Date(rcExpiryDate) : null,
            fuelType: existingVehicle.model?.fuelType || 'Electric',
            seatingCapacity: seatingCapacity || existingVehicle.model?.seatingCapacity || 2,
            ...rcData
          }
        });
      }
    }

    // Handle Insurance Details
    const hasInsuranceData = insuranceNumber || insuranceProvider || insuranceExpiryDate || insuranceType || premiumAmount || coverageAmount;
    if (hasInsuranceData) {
      const insuranceData: any = {};
      if (insuranceType) insuranceData.insuranceType = insuranceType;
      if (insuranceProvider) insuranceData.providerName = insuranceProvider;
      if (insuranceNumber) insuranceData.policyNumber = insuranceNumber;
      if (insuranceExpiryDate) insuranceData.policyEndDate = new Date(insuranceExpiryDate);
      if (premiumAmount) insuranceData.premiumAmount = premiumAmount;
      if (coverageAmount) insuranceData.coverageAmount = coverageAmount;

      if (existingVehicle.insuranceDetails && existingVehicle.insuranceDetails.length > 0) {
        // Update the most recent insurance record
        const latestInsurance = existingVehicle.insuranceDetails[0];
        await tx.insuranceDetails.update({
          where: { id: latestInsurance.id },
          data: insuranceData
        });
      } else {
        // Create new insurance details
        await tx.insuranceDetails.create({
          data: {
            vehicleId: id,
            insuranceType: insuranceType || 'Comprehensive',
            providerName: insuranceProvider || 'TBD',
            policyNumber: insuranceNumber || 'TBD',
            policyStartDate: new Date(),
            policyEndDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            premiumAmount: premiumAmount || 0,
            coverageAmount: coverageAmount || 0,
            ...insuranceData
          }
        });
      }
    }

    // Return updated vehicle with all related data
    return await tx.vehicle.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            oem: true
          }
        },
        rcDetails: true,
        insuranceDetails: true,
        statusHistory: {
          orderBy: { changeDate: 'desc' },
          take: 5
        }
      }
    });
  });

  res.json({
    success: true,
    message: 'Vehicle updated successfully with RC and Insurance details',
    data: result
  });
});

// Delete vehicle (soft delete by changing status)
export const deleteVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  // Soft delete by updating status
  await prisma.vehicle.update({
    where: { id },
    data: {
      operationalStatus: 'Retired',
      serviceStatus: 'Inactive',
      currentRiderId: null,
      assignmentDate: null,
      updatedAt: new Date()
    }
  });

  // Add status history entry
  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: id,
      previousStatus: vehicle.operationalStatus,
      newStatus: 'Retired',
      changeReason: 'Vehicle deleted/retired',
      changedBy: req.user?.id || 'system'
    }
  });

  res.json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

// Get vehicle status
export const getVehicleStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      registrationNumber: true,
      operationalStatus: true,
      serviceStatus: true,
      currentRiderId: true,
      assignmentDate: true,
      location: true,
      mileage: true,
      updatedAt: true
    }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  res.json({
    success: true,
    data: vehicle
  });
});

// Update vehicle status
export const updateVehicleStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { operationalStatus, serviceStatus, reason } = req.body;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  const updateData: any = {};
  if (operationalStatus) updateData.operationalStatus = operationalStatus;
  if (serviceStatus) updateData.serviceStatus = serviceStatus;

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: updateData
  });

  // Add status history entry
  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: id,
      previousStatus: vehicle.operationalStatus,
      newStatus: operationalStatus || vehicle.operationalStatus,
      changeReason: reason || 'Status updated',
      changedBy: req.user?.id || 'system'
    }
  });

  res.json({
    success: true,
    message: 'Vehicle status updated successfully',
    data: updatedVehicle
  });
});

// Assign vehicle to rider
export const assignVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { riderId, assignmentNotes } = req.body;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  if (vehicle.operationalStatus !== 'Available') {
    throw createError('Vehicle is not available for assignment', 400);
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      currentRiderId: riderId,
      assignmentDate: new Date(),
      operationalStatus: 'Assigned'
    }
  });

  // Add status history entry
  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: id,
      previousStatus: vehicle.operationalStatus,
      newStatus: 'Assigned',
      changeReason: assignmentNotes || `Assigned to rider ${riderId}`,
      changedBy: req.user?.id || 'system'
    }
  });

  res.json({
    success: true,
    message: 'Vehicle assigned successfully',
    data: updatedVehicle
  });
});

// Unassign vehicle from rider
export const unassignVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      currentRiderId: null,
      assignmentDate: null,
      operationalStatus: 'Available'
    }
  });

  // Add status history entry
  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: id,
      previousStatus: vehicle.operationalStatus,
      newStatus: 'Available',
      changeReason: 'Vehicle unassigned',
      changedBy: req.user?.id || 'system'
    }
  });

  res.json({
    success: true,
    message: 'Vehicle unassigned successfully',
    data: updatedVehicle
  });
});

// Get vehicle history
export const getVehicleHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true, registrationNumber: true }
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  const [statusHistory, serviceHistory, damageHistory, handoverHistory] = await Promise.all([
    prisma.vehicleStatusHistory.findMany({
      where: { vehicleId: id },
      orderBy: { changeDate: 'desc' }
    }),
    prisma.serviceRecord.findMany({
      where: { vehicleId: id },
      orderBy: { serviceDate: 'desc' },
      include: { mediaFiles: true }
    }),
    prisma.damageRecord.findMany({
      where: { vehicleId: id },
      orderBy: { damageDate: 'desc' },
      include: { mediaFiles: true }
    }),
    prisma.handoverRecord.findMany({
      where: { vehicleId: id },
      orderBy: { handoverDate: 'desc' },
      include: { handoverMedia: true }
    })
  ]);

  res.json({
    success: true,
    data: {
      vehicle,
      statusHistory,
      serviceHistory,
      damageHistory,
      handoverHistory
    }
  });
});

// Get vehicle statistics
export const getVehicleStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Get total vehicle count
  const totalVehicles = await prisma.vehicle.count();

  // Get vehicles by operational status
  const vehiclesByStatus = await prisma.vehicle.groupBy({
    by: ['operationalStatus'],
    _count: {
      operationalStatus: true
    }
  });

  // Get vehicles by service status
  const vehiclesByServiceStatus = await prisma.vehicle.groupBy({
    by: ['serviceStatus'],
    _count: {
      serviceStatus: true
    }
  });

  // Get vehicles by OEM/Model
  const vehiclesByModel = await prisma.vehicle.groupBy({
    by: ['modelId'],
    _count: {
      modelId: true
    },
    take: 10,
    orderBy: {
      _count: {
        modelId: 'desc'
      }
    }
  });

  // Get model details for the top models
  const modelIds = vehiclesByModel.map(item => item.modelId);
  const models = await prisma.vehicleModel.findMany({
    where: {
      id: { in: modelIds }
    },
    include: {
      oem: true
    }
  });

  // Map model data to vehicle counts
  const vehiclesByModelWithDetails = vehiclesByModel.map(item => {
    const model = models.find(m => m.id === item.modelId);
    return {
      modelId: item.modelId,
      count: item._count.modelId,
      modelName: model?.displayName || 'Unknown Model',
      oemName: model?.oem?.displayName || 'Unknown OEM'
    };
  });

  // Calculate age distribution
  const vehicles = await prisma.vehicle.findMany({
    select: {
      purchaseDate: true,
      registrationDate: true
    }
  });

  const ageDistribution = {
    'new': 0,        // < 1 year
    'moderate': 0,   // 1-3 years
    'old': 0,        // 3-5 years
    'vintage': 0     // > 5 years
  };

  const currentDate = new Date();
  vehicles.forEach(vehicle => {
    const referenceDate = vehicle.purchaseDate || vehicle.registrationDate;
    if (referenceDate) {
      const ageInYears = (currentDate.getTime() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (ageInYears < 1) ageDistribution.new++;
      else if (ageInYears < 3) ageDistribution.moderate++;
      else if (ageInYears < 5) ageDistribution.old++;
      else ageDistribution.vintage++;
    }
  });

  // Get average mileage
  const mileageStats = await prisma.vehicle.aggregate({
    _avg: {
      mileage: true
    },
    _max: {
      mileage: true
    },
    _min: {
      mileage: true
    }
  });

  const stats = {
    totalVehicles,
    vehiclesByStatus: vehiclesByStatus.reduce((acc, item) => {
      acc[item.operationalStatus] = item._count.operationalStatus;
      return acc;
    }, {} as Record<string, number>),
    vehiclesByServiceStatus: vehiclesByServiceStatus.reduce((acc, item) => {
      acc[item.serviceStatus] = item._count.serviceStatus;
      return acc;
    }, {} as Record<string, number>),
    topModels: vehiclesByModelWithDetails,
    ageDistribution,
    mileageStats: {
      average: Math.round(mileageStats._avg.mileage || 0),
      maximum: mileageStats._max.mileage || 0,
      minimum: mileageStats._min.mileage || 0
    }
  };

  res.json({
    success: true,
    data: stats
  });
});
