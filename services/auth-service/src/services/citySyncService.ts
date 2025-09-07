/**
 * City Sync Service
 * For EV91 Platform - Auth Service
 * Handles city synchronization from vehicle service
 */

import { PrismaClient } from "@prisma/client";
import {
  CityEvent,
  CityEventType,
  CityEventData,
  EventProcessResult,
} from "../types/cityEvents";

const prisma = new PrismaClient({
  log: ["query", "warn", "error"],
});

export class CitySyncService {
  /**
   * Process incoming city sync event from vehicle service
   */
  static async processEvent(event: CityEvent): Promise<EventProcessResult> {
    try {
      console.log(
        `🔄 Processing city event: ${event.type} for city ${event.cityId}`
      );

      switch (event.type) {
        case CityEventType.CITY_CREATED:
          return await this.handleCityCreated(event);

        case CityEventType.CITY_UPDATED:
          return await this.handleCityUpdated(event);

        case CityEventType.CITY_ACTIVATED:
        case CityEventType.CITY_DEACTIVATED:
          return await this.handleCityStatusChanged(event);

        case CityEventType.CITY_DELETED:
          return await this.handleCityDeleted(event);

        default:
          return {
            success: false,
            action: "error",
            cityId: event.cityId,
            eventId: event.eventId,
            error: `Unknown event type: ${event.type}`,
          };
      }
    } catch (error) {
      console.error("❌ Error processing city event:", error);
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
   * Handle city creation event
   */
  private static async handleCityCreated(
    event: CityEvent
  ): Promise<EventProcessResult> {
    try {
      const cityData = event.data;

      // Check if city already exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityData.id },
      });

      if (existingCity) {
        console.log(
          `⚠️  City ${cityData.name} (${cityData.id}) already exists, skipping creation`
        );
        return {
          success: true,
          action: "skipped",
          cityId: cityData.id,
          eventId: event.eventId,
          message: "City already exists",
        };
      }

      // Create new city
      const city = await prisma.city.create({
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
          createdAt: cityData.createdAt,
          updatedAt: cityData.updatedAt,
        },
      });

      console.log(
        `✅ City ${cityData.name} (${cityData.id}) created successfully in auth service`
      );

      return {
        success: true,
        action: "created",
        cityId: cityData.id,
        eventId: event.eventId,
        message: `City ${cityData.name} created successfully`,
      };
    } catch (error) {
      console.error("❌ Error creating city:", error);
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
   * Handle city update event
   */
  private static async handleCityUpdated(
    event: CityEvent
  ): Promise<EventProcessResult> {
    try {
      const cityData = event.data;

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityData.id },
      });

      if (!existingCity) {
        console.log(
          `⚠️  City ${cityData.name} (${cityData.id}) does not exist, creating it`
        );
        return await this.handleCityCreated(event);
      }

      // Check if this update is newer than what we have
      if (existingCity.version >= cityData.version) {
        console.log(
          `⚠️  City ${cityData.name} (${cityData.id}) version ${cityData.version} is not newer than existing version ${existingCity.version}, skipping`
        );
        return {
          success: true,
          action: "skipped",
          cityId: cityData.id,
          eventId: event.eventId,
          message: "Update is not newer than existing version",
        };
      }

      // Update city
      const city = await prisma.city.update({
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
        message: `City ${cityData.name} updated successfully`,
      };
    } catch (error) {
      console.error("❌ Error updating city:", error);
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
   * Handle city status change (activation/deactivation)
   */
  private static async handleCityStatusChanged(
    event: CityEvent
  ): Promise<EventProcessResult> {
    try {
      const cityData = event.data;
      const isActivation = event.type === CityEventType.CITY_ACTIVATED;

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityData.id },
      });

      if (!existingCity) {
        console.log(
          `⚠️  City ${cityData.name} (${cityData.id}) does not exist, creating it`
        );
        return await this.handleCityCreated(event);
      }

      // Update city status
      const city = await prisma.city.update({
        where: { id: cityData.id },
        data: {
          isActive: cityData.isActive,
          isOperational: cityData.isOperational,
          version: cityData.version,
          lastModifiedBy: cityData.lastModifiedBy,
          eventSequence: cityData.eventSequence,
          lastSyncAt: new Date(),
          updatedAt: cityData.updatedAt,
        },
      });

      console.log(
        `✅ City ${cityData.name} (${cityData.id}) ${
          isActivation ? "activated" : "deactivated"
        } successfully`
      );

      return {
        success: true,
        action: "updated",
        cityId: cityData.id,
        eventId: event.eventId,
        message: `City ${cityData.name} ${
          isActivation ? "activated" : "deactivated"
        } successfully`,
      };
    } catch (error) {
      console.error("❌ Error updating city status:", error);
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
   * Handle city deletion event
   */
  private static async handleCityDeleted(
    event: CityEvent
  ): Promise<EventProcessResult> {
    try {
      const cityData = event.data;

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: cityData.id },
      });

      if (!existingCity) {
        console.log(
          `⚠️  City ${cityData.name} (${cityData.id}) does not exist, skipping deletion`
        );
        return {
          success: true,
          action: "skipped",
          cityId: cityData.id,
          eventId: event.eventId,
          message: "City does not exist",
        };
      }

      // Soft delete - mark as inactive instead of hard delete
      const city = await prisma.city.update({
        where: { id: cityData.id },
        data: {
          isActive: false,
          isOperational: false,
          version: cityData.version,
          lastModifiedBy: cityData.lastModifiedBy,
          eventSequence: cityData.eventSequence,
          lastSyncAt: new Date(),
          updatedAt: cityData.updatedAt,
        },
      });

      console.log(
        `✅ City ${cityData.name} (${cityData.id}) soft deleted (marked inactive)`
      );

      return {
        success: true,
        action: "updated",
        cityId: cityData.id,
        eventId: event.eventId,
        message: `City ${cityData.name} soft deleted successfully`,
      };
    } catch (error) {
      console.error("❌ Error deleting city:", error);
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

      console.log(`📋 Retrieved ${cities.length} cities from auth service`);
      return cities;
    } catch (error) {
      console.error("❌ Error getting cities:", error);
      throw new Error(`Failed to get cities: ${error}`);
    }
  }

  /**
   * Get sync status for all cities
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

      const lastSyncedCity = await prisma.city.findFirst({
        orderBy: { lastSyncAt: "desc" },
        select: { name: true, lastSyncAt: true },
      });

      return {
        totalCities,
        activeCities,
        operationalCities,
        lastSync: lastSyncedCity?.lastSyncAt || null,
        lastSyncedCity: lastSyncedCity?.name || null,
        service: "auth-service",
      };
    } catch (error) {
      console.error("❌ Error getting sync status:", error);
      throw new Error(`Failed to get sync status: ${error}`);
    }
  }
}
