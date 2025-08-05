/**
 * Hub Controller
 * For EV91 Platform - Vehicle Service
 * Handles HTTP requests related to hub operations
 */

import { Request, Response } from 'express';
import { HubService } from '../services/hubService';
import { CreateHubRequest, UpdateHubRequest, HubFilters, HubAssignmentRequest } from '../types/hub';
import { ErrorHandler, Logger } from '../utils';

export class HubController {
  /**
   * Create a new hub
   * POST /api/v1/hubs
   */
  static async createHub(req: Request, res: Response): Promise<void> {
    try {
      const hubData: CreateHubRequest = req.body;
      const hub = await HubService.createHub(hubData);
      
      res.status(201).json({
        success: true,
        message: 'Hub created successfully',
        data: hub
      });
    } catch (error) {
      Logger.error('Error in createHub controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Get all hubs with optional filters
   * GET /api/v1/hubs
   */
  static async getHubs(req: Request, res: Response): Promise<void> {
    try {
      const filters: HubFilters = {
        cityId: req.query.cityId as string,
        hubType: req.query.hubType as string,
        hubCategory: req.query.hubCategory as string,
        status: req.query.status as string,
        hasChargingStation: req.query.hasChargingStation ? req.query.hasChargingStation === 'true' : undefined,
        hasServiceCenter: req.query.hasServiceCenter ? req.query.hasServiceCenter === 'true' : undefined,
        is24x7: req.query.is24x7 ? req.query.is24x7 === 'true' : undefined,
        isPublicAccess: req.query.isPublicAccess ? req.query.isPublicAccess === 'true' : undefined,
        search: req.query.search as string
      };

      // Handle location-based filtering
      if (req.query.latitude && req.query.longitude && req.query.radius) {
        filters.nearLocation = {
          latitude: parseFloat(req.query.latitude as string),
          longitude: parseFloat(req.query.longitude as string),
          radius: parseFloat(req.query.radius as string)
        };
      }

      const hubs = await HubService.getHubs(filters);
      
      res.json({
        success: true,
        message: 'Hubs retrieved successfully',
        data: hubs,
        count: hubs.length
      });
    } catch (error) {
      Logger.error('Error in getHubs controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Get hubs by city
   * GET /api/v1/hubs/city/:cityId
   */
  static async getHubsByCity(req: Request, res: Response): Promise<void> {
    try {
      const { cityId } = req.params;
      const hubs = await HubService.getHubsByCity(cityId);
      
      res.json({
        success: true,
        message: 'Hubs retrieved successfully',
        data: hubs,
        count: hubs.length
      });
    } catch (error) {
      Logger.error('Error in getHubsByCity controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Get operational hubs (for dropdowns and vehicle assignment)
   * GET /api/v1/hubs/operational
   */
  static async getOperationalHubs(req: Request, res: Response): Promise<void> {
    try {
      const cityId = req.query.cityId as string;
      const hubs = await HubService.getOperationalHubs(cityId);
      
      res.json({
        success: true,
        message: 'Operational hubs retrieved successfully',
        data: hubs,
        count: hubs.length
      });
    } catch (error) {
      Logger.error('Error in getOperationalHubs controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Get hubs with vehicle counts
   * GET /api/v1/hubs/with-counts
   */
  static async getHubsWithVehicleCounts(req: Request, res: Response): Promise<void> {
    try {
      const cityId = req.query.cityId as string;
      const hubs = await HubService.getHubsWithVehicleCounts(cityId);
      
      res.json({
        success: true,
        message: 'Hubs with vehicle counts retrieved successfully',
        data: hubs,
        count: hubs.length
      });
    } catch (error) {
      Logger.error('Error in getHubsWithVehicleCounts controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Get hub by ID
   * GET /api/v1/hubs/:id
   */
  static async getHubById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const hub = await HubService.getHubById(id);
      
      if (!hub) {
        res.status(404).json({
          success: false,
          message: 'Hub not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Hub retrieved successfully',
        data: hub
      });
    } catch (error) {
      Logger.error('Error in getHubById controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Get hub by code
   * GET /api/v1/hubs/code/:code
   */
  static async getHubByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const hub = await HubService.getHubByCode(code);
      
      if (!hub) {
        res.status(404).json({
          success: false,
          message: 'Hub not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Hub retrieved successfully',
        data: hub
      });
    } catch (error) {
      Logger.error('Error in getHubByCode controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Update hub
   * PUT /api/v1/hubs/:id
   */
  static async updateHub(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateHubRequest = req.body;
      
      const hub = await HubService.updateHub(id, updateData);
      
      res.json({
        success: true,
        message: 'Hub updated successfully',
        data: hub
      });
    } catch (error) {
      Logger.error('Error in updateHub controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Delete hub
   * DELETE /api/v1/hubs/:id
   */
  static async deleteHub(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await HubService.deleteHub(id);
      
      res.json({
        success: true,
        message: 'Hub deleted successfully'
      });
    } catch (error) {
      Logger.error('Error in deleteHub controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }

  /**
   * Assign vehicle to hub
   * POST /api/v1/hubs/assign-vehicle
   */
  static async assignVehicleToHub(req: Request, res: Response): Promise<void> {
    try {
      const assignmentData: HubAssignmentRequest = req.body;
      await HubService.assignVehicleToHub(assignmentData);
      
      res.json({
        success: true,
        message: 'Vehicle assigned to hub successfully'
      });
    } catch (error) {
      Logger.error('Error in assignVehicleToHub controller', error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }
}
