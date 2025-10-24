import express from "express";
import {
  listMappings,
  getMapping,
  resolveClientRiderId,
  getMappingsByRider,
  getMappingsByClient,
  createMapping,
  updateMapping,
  deactivateMapping,
  verifyMapping,
  bulkCreateMappings,
} from "../controllers/clientRiderMappingController";

const router = express.Router();

// List and search mappings
router.get("/", listMappings);

// Bulk operations
router.post("/bulk", bulkCreateMappings);

// Resolution endpoint - must come before /:id to avoid route conflicts
router.get("/resolve/:clientId/:clientRiderId", resolveClientRiderId);

// Get mappings by rider or client
router.get("/rider/:platformRiderId", getMappingsByRider);
router.get("/client/:clientId", getMappingsByClient);

// Single mapping operations
router.get("/:id", getMapping);
router.post("/", createMapping);
router.put("/:id", updateMapping);
router.delete("/:id", deactivateMapping);

// Verification
router.post("/:id/verify", verifyMapping);

export default router;
