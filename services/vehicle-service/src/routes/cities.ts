/**
 * City Routes
 * For EV91 Platform - Vehicle Service
 * Defines API endpoints for city operations
 */

import { Router } from 'express';
import { CityController } from '../controllers/cityController';

const router = Router();

// City CRUD operations
router.post('/', CityController.createCity);
router.get('/', CityController.getCities);
router.get('/operational', CityController.getOperationalCities);
router.get('/with-counts', CityController.getCitiesWithCounts);
router.get('/code/:code', CityController.getCityByCode);
router.get('/:id', CityController.getCityById);
router.put('/:id', CityController.updateCity);
router.delete('/:id', CityController.deleteCity);

export default router;
