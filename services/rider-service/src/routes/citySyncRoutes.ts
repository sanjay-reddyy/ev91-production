/**
 * City Sync Routes
 * For EV91 Platform - Rider Service
 * Internal routes for city synchronization
 */

import { Router } from "express";
import { CitySyncController } from "../controllers/citySyncController";

const router = Router();

// City synchronization endpoint (called by vehicle-service)
router.post("/city-sync", CitySyncController.handleCitySync);

// City sync status and management endpoints
router.get("/city-sync/status", CitySyncController.getSyncStatus);
router.get("/city-sync/cities", CitySyncController.getCities);
router.post("/city-sync/manual/:cityId", CitySyncController.manualSync);

export default router;
