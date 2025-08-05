/**
 * Hub Service
 * For EV91 Platform - Vehicle Service
 * Handles all hub-related operations
 */

import { prisma } from '../index';
import { 
  Hub, 
  CreateHubRequest, 
  UpdateHubRequest, 
  HubFilters, 
  HubResponse,
  HubWithVehicleCount,
  HubAssignmentRequest 
} from '../types/hub';
import { ErrorHandler, Logger } from '../utils';

export class HubService {
  /**
   * Create a new hub
   */
  static async createHub(data: CreateHubRequest): Promise<Hub> {
    try {
      Logger.info('Creating new hub', { name: data.name, code: data.code });

      // Check if hub with same code already exists
      const existingHub = await prisma.hub.findUnique({
        where: { code: data.code }
      });

      if (existingHub) {
        throw ErrorHandler.createError('Hub with this code already exists', 'HUB_EXISTS', 400);
      }

      // Validate city exists
      const city = await prisma.city.findUnique({
        where: { id: data.cityId }
      });

      if (!city) {
        throw ErrorHandler.createError('City not found', 'CITY_NOT_FOUND', 404);
      }

      const hub = await prisma.hub.create({
        data: {
          ...data,
          hubType: data.hubType || 'Storage',
          hubCategory: data.hubCategory || 'Primary',
          chargingPoints: data.chargingPoints || 0,
          serviceCapacity: data.serviceCapacity || 0,
          is24x7: data.is24x7 || false,
          hasParking: data.hasParking ?? true,
          hasSecurity: data.hasSecurity || false,
          hasCCTV: data.hasCCTV || false,
          hasWashFacility: data.hasWashFacility || false,
          hasChargingStation: data.hasChargingStation || false,
          hasServiceCenter: data.hasServiceCenter || false,
          status: data.status || 'Active',
          isPublicAccess: data.isPublicAccess || false
        }
      });

      Logger.info('Hub created successfully', { hubId: hub.id, hubName: hub.name });
      return hub;
    } catch (error) {
      Logger.error('Error creating hub', error);
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get hub by ID
   */
  static async getHubById(id: string): Promise<Hub | null> {
    try {
      const hub = await prisma.hub.findUnique({
        where: { id },
        include: {
          city: true
        }
      });

      return hub;
    } catch (error) {
      Logger.error('Error fetching hub by ID', { hubId: id, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get hub by code
   */
  static async getHubByCode(code: string): Promise<Hub | null> {
    try {
      const hub = await prisma.hub.findUnique({
        where: { code: code },
        include: {
          city: true
        }
      });

      return hub;
    } catch (error) {
      Logger.error('Error fetching hub by code', { hubCode: code, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get all hubs with optional filters
   */
  static async getHubs(filters: HubFilters = {}): Promise<HubResponse[]> {
    try {
      const {
        cityId,
        hubType,
        hubCategory,
        status,
        hasChargingStation,
        hasServiceCenter,
        is24x7,
        isPublicAccess,
        search,
        nearLocation
      } = filters;

      const whereClause: any = {};

      if (cityId) whereClause.cityId = cityId;
      if (hubType) whereClause.hubType = hubType;
      if (hubCategory) whereClause.hubCategory = hubCategory;
      if (status) whereClause.status = status;
      if (hasChargingStation !== undefined) whereClause.hasChargingStation = hasChargingStation;
      if (hasServiceCenter !== undefined) whereClause.hasServiceCenter = hasServiceCenter;
      if (is24x7 !== undefined) whereClause.is24x7 = is24x7;
      if (isPublicAccess !== undefined) whereClause.isPublicAccess = isPublicAccess;

      if (search) {
        whereClause.OR = [
          { hubName: { contains: search, mode: 'insensitive' } },
          { hubCode: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } }
        ];
      }

      // TODO: Implement nearLocation filter using PostGIS or similar
      // For now, we'll fetch all and filter in memory if nearLocation is provided

      const hubs = await prisma.hub.findMany({
        where: whereClause,
        include: {
          city: {
            select: {
              name: true,
              displayName: true
            }
          },
          _count: {
            select: {
              vehicles: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // Active first
          { name: 'asc' }
        ]
      });

      let filteredHubs = hubs;

      // Filter by location if specified
      if (nearLocation) {
        filteredHubs = hubs.filter((hub: any) => {
          const distance = this.calculateDistance(
            nearLocation.latitude,
            nearLocation.longitude,
            hub.latitude,
            hub.longitude
          );
          return distance <= nearLocation.radius;
        });
      }

      return filteredHubs.map((hub: any) => ({
        id: hub.id,
        name: hub.name,
        code: hub.code,
        cityId: hub.cityId,
        cityName: hub.city.name,
        address: hub.address,
        pinCode: hub.pinCode,
        landmark: hub.landmark,
        latitude: hub.latitude,
        longitude: hub.longitude,
        hubType: hub.hubType,
        hubCategory: hub.hubCategory,
        vehicleCapacity: hub.vehicleCapacity,
        chargingPoints: hub.chargingPoints,
        serviceCapacity: hub.serviceCapacity,
        operatingHours: hub.operatingHours,
        is24x7: hub.is24x7,
        managerName: hub.managerName,
        contactNumber: hub.contactNumber,
        status: hub.status,
        vehicleCount: hub._count.vehicles,
        hasChargingStation: hub.hasChargingStation,
        hasServiceCenter: hub.hasServiceCenter
      }));
    } catch (error) {
      Logger.error('Error fetching hubs', { filters, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get hubs by city ID
   */
  static async getHubsByCity(cityId: string): Promise<HubResponse[]> {
    try {
      return await this.getHubs({ cityId });
    } catch (error) {
      Logger.error('Error fetching hubs by city', { cityId, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get hubs with vehicle counts and details
   */
  static async getHubsWithVehicleCounts(cityId?: string): Promise<HubWithVehicleCount[]> {
    try {
      const whereClause: any = {};
      if (cityId) whereClause.cityId = cityId;

      const hubs = await prisma.hub.findMany({
        where: whereClause,
        include: {
          city: true,
          vehicles: {
            select: {
              id: true,
              operationalStatus: true,
              serviceStatus: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { name: 'asc' }
        ]
      });

      return hubs.map((hub: any) => ({
        ...hub,
        vehicleCount: hub.vehicles.length,
        availableVehicles: hub.vehicles.filter((v: any) => v.operationalStatus === 'Available').length,
        assignedVehicles: hub.vehicles.filter((v: any) => v.operationalStatus === 'Assigned').length,
        maintenanceVehicles: hub.vehicles.filter((v: any) => v.operationalStatus === 'Under Maintenance').length
      }));
    } catch (error) {
      Logger.error('Error fetching hubs with vehicle counts', { cityId, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update hub
   */
  static async updateHub(id: string, data: UpdateHubRequest): Promise<Hub> {
    try {
      Logger.info('Updating hub', { hubId: id });

      // Check if hub exists
      const existingHub = await prisma.hub.findUnique({
        where: { id }
      });

      if (!existingHub) {
        throw ErrorHandler.createError('Hub not found', 'HUB_NOT_FOUND', 404);
      }

      // Check if updating to a code that already exists (excluding current hub)
      if (data.code) {
        const conflictingHub = await prisma.hub.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              { code: data.code }
            ]
          }
        });

        if (conflictingHub) {
          throw ErrorHandler.createError('Hub with this code already exists', 'HUB_EXISTS', 400);
        }
      }

      // Validate city if being updated
      if (data.cityId) {
        const city = await prisma.city.findUnique({
          where: { id: data.cityId }
        });

        if (!city) {
          throw ErrorHandler.createError('City not found', 'CITY_NOT_FOUND', 404);
        }
      }

      const updatedHub = await prisma.hub.update({
        where: { id },
        data
      });

      Logger.info('Hub updated successfully', { hubId: id });
      return updatedHub;
    } catch (error) {
      Logger.error('Error updating hub', { hubId: id, error });
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Delete hub (only if no vehicles are assigned)
   */
  static async deleteHub(id: string): Promise<void> {
    try {
      Logger.info('Deleting hub', { hubId: id });

      // Check if hub exists and has vehicles
      const existingHub = await prisma.hub.findUnique({
        where: { id },
        include: {
          vehicles: true
        }
      });

      if (!existingHub) {
        throw ErrorHandler.createError('Hub not found', 'HUB_NOT_FOUND', 404);
      }

      if (existingHub.vehicles.length > 0) {
        throw ErrorHandler.createError(
          'Cannot delete hub with assigned vehicles', 
          'HUB_HAS_VEHICLES', 
          400
        );
      }

      await prisma.hub.delete({
        where: { id }
      });

      Logger.info('Hub deleted successfully', { hubId: id });
    } catch (error) {
      Logger.error('Error deleting hub', { hubId: id, error });
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Assign vehicle to hub
   */
  static async assignVehicleToHub(assignment: HubAssignmentRequest): Promise<void> {
    try {
      Logger.info('Assigning vehicle to hub', { 
        vehicleId: assignment.vehicleId, 
        hubId: assignment.hubId 
      });

      // Validate hub exists and is active
      const hub = await prisma.hub.findUnique({
        where: { id: assignment.hubId }
      });

      if (!hub) {
        throw ErrorHandler.createError('Hub not found', 'HUB_NOT_FOUND', 404);
      }

      if (hub.status !== 'Active') {
        throw ErrorHandler.createError('Cannot assign vehicle to inactive hub', 'HUB_INACTIVE', 400);
      }

      // Validate vehicle exists
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: assignment.vehicleId }
      });

      if (!vehicle) {
        throw ErrorHandler.createError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
      }

      // Update vehicle hub assignment
      await prisma.vehicle.update({
        where: { id: assignment.vehicleId },
        data: {
          hubId: assignment.hubId
        }
      });

      Logger.info('Vehicle assigned to hub successfully', { 
        vehicleId: assignment.vehicleId, 
        hubId: assignment.hubId 
      });
    } catch (error) {
      Logger.error('Error assigning vehicle to hub', { assignment, error });
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get operational hubs (for dropdowns and selection)
   */
  static async getOperationalHubs(cityId?: string): Promise<HubResponse[]> {
    try {
      const whereClause: any = {
        status: 'Active'
      };

      if (cityId) whereClause.cityId = cityId;

      const hubs = await prisma.hub.findMany({
        where: whereClause,
        include: {
          city: {
            select: {
              name: true,
              displayName: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return hubs.map((hub: any) => ({
        id: hub.id,
        name: hub.name,
        code: hub.code,
        cityId: hub.cityId,
        cityName: hub.city.name,
        address: hub.address,
        pinCode: hub.pinCode,
        landmark: hub.landmark,
        latitude: hub.latitude,
        longitude: hub.longitude,
        hubType: hub.hubType,
        hubCategory: hub.hubCategory,
        vehicleCapacity: hub.vehicleCapacity,
        chargingPoints: hub.chargingPoints,
        serviceCapacity: hub.serviceCapacity,
        operatingHours: hub.operatingHours,
        is24x7: hub.is24x7,
        managerName: hub.managerName,
        contactNumber: hub.contactNumber,
        status: hub.status,
        hasChargingStation: hub.hasChargingStation,
        hasServiceCenter: hub.hasServiceCenter
      }));
    } catch (error) {
      Logger.error('Error fetching operational hubs', { cityId, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
