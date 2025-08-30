import express from "express";
import {
  uploadVehicleDocument,
  uploadMultipleDocuments,
  getVehicleDocuments,
  deleteVehicleDocument,
  updateDocumentVerification,
} from "../controllers/documentController";
import { upload, uploadDocument } from "../middleware/upload";

const router = express.Router();

// Upload single document for a vehicle
router.post(
  "/vehicles/:vehicleId/documents",
  uploadDocument,
  uploadVehicleDocument
);

// Upload multiple documents for a vehicle
router.post(
  "/vehicles/:vehicleId/documents/batch",
  upload.array("files", 10),
  uploadMultipleDocuments
);

// Get all documents for a vehicle
router.get("/vehicles/:vehicleId/documents", getVehicleDocuments);

// Delete a specific document
router.delete("/documents/:documentId", deleteVehicleDocument);

// Update document verification status
router.patch("/documents/:documentId/verification", updateDocumentVerification);

export default router;
