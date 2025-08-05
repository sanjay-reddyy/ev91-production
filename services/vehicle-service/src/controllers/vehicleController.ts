import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { VehicleService } from '../services';
import { VehicleCreateData, VehicleUpdateData, QueryParams } from '../types';
import { Logger } from '../utils';

// Create new vehicle
export const createVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Vehicle creation request received', { userId: req.user?.id });
  
  const vehicleData: VehicleCreateData = req.body;
  
  try {
    const result = await VehicleService.createVehicle(vehicleData, req.user?.id);
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully with RC and Insurance details',
      data: result
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Get all vehicles with filtering and pagination
export const getVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicles request received', { userId: req.user?.id });
  
  const params: QueryParams = req.query as any;
  
  try {
    const result = await VehicleService.getVehicles(params);
    
    res.json({
      success: true,
      data: result.vehicles,
      pagination: result.pagination
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Get vehicle by ID
export const getVehicleById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicle by ID request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  
  try {
    const vehicle = await VehicleService.getVehicleById(id);
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Update vehicle
export const updateVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Update vehicle request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  const updateData: VehicleUpdateData = req.body;
  
  try {
    const vehicle = await VehicleService.updateVehicle(id, updateData, req.user?.id);
    
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Delete vehicle
export const deleteVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Delete vehicle request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  
  try {
    await VehicleService.deleteVehicle(id);
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Update vehicle status
export const updateVehicleStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Update vehicle status request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  const { operationalStatus, reason } = req.body;
  
  try {
    const vehicle = await VehicleService.updateVehicleStatus(id, operationalStatus, reason, req.user?.id);
    
    res.json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Get vehicle status
export const getVehicleStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicle status request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  
  try {
    const vehicle = await VehicleService.getVehicleById(id);
    
    // Extract only status-related fields
    const statusData = {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      operationalStatus: vehicle.operationalStatus,
      serviceStatus: vehicle.serviceStatus,
      currentRiderId: vehicle.currentRiderId,
      assignmentDate: vehicle.assignmentDate,
      location: vehicle.location,
      mileage: vehicle.mileage,
      updatedAt: vehicle.updatedAt
    };
    
    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Assign vehicle to rider
export const assignVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Assign vehicle request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  const { riderId } = req.body;
  
  try {
    const vehicle = await VehicleService.assignVehicle(id, riderId, req.user?.id);
    
    res.json({
      success: true,
      message: 'Vehicle assigned successfully',
      data: vehicle
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Unassign vehicle from rider
export const unassignVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Unassign vehicle request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  
  try {
    const vehicle = await VehicleService.unassignVehicle(id, req.user?.id);
    
    res.json({
      success: true,
      message: 'Vehicle unassigned successfully',
      data: vehicle
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Get vehicle history (status changes, services, damages)
export const getVehicleHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicle history request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  const { page = 1, limit = 20, type } = req.query;
  
  try {
    const result = await VehicleService.getVehicleHistory(
      id, 
      { 
        page: Number(page), 
        limit: Number(limit), 
        type: type as string 
      }
    );
    
    res.json({
      success: true,
      data: result.history,
      pagination: result.pagination
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Get vehicle stats
export const getVehicleStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicle stats request received', { vehicleId: req.params.id, userId: req.user?.id });
  
  const { id } = req.params;
  
  try {
    const stats = await VehicleService.getVehicleStats(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Get analytics for all vehicles (dashboard stats)
export const getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicle analytics request received', { userId: req.user?.id });
  
  const params: QueryParams = req.query as any;
  
  try {
    // For now, we'll get basic stats from the service
    const result = await VehicleService.getVehicles(params);
    
    // Calculate basic stats
    const stats = {
      totalVehicles: result.pagination.totalItems,
      availableVehicles: 0,
      assignedVehicles: 0,
      underMaintenance: 0,
      retired: 0,
      activeVehicles: 0,
      inactiveVehicles: 0
    };

    result.vehicles.forEach(vehicle => {
      switch (vehicle.operationalStatus) {
        case 'Available':
          stats.availableVehicles++;
          break;
        case 'Assigned':
          stats.assignedVehicles++;
          break;
        case 'Under Maintenance':
          stats.underMaintenance++;
          break;
        case 'Retired':
          stats.retired++;
          break;
      }

      if (vehicle.serviceStatus === 'Active') {
        stats.activeVehicles++;
      } else {
        stats.inactiveVehicles++;
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});
