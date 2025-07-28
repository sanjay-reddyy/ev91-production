import { Router } from 'express';
import {
  getAllVehicleModels,
  getVehicleModelById,
  getVehicleModelsByOEM,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
  getVehicleModelSpecs,
  getModelMetadata
} from '../controllers/vehicleModelController';

const router = Router();

// GET /api/vehicle-models - Get all vehicle models with optional filters
router.get('/', getAllVehicleModels);

// GET /api/vehicle-models/metadata - Get model categories, segments, etc.
router.get('/metadata', getModelMetadata);

// GET /api/vehicle-models/oem/:oemId - Get vehicle models by OEM ID
router.get('/oem/:oemId', getVehicleModelsByOEM);

// GET /api/vehicle-models/:id - Get vehicle model by ID
router.get('/:id', getVehicleModelById);

// GET /api/vehicle-models/:id/specs - Get vehicle model specifications (for autofill)
router.get('/:id/specs', getVehicleModelSpecs);

// POST /api/vehicle-models - Create new vehicle model
router.post('/', createVehicleModel);

// PUT /api/vehicle-models/:id - Update vehicle model
router.put('/:id', updateVehicleModel);

// DELETE /api/vehicle-models/:id - Delete vehicle model (soft delete by default)
router.delete('/:id', deleteVehicleModel);

export default router;
