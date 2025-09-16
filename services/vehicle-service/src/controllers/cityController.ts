/**
 * City Controller
 * For EV91 Platform - Vehicle Service
 * Handles HTTP requests related to city operations with event publishing
 */

import { Request, Response } from "express";
import { CityService } from "../services/cityService";
import {
  CreateCityRequest,
  UpdateCityRequest,
  CityFilters,
} from "../types/city";
import { ErrorHandler, Logger } from "../utils";
import { cityEventPublisher } from "../events/cityEventPublisher";
import { EventStore } from "../services/eventStore";

export class CityController {
  /**
   * Create a new city
   * POST /api/v1/cities
   */
  static async createCity(req: Request, res: Response): Promise<void> {
    try {
      const cityData: CreateCityRequest = req.body;
      const city = await CityService.createCity(cityData);

      // Publish city created event
      try {
        // Map city to event data format
        const cityEventData = {
          id: city.id,
          name: city.name,
          displayName: city.displayName,
          code: city.code,
          state: city.state,
          country: city.country,
          timezone: city.timezone,
          latitude: city.latitude,
          longitude: city.longitude,
          pinCodeRange: city.pinCodeRange || undefined,
          regionCode: city.regionCode || undefined,
          isActive: city.isActive,
          isOperational: city.isOperational,
          launchDate: city.launchDate || undefined,
          estimatedPopulation: city.estimatedPopulation || undefined,
          marketPotential: city.marketPotential || undefined,
          version: 1, // Default for new cities
          eventSequence: 0, // Default for new cities
          createdAt: city.createdAt,
          updatedAt: city.updatedAt,
        };

        const cityEvent = cityEventPublisher.createCityCreatedEvent(
          cityEventData,
          "system"
        );

        // Store event persistently for recovery
        await EventStore.storeEvent(cityEvent);

        // Attempt to publish to services
        await cityEventPublisher.publishCityEvent(cityEvent);
        Logger.info(`City created event published for city: ${city.id}`);
      } catch (eventError) {
        Logger.error("Failed to publish city created event", eventError);
        // Don't fail the main operation for event publishing errors
      }

      res.status(201).json({
        success: true,
        message: "City created successfully",
        data: city,
      });
    } catch (error) {
      Logger.error("Error in createCity controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Get all cities with optional filters
   * GET /api/v1/cities
   */
  static async getCities(req: Request, res: Response): Promise<void> {
    try {
      const filters: CityFilters = {
        isActive: req.query.isActive
          ? req.query.isActive === "true"
          : undefined,
        isOperational: req.query.isOperational
          ? req.query.isOperational === "true"
          : undefined,
        state: req.query.state as string,
        regionCode: req.query.regionCode as string,
        marketPotential: req.query.marketPotential
          ? parseFloat(req.query.marketPotential as string)
          : undefined,
        search: req.query.search as string,
      };

      const cities = await CityService.getCities(filters);

      res.json({
        success: true,
        message: "Cities retrieved successfully",
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      Logger.error("Error in getCities controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Get operational cities (for dropdowns)
   * GET /api/v1/cities/operational
   */
  static async getOperationalCities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const cities = await CityService.getOperationalCities();

      res.json({
        success: true,
        message: "Operational cities retrieved successfully",
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      Logger.error("Error in getOperationalCities controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Get cities with hub and vehicle counts
   * GET /api/v1/cities/with-counts
   */
  static async getCitiesWithCounts(req: Request, res: Response): Promise<void> {
    try {
      const cities = await CityService.getCitiesWithCounts();

      res.json({
        success: true,
        message: "Cities with counts retrieved successfully",
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      Logger.error("Error in getCitiesWithCounts controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Get city by ID
   * GET /api/v1/cities/:id
   */
  static async getCityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const city = await CityService.getCityById(id);

      if (!city) {
        res.status(404).json({
          success: false,
          message: "City not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "City retrieved successfully",
        data: city,
      });
    } catch (error) {
      Logger.error("Error in getCityById controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Get city by code
   * GET /api/v1/cities/code/:code
   */
  static async getCityByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const city = await CityService.getCityByCode(code);

      if (!city) {
        res.status(404).json({
          success: false,
          message: "City not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "City retrieved successfully",
        data: city,
      });
    } catch (error) {
      Logger.error("Error in getCityByCode controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Update city
   * PUT /api/v1/cities/:id
   */
  static async updateCity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateCityRequest = req.body;

      const city = await CityService.updateCity(id, updateData);

      // Publish city updated event
      try {
        // Map city to event data format
        const cityEventData = {
          id: city.id,
          name: city.name,
          displayName: city.displayName,
          code: city.code,
          state: city.state,
          country: city.country,
          timezone: city.timezone,
          latitude: city.latitude,
          longitude: city.longitude,
          pinCodeRange: city.pinCodeRange || undefined,
          regionCode: city.regionCode || undefined,
          isActive: city.isActive,
          isOperational: city.isOperational,
          launchDate: city.launchDate || undefined,
          estimatedPopulation: city.estimatedPopulation || undefined,
          marketPotential: city.marketPotential || undefined,
          version: 1, // TODO: Increment from previous version
          eventSequence: 1, // TODO: Increment from previous sequence
          createdAt: city.createdAt,
          updatedAt: city.updatedAt,
        };

        // Create changes array - simplified for now
        const changes = Object.keys(updateData).map((field) => ({
          field,
          oldValue: "unknown", // TODO: Get from before update
          newValue: (city as any)[field],
        }));

        const cityEvent = cityEventPublisher.createCityUpdatedEvent(
          cityEventData,
          changes,
          "system"
        );

        // Store event persistently for recovery
        await EventStore.storeEvent(cityEvent);

        // Attempt to publish to services
        await cityEventPublisher.publishCityEvent(cityEvent);
        Logger.info(`City updated event published for city: ${city.id}`);
      } catch (eventError) {
        Logger.error("Failed to publish city updated event", eventError);
        // Don't fail the main operation for event publishing errors
      }

      res.json({
        success: true,
        message: "City updated successfully",
        data: city,
      });
    } catch (error) {
      Logger.error("Error in updateCity controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  /**
   * Delete city (soft delete)
   * DELETE /api/v1/cities/:id
   */
  static async deleteCity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get city details before deletion for event publishing
      const cityBeforeDelete = await CityService.getCityById(id);

      if (!cityBeforeDelete) {
        res.status(404).json({
          success: false,
          message: "City not found",
        });
        return;
      }

      await CityService.deleteCity(id);

      // Publish city deleted event
      try {
        const cityEvent = cityEventPublisher.createCityDeletedEvent(
          cityBeforeDelete.id,
          cityBeforeDelete.name,
          cityBeforeDelete.code,
          1, // TODO: Get actual version
          "system"
        );
        await cityEventPublisher.publishCityEvent(cityEvent);
        Logger.info(
          `City deleted event published for city: ${cityBeforeDelete.id}`
        );
      } catch (eventError) {
        Logger.error("Failed to publish city deleted event", eventError);
        // Don't fail the main operation for event publishing errors
      }

      res.json({
        success: true,
        message: "City deleted successfully",
      });
    } catch (error) {
      Logger.error("Error in deleteCity controller", error);
      if ((error as any).error) {
        const err = (error as any).error;
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
          error: err,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }
}
