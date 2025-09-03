/**
 * City Sync Service
 * For EV91 Platform - Client Store Service
 * Handles synchronization of city data from vehicle service
 */

import { prisma } from "../index";
import {
  AnyCityEvent,
  CityEventType,
  EventProcessResult,
  CityEventData,
} from "../types/cityEvents";

export class CitySyncService {
  /**
   * Handle city created event
   */
  static async handleCityCreated(
    event: AnyCityEvent
  ): Promise<EventProcessResult> {
    try {
      if (event.type !== CityEventType.CITY_CREATED) {
        throw new Error("Invalid event type for city created handler");
      }

      const cityData = event.data as CityEventData;

      // Check if city already exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityData.id },
      });

      if (existingCity) {
        console.log(`🔶 City ${cityData.id} already exists, skipping creation`);
        return {
          success: true,
          action: "skipped",
          cityId: cityData.id,
          eventId: event.eventId,
          message: "City already exists",
        };
      }

      // Create city in local database
      await prisma.city.create({
        data: {
          id: cityData.id,
          name: cityData.name,
          displayName: cityData.displayName,
          code: cityData.code,
          state: cityData.state,
          country: cityData.country,
          timezone: cityData.timezone,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          pinCodeRange: cityData.pinCodeRange,
          regionCode: cityData.regionCode,
          isActive: cityData.isActive,
          isOperational: cityData.isOperational,
          launchDate: cityData.launchDate,
          estimatedPopulation: cityData.estimatedPopulation,
          marketPotential: cityData.marketPotential,
          // Event sourcing fields
          version: cityData.version,
          lastModifiedBy: cityData.lastModifiedBy,
          eventSequence: cityData.eventSequence,
          lastSyncAt: new Date(),
          // Preserve original timestamps
          createdAt: cityData.createdAt,
          updatedAt: cityData.updatedAt,
        },
      });

      console.log(
        `✅ City ${cityData.name} (${cityData.id}) created successfully`
      );

