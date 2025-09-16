/**
 * Sync Recovery Controller
 * Admin endpoints for managing service synchronization
 */

import { Request, Response } from "express";
import { SyncRecoveryService } from "../services/syncRecoveryService";
import { Logger } from "../utils";

export class SyncRecoveryController {
  /**
   * Get overall sync status across all services
   * GET /admin/sync/status
   */
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await SyncRecoveryService.getSyncStatus();

      res.json({
        success: true,
        data: status,
        timestamp: new Date(),
      });
    } catch (error) {
      Logger.error("Error getting sync status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sync status",
        error: String(error),
      });
    }
  }

  /**
   * Manually sync a specific service from event log
   * POST /admin/sync/service/:serviceName
   */
  static async syncService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;

      Logger.info(`📞 Manual sync request for service: ${serviceName}`);

      const result =
        await SyncRecoveryService.syncServiceFromEventLog(serviceName);

      res.json({
        success: result.success,
        message: `Sync completed for ${serviceName}`,
        data: result,
      });
    } catch (error) {
      Logger.error(`Error syncing service ${req.params.serviceName}:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to sync service ${req.params.serviceName}`,
        error: String(error),
      });
    }
  }

  /**
   * Force resync a specific city to all services
   * POST /admin/sync/city/:cityId
   */
  static async resyncCity(req: Request, res: Response): Promise<void> {
    try {
      const { cityId } = req.params;

      Logger.info(`🏙️ Manual city resync request for: ${cityId}`);

      const result = await SyncRecoveryService.resyncCity(cityId);

      res.json({
        success: result.success,
        message: `City ${cityId} resync completed`,
        data: result,
      });
    } catch (error) {
      Logger.error(`Error resyncing city ${req.params.cityId}:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to resync city ${req.params.cityId}`,
        error: String(error),
      });
    }
  }

  /**
   * Sync all services (use with caution in production)
   * POST /admin/sync/all
   */
  static async syncAllServices(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("🌍 Manual sync ALL services request");

      const services = [
        "client-store-service",
        "rider-service",
        "auth-service",
      ];
      const results = await Promise.allSettled(
        services.map((service) =>
          SyncRecoveryService.syncServiceFromEventLog(service)
        )
      );

      const syncResults = results.map((result, index) => ({
        service: services[index],
        success: result.status === "fulfilled" && result.value.success,
        data:
          result.status === "fulfilled"
            ? result.value
            : { error: "Promise rejected" },
      }));

      const allSuccessful = syncResults.every((r) => r.success);

      res.json({
        success: allSuccessful,
        message: "Bulk sync completed",
        data: {
          results: syncResults,
          summary: {
            total: services.length,
            successful: syncResults.filter((r) => r.success).length,
            failed: syncResults.filter((r) => !r.success).length,
          },
        },
      });
    } catch (error) {
      Logger.error("Error syncing all services:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync all services",
        error: String(error),
      });
    }
  }
}
