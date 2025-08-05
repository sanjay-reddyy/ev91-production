import { prisma } from '../index';
import { 
  ServiceRecordCreateData, 
  ServiceRecordUpdateData, 
  ServiceRecordResponse,
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

export class ServiceRecordService {
  /**
   * Create a new service record
   */
  static async createServiceRecord(data: ServiceRecordCreateData, userId?: string): Promise<ServiceRecordResponse> {
    Logger.info('Creating service record', { vehicleId: data.vehicleId });

    // Validate vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId }
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError('Vehicle');
    }

    // Validate costs
    if (data.laborCost && !Validator.isValidCost(data.laborCost)) {
      throw ErrorHandler.handleValidationError('laborCost', 'Invalid labor cost');
    }

    if (data.partsCost && !Validator.isValidCost(data.partsCost)) {
      throw ErrorHandler.handleValidationError('partsCost', 'Invalid parts cost');
    }

    // Calculate total cost if not provided
    const calculatedTotalCost = data.totalCost || CostCalculator.calculateServiceCost(data.laborCost, data.partsCost);

    try {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create service record
        const serviceRecord = await tx.serviceRecord.create({
          data: {
            vehicleId: data.vehicleId,
            serviceType: data.serviceType,
            serviceDate: new Date(data.serviceDate),
            description: data.description,
            issueReported: data.issueReported,
            workPerformed: data.workPerformed || 'Service performed',
            mechanicName: data.mechanicName,
            serviceCenter: data.serviceCenter,
            laborCost: data.laborCost || 0,
            partsCost: data.partsCost || 0,
            totalCost: calculatedTotalCost,
            partsReplaced: data.partsReplaced ? JSON.stringify(data.partsReplaced) : null,
            nextServiceDue: data.nextServiceDue ? new Date(data.nextServiceDue) : null,
            mileageAtService: data.mileageAtService,
            serviceNotes: data.serviceNotes,
            serviceStatus: data.serviceStatus || 'Scheduled'
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
        if (data.mileageAtService && data.mileageAtService > vehicle.mileage) {
          await tx.vehicle.update({
            where: { id: data.vehicleId },
            data: { mileage: data.mileageAtService }
          });
        }

        // Update vehicle status if service is completed
        if (vehicle.operationalStatus === 'Under Maintenance' && serviceRecord.serviceStatus === 'Completed') {
          await tx.vehicle.update({
            where: { id: data.vehicleId },
            data: { operationalStatus: 'Available' }
          });

          // Add status history entry
          await tx.vehicleStatusHistory.create({
            data: {
              vehicleId: data.vehicleId,
              previousStatus: 'Under Maintenance',
              newStatus: 'Available',
              changeReason: 'Service completed',
              changedBy: userId || 'system'
            }
          });
        }

        return serviceRecord;
      });

      Logger.info('Service record created successfully', { serviceRecordId: result.id });
      return result as ServiceRecordResponse;
    } catch (error) {
      Logger.error('Failed to create service record', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get service records with filtering and pagination
   */
  static async getServiceRecords(params: QueryParams): Promise<{
    serviceRecords: ServiceRecordResponse[];
    pagination: any;
  }> {
    const { page, limit, skip } = PaginationHelper.sanitizeQueryParams(params);

    // Build filter conditions
    const where = this.buildServiceRecordFilters(params);

    try {
      // Get total count for pagination
      const total = await prisma.serviceRecord.count({ where });

      // Get service records
      const serviceRecords = await prisma.serviceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [params.sortBy || 'serviceDate']: params.sortOrder || 'desc' },
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

      const pagination = PaginationHelper.calculatePagination(page, limit, total);

      return { serviceRecords: serviceRecords as ServiceRecordResponse[], pagination };
    } catch (error) {
      Logger.error('Failed to fetch service records', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get service record by ID
   */
  static async getServiceRecordById(id: string): Promise<ServiceRecordResponse> {
    try {
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
        throw ErrorHandler.handleNotFoundError('Service record');
      }

      return serviceRecord as ServiceRecordResponse;
    } catch (error) {
      Logger.error('Failed to fetch service record', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update service record
   */
  static async updateServiceRecord(id: string, data: ServiceRecordUpdateData, userId?: string): Promise<ServiceRecordResponse> {
    try {
      // Check if service record exists
      const existingRecord = await prisma.serviceRecord.findUnique({
        where: { id },
        include: { vehicle: true }
      });

      if (!existingRecord) {
        throw ErrorHandler.handleNotFoundError('Service record');
      }

      // Prepare update data
      const updateData = this.prepareServiceRecordUpdateData(data, existingRecord);

      const serviceRecord = await prisma.serviceRecord.update({
        where: { id },
        data: updateData,
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
      if (data.serviceStatus === 'Completed' && existingRecord.vehicle.operationalStatus === 'Under Maintenance') {
        await this.completeServiceAndUpdateVehicleStatus(existingRecord.vehicleId, userId);
      }

      Logger.info('Service record updated successfully', { serviceRecordId: id });
      return serviceRecord as ServiceRecordResponse;
    } catch (error) {
      Logger.error('Failed to update service record', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Schedule upcoming service
   */
  static async scheduleService(data: ServiceRecordCreateData, userId?: string): Promise<ServiceRecordResponse> {
    Logger.info('Scheduling service', { vehicleId: data.vehicleId });

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId }
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError('Vehicle');
    }

    try {
      // Create scheduled service record
      const serviceRecord = await prisma.serviceRecord.create({
        data: {
          vehicleId: data.vehicleId,
          serviceType: data.serviceType,
          serviceDate: new Date(data.scheduledDate || data.serviceDate),
          description: data.description,
          workPerformed: 'Scheduled - not yet performed',
          mechanicName: data.mechanicName,
          serviceCenter: data.serviceCenter,
          totalCost: data.estimatedCost || 0,
          serviceNotes: data.serviceNotes,
          serviceStatus: 'Scheduled'
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

      Logger.info('Service scheduled successfully', { serviceRecordId: serviceRecord.id });
      return serviceRecord as ServiceRecordResponse;
    } catch (error) {
      Logger.error('Failed to schedule service', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Delete service record
   */
  static async deleteServiceRecord(id: string): Promise<void> {
    try {
      const serviceRecord = await prisma.serviceRecord.findUnique({
        where: { id }
      });

      if (!serviceRecord) {
        throw ErrorHandler.handleNotFoundError('Service record');
      }

      await prisma.serviceRecord.delete({
        where: { id }
      });

      Logger.info('Service record deleted successfully', { serviceRecordId: id });
    } catch (error) {
      Logger.error('Failed to delete service record', error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  // Private helper methods
  private static buildServiceRecordFilters(params: QueryParams) {
    const where: any = {};

    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.serviceType) where.serviceType = params.serviceType;
    if (params.serviceStatus) where.serviceStatus = params.serviceStatus;
    if (params.mechanicName) where.mechanicName = { contains: params.mechanicName, mode: 'insensitive' };
    if (params.serviceCenter) where.serviceCenter = { contains: params.serviceCenter, mode: 'insensitive' };

    if (params.startDate || params.endDate) {
      where.serviceDate = {};
      if (params.startDate) where.serviceDate.gte = new Date(params.startDate);
      if (params.endDate) where.serviceDate.lte = new Date(params.endDate);
    }

    return where;
  }

  private static prepareServiceRecordUpdateData(data: ServiceRecordUpdateData, existingRecord: any) {
    const updateData: any = { 
      updatedAt: new Date()
    };

    // Copy basic fields
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.issueReported !== undefined) updateData.issueReported = data.issueReported;
    if (data.workPerformed !== undefined) updateData.workPerformed = data.workPerformed;
    if (data.mechanicName !== undefined) updateData.mechanicName = data.mechanicName;
    if (data.serviceCenter !== undefined) updateData.serviceCenter = data.serviceCenter;
    if (data.mileageAtService !== undefined) updateData.mileageAtService = data.mileageAtService;
    if (data.serviceNotes !== undefined) updateData.serviceNotes = data.serviceNotes;
    if (data.serviceStatus !== undefined) updateData.serviceStatus = data.serviceStatus;

    // Handle cost fields
    if (data.laborCost !== undefined) updateData.laborCost = data.laborCost;
    if (data.partsCost !== undefined) updateData.partsCost = data.partsCost;

    // Recalculate total cost if labor or parts cost changed
    if (data.laborCost !== undefined || data.partsCost !== undefined) {
      const laborCost = data.laborCost ?? existingRecord.laborCost;
      const partsCost = data.partsCost ?? existingRecord.partsCost;
      updateData.totalCost = CostCalculator.calculateServiceCost(laborCost, partsCost);
    } else if (data.totalCost !== undefined) {
      updateData.totalCost = data.totalCost;
    }

    // Handle parts replaced as JSON string (database expects string)
    if (data.partsReplaced !== undefined) {
      updateData.partsReplaced = JSON.stringify(data.partsReplaced);
    }

    // Convert date strings to Date objects
    if (data.serviceDate !== undefined) {
      updateData.serviceDate = new Date(data.serviceDate);
    }
    if (data.nextServiceDue !== undefined) {
      updateData.nextServiceDue = new Date(data.nextServiceDue);
    }

    return updateData;
  }

  private static async completeServiceAndUpdateVehicleStatus(vehicleId: string, userId?: string) {
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
        changedBy: userId || 'system'
      }
    });
  }
}
