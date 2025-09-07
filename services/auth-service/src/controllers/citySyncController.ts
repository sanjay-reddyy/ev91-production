/**
 * City Sync Controller
 * For EV91 Platform - Auth Service
 * Handles incoming city synchronization events
 */

import { Request, Response } from "express";
import { CitySyncService } from "../services/citySyncService";
import { CityEvent, CityEventType } from "../types/cityEvents";

export class CitySyncController {
  /**
   * Handle incoming city sync event from vehicle service
   */
  static async handleCitySync(req: Request, res: Response): Promise<void> {
    try {
      const event: CityEvent = req.body;

      // Validate event structure
      if (!event.eventId || !event.type || !event.cityId || !event.data) {
        res.status(400).json({
          success: false,
          message: "Invalid event structure",
          required: ["eventId", "type", "cityId", "data"],
        });
        return;
      }

      // Validate event type
      if (!Object.values(CityEventType).includes(event.type)) {
        res.status(400).json({
          success: false,
          message: "Invalid event type",
          allowedTypes: Object.values(CityEventType),
        });
        return;
      }

      console.log(
        `🔄 Auth Service received city sync event: ${event.type} for city ${event.cityId}`
      );

      // Process the event
      let result;
      switch (event.type) {
        case CityEventType.CITY_CREATED:
          result = await CitySyncService.processEvent(event);
          break;

        case CityEventType.CITY_UPDATED:
          result = await CitySyncService.processEvent(event);
          break;

        case CityEventType.CITY_ACTIVATED:
        case CityEventType.CITY_DEACTIVATED:
          result = await CitySyncService.processEvent(event);
          break;

        case CityEventType.CITY_DELETED:
          result = await CitySyncService.processEvent(event);
          break;

        default:
          console.warn(`🔶 Unknown city event type: ${event.type}`);
          res.status(200).json({
            success: true,
            message: "Event type not handled but acknowledged",
            eventId: event.eventId,
          });
          return;
      }

      console.log(`✅ City sync completed for event: ${event.eventId}`);

      res.status(200).json({
        success: true,
        message: "City sync completed",
        eventId: event.eventId,
        result,
      });
    } catch (error) {
      console.error("❌ Error handling city sync:", error);

      res.status(500).json({
        success: false,
        message: "City sync failed",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal error",
      });
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await CitySyncService.getSyncStatus();

      res.json({
        success: true,
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
   * Manually sync a city
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
