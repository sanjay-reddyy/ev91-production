/**
 * City Routes
 * For EV91 Platform - Client Store Service
 * Public API endpoints for city data used in dropdowns and forms
 */

import { Router } from "express";
import { CityController } from "../controllers/cityController";

const router = Router();

// Get all cities for dropdown
router.get("/", CityController.getCities);

// Get operational cities only
router.get("/operational", CityController.getOperationalCities);

// Get active cities only
router.get("/active", CityController.getActiveCities);

// Get city by ID
router.get("/:id", CityController.getCityById);

// Get city by code
router.get("/code/:code", CityController.getCityByCode);

export default router;
