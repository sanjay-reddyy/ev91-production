/**
 * City Sync Controller
 * For EV91 Platform - Rider Service
 * Handles city synchronization events from vehicle service
 */

import { Request, Response } from "express";
import { CitySyncService } from "../services/citySyncService";
import { AnyCityEvent, CityEventType } from "../types/cityEvents";

export class CitySyncController {
  /**
   * Handle city synchronization events
   * POST /internal/city-sync
   */
  static async handleCitySync(req: Request, res: Response): Promise<void> {
    try {
      const event: AnyCityEvent = req.body;

      console.log(
        `📥 Received city sync event: ${event.type} for city ${event.cityId}`
      );

      // Validate event structure
      if (!event.type || !event.cityId || !event.eventId) {
        res.status(400).json({
          success: false,
          message: "Invalid event structure",
          error: "Missing required fields: type, cityId, or eventId",
        });
        return;
      }

      // Process the event based on type
      let result;
      switch (event.type) {
        case CityEventType.CITY_CREATED:
          result = await CitySyncService.handleCityCreated(event);
          break;

        case CityEventType.CITY_UPDATED:
          result = await CitySyncService.handleCityUpdated(event);
          break;

        case CityEventType.CITY_DELETED:
          result = await CitySyncService.handleCityDeleted(event);
          break;

        case CityEventType.CITY_ACTIVATED:
        case CityEventType.CITY_DEACTIVATED:
          result = await CitySyncService.handleCityStatusChanged(event);
          break;

        default:
          console.warn(`🔶 Unknown city event type: ${(event as any).type}`);
          res.status(200).json({
            success: true,
            message: "Event type not handled but acknowledged",
            eventId: (event as any).eventId,
          });
          return;
      }

      console.log(`✅ City sync completed for event: ${event.eventId}`);

      res.status(200).json({
        success: true,
        message: "City sync processed successfully",
        eventId: event.eventId,
        result,
      });
    } catch (error) {
      console.error("❌ Error processing city sync event:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error during city sync",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal error",
        eventId: req.body?.eventId,
      });
    }
  }

  /**
   * Get city sync status and statistics
   * GET /internal/city-sync/status
   */
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await CitySyncService.getSyncStatus();

      res.json({
        success: true,
        message: "Sync status retrieved successfully",
        data: status,
      });
    } catch (error) {
      console.error("Error getting sync status:", error);

      res.status(500).json({
        success: false,
        message: "Failed to get sync status",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal error",
      });
    }
  }

  /**
   * Manually trigger city sync for a specific city
   * POST /internal/city-sync/manual/:cityId
   */
  static async manualSync(req: Request, res: Response): Promise<void> {
    try {
      const { cityId } = req.params;

      if (!cityId) {
        res.status(400).json({
          success: false,
          message: "City ID is required",
        });
        return;
      }

      const result = await CitySyncService.manualSyncCity(cityId);

      res.json({
        success: true,
        message: "Manual city sync completed",
        data: result,
      });
    } catch (error) {
      console.error("Error during manual sync:", error);

      res.status(500).json({
        success: false,
        message: "Manual sync failed",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal error",
      });
    }
  }

  /**
   * Get all cities in this service
   */
  static async getCities(req: Request, res: Response): Promise<void> {
    try {
      const cities = await CitySyncService.getAllCities();

      res.json({
        success: true,
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      console.error("Error getting cities:", error);

      res.status(500).json({
        success: false,
        message: "Failed to get cities",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal error",
      });
    }
  }
}
