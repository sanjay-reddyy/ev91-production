import { prisma } from '../index';
import { 
  VehicleCreateData, 
  VehicleUpdateData, 
  VehicleResponse, 
  VehicleStatus,
  QueryParams 
} from '../types';
import { 
  Validator, 
  PaginationHelper, 
  ErrorHandler, 
  Logger,
  CostCalculator,
  DateCalculator 
} from '../utils';
import { PrismaClient, Prisma } from '@prisma/client';

export class VehicleService {
  /**
   * Create a new vehicle with RC and Insurance details
   */
  static async createVehicle(data: VehicleCreateData, userId?: string): Promise<VehicleResponse> {
    Logger.info('Creating vehicle', { registrationNumber: data.registrationNumber });

    // Validation
    if (!Validator.isValidVIN(data.chassisNumber || '')) {
      throw ErrorHandler.handleValidationError('chassisNumber', 'Invalid chassis number format');
    }

    // Check if registration number already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber }
    });

    if (existingVehicle) {
      throw ErrorHandler.createError('Vehicle with this registration number already exists', 'DUPLICATE_RECORD', 409);
    }

    // Validate that model exists
    const vehicleModel = await prisma.vehicleModel.findUnique({
      where: { id: data.modelId },
      include: { oem: true }
    });

    if (!vehicleModel) {
      throw ErrorHandler.handleNotFoundError('Vehicle model');
    }

    // Validate that hub exists and is active (mandatory for vehicle creation)
    if (!data.hubId) {
      throw ErrorHandler.handleValidationError('hubId', 'Hub assignment is mandatory for vehicle creation');
    }

    // TODO: Add hub validation after Prisma client is properly generated
    // const hub = await prisma.hub.findUnique({
    //   where: { id: data.hubId },
    //   include: { city: true }
    // });

    // if (!hub) {
    //   throw ErrorHandler.handleNotFoundError('Hub');
    // }

    // if (hub.status !== 'Active') {
    //   throw ErrorHandler.createError('Cannot assign vehicle to inactive hub', 'HUB_INACTIVE', 400);
    // }

    // Calculate age
    const registrationDateToUse = data.registrationDate ? new Date(data.registrationDate) : new Date();
    const ageInMonths = DateCalculator.calculateVehicleAge(
      registrationDateToUse, 
      data.purchaseDate ? new Date(data.purchaseDate) : undefined
    );

    // Prepare vehicle data
    const vehicleData = this.prepareVehicleData(data, vehicleModel, ageInMonths, registrationDateToUse);

    try {
      // Use transaction to create vehicle with related data
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create the vehicle
        const vehicle = await tx.vehicle.create({
          data: vehicleData,
          include: {
            model: {
              include: { oem: true }
            }
          }
        });

        // Create RC Details if provided
        let rcDetails = null;
        if (this.hasRCData(data)) {
          rcDetails = await this.createRCDetails(tx, vehicle.id, data, registrationDateToUse, vehicleModel);
        }

        // Create Insurance Details if provided
        let insuranceDetails = null;
        if (this.hasInsuranceData(data)) {
          insuranceDetails = await this.createInsuranceDetails(tx, vehicle.id, data);
        }

        // Create initial status history entry
        await tx.vehicleStatusHistory.create({
          data: {
            vehicleId: vehicle.id,
            newStatus: data.operationalStatus || 'Available',
            changeReason: 'Vehicle created',
            changedBy: userId || 'system'
          }
        });

        // Return vehicle with all related data
        return await tx.vehicle.findUnique({
          where: { id: vehicle.id },
          include: {
            model: {
              include: { oem: true }
            },
            rcDetails: true,
            insuranceDetails: true,
            statusHistory: true
          }
        });
      });

      Logger.info('Vehicle created successfully', { vehicleId: result?.id });
      return result as VehicleResponse;
    } catch (error) {
      Logger.error('Failed to create vehicle', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get vehicles with filtering and pagination
   */
  static async getVehicles(params: QueryParams): Promise<{
    vehicles: VehicleResponse[];
    pagination: any;
  }> {
    const { page, limit, skip } = PaginationHelper.sanitizeQueryParams(params);

    // Build filter conditions
    const where = this.buildVehicleFilters(params);

    try {
      // Get total count for pagination
      const total = await prisma.vehicle.count({ where });

      // Get vehicles
      const vehicles = await prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
        include: {
          model: {
            include: { oem: true }
          },
          rcDetails: true,
          insuranceDetails: true,
          statusHistory: {
            orderBy: { changeDate: 'desc' },
            take: 1
          },
          damageRecords: {
            orderBy: { reportedDate: 'desc' }
          }
        }
      });

      const pagination = PaginationHelper.calculatePagination(total, page, limit);

      return { vehicles: vehicles as VehicleResponse[], pagination };
    } catch (error) {
      Logger.error('Failed to fetch vehicles', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getVehicleById(id: string): Promise<VehicleResponse> {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          model: {
            include: { oem: true }
          },
          rcDetails: true,
          insuranceDetails: true,
          statusHistory: {
            orderBy: { changeDate: 'desc' }
          },
          damageRecords: {
            orderBy: { reportedDate: 'desc' }
          },
          serviceHistory: {
            orderBy: { serviceDate: 'desc' },
            take: 5
          }
        }
      });

      if (!vehicle) {
        throw ErrorHandler.handleNotFoundError('Vehicle');
      }

      return vehicle as VehicleResponse;
    } catch (error) {
      Logger.error('Failed to fetch vehicle', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update vehicle
   */
  static async updateVehicle(id: string, data: VehicleUpdateData, userId?: string): Promise<VehicleResponse> {
    try {
      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: { model: true }
      });

      if (!existingVehicle) {
        throw ErrorHandler.handleNotFoundError('Vehicle');
      }

      // Update age if dates changed
      if (data.registrationDate || data.purchaseDate) {
        const regDate = data.registrationDate ? new Date(data.registrationDate) : existingVehicle.registrationDate;
        const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : existingVehicle.purchaseDate;
        data.ageInMonths = DateCalculator.calculateVehicleAge(regDate, purchaseDate || undefined);
      }

      // Convert date strings to Date objects
      const updateData = this.prepareDateFields(data);

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          model: {
            include: { oem: true }
          },
          rcDetails: true,
          insuranceDetails: true,
          statusHistory: {
            orderBy: { changeDate: 'desc' }
          }
        }
      });

      // Create status history if status changed
      if (data.operationalStatus && data.operationalStatus !== existingVehicle.operationalStatus) {
        await this.createStatusHistory(id, existingVehicle.operationalStatus, data.operationalStatus, userId);
      }

      Logger.info('Vehicle updated successfully', { vehicleId: id });
      return vehicle as VehicleResponse;
    } catch (error) {
      Logger.error('Failed to update vehicle', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Delete vehicle
   */
  static async deleteVehicle(id: string): Promise<void> {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id }
      });

      if (!vehicle) {
        throw ErrorHandler.handleNotFoundError('Vehicle');
      }

      await prisma.vehicle.delete({
        where: { id }
      });

      Logger.info('Vehicle deleted successfully', { vehicleId: id });
    } catch (error) {
      Logger.error('Failed to delete vehicle', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update vehicle status
   */
  static async updateVehicleStatus(
    id: string, 
    newStatus: VehicleStatus, 
    changeReason: string,
    userId?: string
  ): Promise<VehicleResponse> {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id }
      });

      if (!vehicle) {
        throw ErrorHandler.handleNotFoundError('Vehicle');
      }

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update vehicle status
        const updatedVehicle = await tx.vehicle.update({
          where: { id },
          data: { 
            operationalStatus: newStatus,
            updatedAt: new Date()
          },
          include: {
            model: {
              include: { oem: true }
            },
            rcDetails: true,
            insuranceDetails: true
          }
        });

        // Create status history entry
        await tx.vehicleStatusHistory.create({
          data: {
            vehicleId: id,
            previousStatus: vehicle.operationalStatus,
            newStatus,
            changeReason,
            changedBy: userId || 'system'
          }
        });

        return updatedVehicle;
      });

      Logger.info('Vehicle status updated', { vehicleId: id, newStatus });
      return result as VehicleResponse;
    } catch (error) {
      Logger.error('Failed to update vehicle status', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  // Private helper methods
  private static prepareVehicleData(data: VehicleCreateData, vehicleModel: any, ageInMonths: number, registrationDate: Date) {
    const vehicleData: any = {
      modelId: data.modelId,
      registrationNumber: data.registrationNumber,
      color: data.color,
      year: data.year,
      vehicleType: data.vehicleType || vehicleModel.vehicleType,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      registrationDate,
      ageInMonths,
      operationalStatus: data.operationalStatus || 'Available',
      serviceStatus: data.serviceStatus || 'Active',
      mileage: data.mileage || 0
    };

    // Handle numeric fields with proper conversion
    if (data.batteryCapacity) {
      vehicleData.batteryCapacity = CostCalculator.parseNumericValue(data.batteryCapacity);
    } else if (vehicleModel.batteryCapacity) {
      vehicleData.batteryCapacity = CostCalculator.parseNumericValue(vehicleModel.batteryCapacity);
    }

    // Add optional fields only if they have values
    const optionalFields = [
      'chassisNumber', 'engineNumber', 'variant', 'batteryType', 
      'maxRange', 'maxSpeed', 'purchasePrice', 'currentValue', 
      'fleetOperatorId', 'location'
    ];

    optionalFields.forEach(field => {
      if (data[field as keyof VehicleCreateData]) {
        vehicleData[field] = data[field as keyof VehicleCreateData];
      }
    });

    return vehicleData;
  }

  private static hasRCData(data: VehicleCreateData): boolean {
    return !!(data.rcNumber || data.rcExpiryDate || data.ownerName || data.ownerAddress);
  }

  private static hasInsuranceData(data: VehicleCreateData): boolean {
    return !!(data.insuranceNumber || data.insuranceProvider || data.insuranceExpiryDate);
  }

  private static async createRCDetails(tx: Prisma.TransactionClient, vehicleId: string, data: VehicleCreateData, registrationDate: Date, vehicleModel: any) {
    return await tx.rCDetails.create({
      data: {
        vehicleId,
        rcNumber: data.rcNumber || data.registrationNumber,
        ownerName: data.ownerName || 'Fleet Owner',
        ownerAddress: data.ownerAddress || 'Fleet Address',
        registrationDate,
        validUpto: data.rcExpiryDate ? new Date(data.rcExpiryDate) : null,
        fuelType: vehicleModel.fuelType || 'Electric',
        seatingCapacity: data.seatingCapacity || vehicleModel.seatingCapacity || 2
      }
    });
  }

  private static async createInsuranceDetails(tx: Prisma.TransactionClient, vehicleId: string, data: VehicleCreateData) {
    return await tx.insuranceDetails.create({
      data: {
        vehicleId,
        insuranceType: data.insuranceType || 'Comprehensive',
        providerName: data.insuranceProvider || 'TBD',
        policyNumber: data.insuranceNumber || 'TBD',
        policyStartDate: new Date(),
        policyEndDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        premiumAmount: data.premiumAmount || 0,
        coverageAmount: data.coverageAmount || 0
      }
    });
  }

  private static buildVehicleFilters(params: QueryParams) {
    const where: any = {};

    if (params.oemId || params.modelId) {
      where.model = {};
      if (params.oemId) where.model.oemId = params.oemId;
      if (params.modelId) where.modelId = params.modelId;
    }

    if (params.operationalStatus) where.operationalStatus = params.operationalStatus;
    if (params.serviceStatus) where.serviceStatus = params.serviceStatus;
    if (params.assignedRider) where.currentRiderId = params.assignedRider;
    if (params.fleetOperatorId) where.fleetOperatorId = params.fleetOperatorId;
    if (params.location) where.location = { contains: params.location, mode: 'insensitive' };

    if (params.minAge || params.maxAge) {
      where.ageInMonths = {};
      if (params.minAge) where.ageInMonths.gte = Number(params.minAge);
      if (params.maxAge) where.ageInMonths.lte = Number(params.maxAge);
    }

    return where;
  }

  private static prepareDateFields(data: VehicleUpdateData) {
    const updateData = { ...data };

    // Convert date strings to Date objects
    const dateFields = ['purchaseDate', 'registrationDate'];
    dateFields.forEach(field => {
      if (updateData[field as keyof VehicleUpdateData]) {
        updateData[field as keyof VehicleUpdateData] = new Date(updateData[field as keyof VehicleUpdateData] as string) as any;
      }
    });

    return updateData;
  }

  /**
   * Assign vehicle to a rider
   */
  static async assignVehicle(id: string, riderId: string, userId?: string): Promise<VehicleResponse> {
    Logger.info('Assigning vehicle', { vehicleId: id, riderId });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError('Vehicle');
    }

    if (vehicle.operationalStatus !== 'Available') {
      throw ErrorHandler.createError('Vehicle is not available for assignment', 'INVALID_OPERATION', 400);
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        operationalStatus: 'Assigned',
        currentRiderId: riderId,
        assignmentDate: new Date()
      },
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

    // Add status history entry
    await this.createStatusHistory(id, 'Available', 'Assigned', userId);

    return updatedVehicle as VehicleResponse;
  }

  /**
   * Unassign vehicle from rider
   */
  static async unassignVehicle(id: string, userId?: string): Promise<VehicleResponse> {
    Logger.info('Unassigning vehicle', { vehicleId: id });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError('Vehicle');
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        operationalStatus: 'Available',
        currentRiderId: null,
        assignmentDate: null
      },
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

    // Add status history entry
    await this.createStatusHistory(id, vehicle.operationalStatus, 'Available', userId);

    return updatedVehicle as VehicleResponse;
  }

  /**
   * Get vehicle history (status changes, services, damages)
   */
  static async getVehicleHistory(id: string, params: { page: number; limit: number; type?: string }) {
    Logger.info('Getting vehicle history', { vehicleId: id, params });

    const { page, limit, type } = params;
    const skip = (page - 1) * limit;

    let history = [];
    let totalCount = 0;

    if (!type || type === 'status') {
      const statusHistory = await prisma.vehicleStatusHistory.findMany({
        where: { vehicleId: id },
        orderBy: { changeDate: 'desc' },
        skip: type ? skip : 0,
        take: type ? limit : 10
      });
      history.push(...statusHistory.map((item: any) => ({ ...item, type: 'status' })));
    }

    if (!type || type === 'service') {
      const serviceHistory = await prisma.serviceRecord.findMany({
        where: { vehicleId: id },
        orderBy: { serviceDate: 'desc' },
        skip: type ? skip : 0,
        take: type ? limit : 10
      });
      history.push(...serviceHistory.map((item: any) => ({ ...item, type: 'service' })));
    }

    if (!type || type === 'damage') {
      const damageHistory = await prisma.damageRecord.findMany({
        where: { vehicleId: id },
        orderBy: { damageDate: 'desc' },
        skip: type ? skip : 0,
        take: type ? limit : 10
      });
      history.push(...damageHistory.map((item: any) => ({ ...item, type: 'damage' })));
    }

    // Sort by date if showing all types
    if (!type) {
      history.sort((a, b) => {
        const dateA = (a as any).changeDate || (a as any).serviceDate || (a as any).damageDate;
        const dateB = (b as any).changeDate || (b as any).serviceDate || (b as any).damageDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      totalCount = history.length;
      history = history.slice(skip, skip + limit);
    } else {
      totalCount = history.length;
    }

    const pagination = PaginationHelper.calculatePagination(page, limit, totalCount);

    return {
      history,
      pagination
    };
  }

  /**
   * Get vehicle statistics
   */
  static async getVehicleStats(id: string) {
    Logger.info('Getting vehicle stats', { vehicleId: id });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            serviceHistory: true,
            damageRecords: true,
            handoverRecords: true
          }
        }
      }
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError('Vehicle');
    }

    // Get total service cost
    const serviceStats = await prisma.serviceRecord.aggregate({
      where: { vehicleId: id },
      _sum: {
        totalCost: true,
        laborCost: true,
        partsCost: true
      },
      _avg: {
        totalCost: true
      }
    });

    // Get damage stats
    const damageStats = await prisma.damageRecord.aggregate({
      where: { vehicleId: id },
      _sum: {
        actualCost: true,
        estimatedCost: true
      },
      _count: {
        id: true
      }
    });

    const stats = {
      vehicle: {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        ageInMonths: vehicle.ageInMonths,
        mileage: vehicle.mileage,
        operationalStatus: vehicle.operationalStatus
      },
      services: {
        totalServices: vehicle._count.serviceHistory,
        totalServiceCost: serviceStats._sum.totalCost || 0,
        averageServiceCost: serviceStats._avg.totalCost || 0,
        totalLaborCost: serviceStats._sum.laborCost || 0,
        totalPartsCost: serviceStats._sum.partsCost || 0
      },
      damages: {
        totalDamages: damageStats._count.id,
        totalDamageCost: damageStats._sum.actualCost || 0,
        estimatedDamageCost: damageStats._sum.estimatedCost || 0
      },
      handovers: {
        totalHandovers: vehicle._count.handoverRecords
      },
      totalMaintenanceCost: (serviceStats._sum.totalCost || 0) + (damageStats._sum.actualCost || 0),
      costPerKm: vehicle.mileage > 0 ? ((serviceStats._sum.totalCost || 0) + (damageStats._sum.actualCost || 0)) / vehicle.mileage : 0
    };

    return stats;
  }

  private static async createStatusHistory(vehicleId: string, previousStatus: string, newStatus: string, userId?: string) {
    await prisma.vehicleStatusHistory.create({
      data: {
        vehicleId,
        previousStatus,
        newStatus,
        changeReason: 'Status updated',
        changedBy: userId || 'system'
      }
    });
  }
}
