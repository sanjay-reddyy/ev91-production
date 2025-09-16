/**
 * Sync Recovery Service
 * Handles manual sync operations and service recovery
 */

import axios from "axios";
import { EventStore } from "./eventStore";
import { Logger } from "../utils";

export class SyncRecoveryService {
  private static readonly SERVICE_ENDPOINTS = [
    {
      name: "client-store-service",
      url: process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3006",
    },
    {
      name: "rider-service",
      url: process.env.RIDER_SERVICE_URL || "http://localhost:4005",
    },
    {
      name: "auth-service",
      url: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
    },
  ];

  /**
   * Sync all missed events for a specific service
   * Useful when a service comes back online after downtime
   */
  static async syncServiceFromEventLog(serviceName: string): Promise<{
    success: boolean;
    syncedEvents: number;
    errors: string[];
  }> {
    try {
      Logger.info(`🔄 Starting event log sync for ${serviceName}`);

      const service = this.SERVICE_ENDPOINTS.find(
        (s) => s.name === serviceName
      );
      if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      // Get failed/unprocessed events
      const events = await EventStore.getFailedEvents();
      const errors: string[] = [];
      let syncedCount = 0;

      for (const event of events) {
        try {
          // Attempt to sync event to the specific service
          await axios.post(`${service.url}/internal/city-sync`, event, {
            timeout: 5000,
            headers: { "Content-Type": "application/json" },
          });

          await EventStore.markEventProcessed(event.eventId);
          syncedCount++;

          Logger.info(`✅ Synced event ${event.eventId} to ${serviceName}`);
        } catch (error) {
          await EventStore.incrementRetryCount(event.eventId);
          errors.push(`Event ${event.eventId}: ${error}`);
          Logger.error(`❌ Failed to sync event ${event.eventId}:`, error);
        }
      }

      Logger.info(
        `🎉 Sync completed for ${serviceName}: ${syncedCount} events, ${errors.length} errors`
      );

      return {
        success: errors.length === 0,
        syncedEvents: syncedCount,
        errors,
      };
    } catch (error) {
      Logger.error(`❌ Service sync failed for ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Get sync status across all services
   */
  static async getSyncStatus(): Promise<{
    totalEvents: number;
    processedEvents: number;
    pendingEvents: number;
    failedEvents: number;
    serviceStatus: Array<{
      name: string;
      url: string;
      isOnline: boolean;
      lastCheck: Date;
    }>;
  }> {
    // This would query the event log table for statistics
    // Implementation depends on having the database table created
    return {
      totalEvents: 0,
      processedEvents: 0,
      pendingEvents: 0,
      failedEvents: 0,
      serviceStatus: await this.checkServiceHealth(),
    };
  }

  /**
   * Check which services are currently online
   */
  private static async checkServiceHealth(): Promise<
    Array<{
      name: string;
      url: string;
      isOnline: boolean;
      lastCheck: Date;
    }>
  > {
    const results = await Promise.allSettled(
      this.SERVICE_ENDPOINTS.map(async (service) => {
        try {
          await axios.get(`${service.url}/health`, { timeout: 3000 });
          return {
            name: service.name,
            url: service.url,
            isOnline: true,
            lastCheck: new Date(),
          };
        } catch {
          return {
            name: service.name,
            url: service.url,
            isOnline: false,
            lastCheck: new Date(),
          };
        }
      })
    );

    return results.map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : {
            name: this.SERVICE_ENDPOINTS[index].name,
            url: this.SERVICE_ENDPOINTS[index].url,
            isOnline: false,
            lastCheck: new Date(),
          }
    );
  }

  /**
   * Force resync a specific city to all services
   */
  static async resyncCity(cityId: string): Promise<{
    success: boolean;
    serviceSyncResults: Array<{
      service: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      Logger.info(`🔄 Force resyncing city ${cityId}`);

      // Get latest city data from database
      const { CityService } = await import("./cityService");
      const city = await CityService.getCityById(cityId);

      if (!city) {
        throw new Error(`City ${cityId} not found`);
      }

      // Create a sync event
      const syncEvent = {
        type: "city.updated",
        cityId: city.id,
        eventId: `manual-${Date.now()}`,
        timestamp: new Date(),
        version: city.version,
        data: city,
      };

      // Send to all services
      const results = await Promise.allSettled(
        this.SERVICE_ENDPOINTS.map(async (service) => {
          try {
            await axios.post(`${service.url}/internal/city-sync`, syncEvent, {
              timeout: 5000,
              headers: { "Content-Type": "application/json" },
            });
            return { service: service.name, success: true };
          } catch (error) {
            return {
              service: service.name,
              success: false,
              error: String(error),
            };
          }
        })
      );

      const serviceSyncResults = results.map((result, index) =>
        result.status === "fulfilled"
          ? result.value
          : {
              service: this.SERVICE_ENDPOINTS[index].name,
              success: false,
              error: "Promise rejected",
            }
      );

      const allSuccessful = serviceSyncResults.every((r) => r.success);

      Logger.info(
        `${allSuccessful ? "✅" : "⚠️"} City ${cityId} resync completed`
      );

      return {
        success: allSuccessful,
        serviceSyncResults,
      };
    } catch (error) {
      Logger.error(`❌ City resync failed for ${cityId}:`, error);
      throw error;
    }
  }
}