      return {
        success: true,
        action: "created",
        cityId: cityData.id,
        eventId: event.eventId,
        message: `City ${cityData.name} created`,
      };
    } catch (error) {
      console.error("❌ Error handling city created event:", error);
      return {
        success: false,
        action: "error",
        cityId: event.cityId,
        eventId: event.eventId,
        error: String(error),
      };
    }
  }

  /**
   * Handle city updated event
   */
  static async handleCityUpdated(
    event: AnyCityEvent
  ): Promise<EventProcessResult> {
    try {
      if (event.type !== CityEventType.CITY_UPDATED) {
        throw new Error("Invalid event type for city updated handler");
      }

      const cityData = event.data as CityEventData;

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityData.id },
      });

      if (!existingCity) {
        // Create city if it doesn't exist (late sync scenario)
        return await this.handleCityCreated({
          ...event,
          type: CityEventType.CITY_CREATED,
        });
      }

      // Update city with new data
      await prisma.city.update({
        where: { id: cityData.id },
        data: {
          name: cityData.name,
          displayName: cityData.displayName,
          code: cityData.code,
          state: cityData.state,
          country: cityData.country,
          timezone: cityData.timezone,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          pinCodeRange: cityData.pinCodeRange,
          regionCode: cityData.regionCode,
          isActive: cityData.isActive,
          isOperational: cityData.isOperational,
          launchDate: cityData.launchDate,
          estimatedPopulation: cityData.estimatedPopulation,
          marketPotential: cityData.marketPotential,
          // Event sourcing fields
          version: cityData.version,
          lastModifiedBy: cityData.lastModifiedBy,
          eventSequence: cityData.eventSequence,
          lastSyncAt: new Date(),
          updatedAt: cityData.updatedAt,
        },
      });

      console.log(
        `✅ City ${cityData.name} (${cityData.id}) updated successfully`
      );

      return {
        success: true,
        action: "updated",
        cityId: cityData.id,
        eventId: event.eventId,
        message: `City ${cityData.name} updated`,
      };
    } catch (error) {
      console.error("❌ Error handling city updated event:", error);
      return {
        success: false,
        action: "error",
        cityId: event.cityId,
        eventId: event.eventId,
        error: String(error),
      };
    }
  }

  /**
   * Handle city deleted event
   */
  static async handleCityDeleted(
    event: AnyCityEvent
  ): Promise<EventProcessResult> {
    try {
      if (event.type !== CityEventType.CITY_DELETED) {
        throw new Error("Invalid event type for city deleted handler");
      }

      const cityId = event.cityId;

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityId },
      });

      if (!existingCity) {
        console.log(`🔶 City ${cityId} not found, skipping deletion`);
        return {
          success: true,
          action: "skipped",
          cityId,
          eventId: event.eventId,
          message: "City not found",
        };
      }

      // Soft delete city (set as inactive)
      await prisma.city.update({
        where: { id: cityId },
        data: {
          isActive: false,
          isOperational: false,
          lastSyncAt: new Date(),
          eventSequence: event.eventSequence,
          version: event.version,
        },
      });

      console.log(`✅ City ${cityId} deleted (deactivated) successfully`);

      return {
        success: true,
        action: "deleted",
        cityId,
        eventId: event.eventId,
        message: "City deactivated",
      };
    } catch (error) {
      console.error("❌ Error handling city deleted event:", error);
      return {
        success: false,
        action: "error",
        cityId: event.cityId,
        eventId: event.eventId,
        error: String(error),
      };
    }
  }

  /**
   * Handle city status changed event (activated/deactivated)
   */
  static async handleCityStatusChanged(
    event: AnyCityEvent
  ): Promise<EventProcessResult> {
    try {
      const isActivating = event.type === CityEventType.CITY_ACTIVATED;
      const cityId = event.cityId;

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityId },
      });

      if (!existingCity) {
        console.log(`🔶 City ${cityId} not found, skipping status change`);
        return {
          success: true,
          action: "skipped",
          cityId,
          eventId: event.eventId,
          message: "City not found",
        };
      }

      // Update city status
      await prisma.city.update({
        where: { id: cityId },
        data: {
          isActive: isActivating,
          lastSyncAt: new Date(),
          eventSequence: event.eventSequence,
          version: event.version,
        },
      });

      const action = isActivating ? "activated" : "deactivated";
      console.log(`✅ City ${cityId} ${action} successfully`);

      return {
        success: true,
        action: "updated",
        cityId,
        eventId: event.eventId,
        message: `City ${action}`,
      };
    } catch (error) {
      console.error("❌ Error handling city status changed event:", error);
      return {
        success: false,
        action: "error",
        cityId: event.cityId,
        eventId: event.eventId,
        error: String(error),
      };
    }
  }

  /**
   * Get sync status and statistics
   */
  static async getSyncStatus() {
    try {
      const totalCities = await prisma.city.count();
      const activeCities = await prisma.city.count({
        where: { isActive: true },
      });
      const operationalCities = await prisma.city.count({
        where: { isOperational: true },
      });

      // Get recent sync activity
      const recentSyncs = await prisma.city.findMany({
        select: {
          id: true,
          name: true,
          lastSyncAt: true,
          eventSequence: true,
          version: true,
        },
        orderBy: { lastSyncAt: "desc" },
        take: 10,
      });

      return {
        statistics: {
          totalCities,
          activeCities,
          operationalCities,
          lastSyncTime: recentSyncs[0]?.lastSyncAt,
        },
        recentActivity: recentSyncs,
        serviceStatus: "healthy",
      };
    } catch (error) {
      console.error("Error getting sync status:", error);
      return {
        serviceStatus: "error",
        error: String(error),
      };
    }
  }

  /**
   * Manually sync a city from vehicle service
   */
  static async manualSyncCity(cityId: string): Promise<EventProcessResult> {
    try {
      // This would typically call the vehicle service API to get current city data
      // For now, return a placeholder response
      return {
        success: true,
        action: "skipped",
        cityId,
        eventId: `manual-${Date.now()}`,
        message:
          "Manual sync not implemented yet - would call vehicle service API",
      };
    } catch (error) {
      return {
        success: false,
        action: "error",
        cityId,
        eventId: `manual-${Date.now()}`,
        error: String(error),
      };
    }
  }

  /**
   * Get all cities in this service
   */
  static async getAllCities() {
    try {
      const cities = await prisma.city.findMany({
        orderBy: {
          name: "asc",
        },
      });

      console.log(
        `📋 Retrieved ${cities.length} cities from client-store service`
      );
      return cities;
    } catch (error) {
      console.error("❌ Error getting cities:", error);
      throw new Error(`Failed to get cities: ${error}`);
    }
  }
}
