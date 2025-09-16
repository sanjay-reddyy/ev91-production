/**
 * Sync Recovery Routes
 * Admin endpoints for managing cross-service synchronization
 */

import { Router } from "express";
import { SyncRecoveryController } from "../controllers/syncRecoveryController";

const router = Router();

// Get overall sync status
router.get("/status", SyncRecoveryController.getSyncStatus);

// Sync specific service from event log
router.post("/service/:serviceName", SyncRecoveryController.syncService);

// Force resync a specific city to all services
router.post("/city/:cityId", SyncRecoveryController.resyncCity);

// Bulk sync all services (use with caution)
router.post("/all", SyncRecoveryController.syncAllServices);

export default router;
