/**
 * Hub Routes
 * For EV91 Platform - Vehicle Service
 * Defines API endpoints for hub operations
 */

import { Router } from 'express';
import { HubController } from '../controllers/hubController';

const router = Router();

// Hub CRUD operations
router.post('/', HubController.createHub);
router.get('/', HubController.getHubs);
router.get('/operational', HubController.getOperationalHubs);
router.get('/with-counts', HubController.getHubsWithVehicleCounts);
router.get('/city/:cityId', HubController.getHubsByCity);
router.get('/code/:code', HubController.getHubByCode);
router.get('/:id', HubController.getHubById);
router.put('/:id', HubController.updateHub);
router.delete('/:id', HubController.deleteHub);

// Hub assignment operations
router.post('/assign-vehicle', HubController.assignVehicleToHub);

export default router;
