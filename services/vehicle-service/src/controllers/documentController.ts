import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { DocumentService } from "../services/documentService";
import { Logger } from "../utils";
import { AppError } from "../utils/errorHandler";

// Upload vehicle document (RC, Insurance, or Vehicle Photo)
export const uploadVehicleDocument = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Vehicle document upload request received", {
      userId: req.user?.id,
      vehicleId: req.params.vehicleId,
      documentType: req.body.documentType,
    });

    const { vehicleId } = req.params;
    const { documentType, description } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError("No file uploaded", 400);
    }

    if (!documentType) {
      throw new AppError("Document type is required", 400);
    }

    try {
      const result = await DocumentService.uploadVehicleDocument({
        vehicleId,
        file,
        documentType,
        description,
        uploadedBy: req.user?.id || "system",
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }
);

// Upload multiple vehicle documents
export const uploadMultipleDocuments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Multiple vehicle documents upload request received", {
      userId: req.user?.id,
      vehicleId: req.params.vehicleId,
      fileCount: req.files?.length || 0,
    });

    const { vehicleId } = req.params;
    const files = req.files as Express.Multer.File[];
    const { documentMappings } = req.body; // JSON string mapping file names to document types

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    if (!documentMappings) {
      throw new AppError("Document mappings are required", 400);
    }

    try {
      const mappings = JSON.parse(documentMappings);
      const results = await DocumentService.uploadMultipleDocuments({
        vehicleId,
        files,
        documentMappings: mappings,
        uploadedBy: req.user?.id || "system",
      });

      res.status(201).json({
        success: true,
        message: `${results.length} documents uploaded successfully`,
        data: results,
      });
    } catch (error) {
      throw error;
    }
  }
);

// Get vehicle documents
export const getVehicleDocuments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle documents request received", {
      userId: req.user?.id,
      vehicleId: req.params.vehicleId,
    });

    const { vehicleId } = req.params;
    const { documentType } = req.query;

    try {
      const documents = await DocumentService.getVehicleDocuments(
        vehicleId,
        documentType as string
      );

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      throw error;
    }
  }
);

// Delete vehicle document
export const deleteVehicleDocument = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Delete vehicle document request received", {
      userId: req.user?.id,
      documentId: req.params.documentId,
    });

    const { documentId } = req.params;

    try {
      await DocumentService.deleteVehicleDocument(documentId);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      throw error;
    }
  }
);

// Update document verification status
export const updateDocumentVerification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Update document verification request received", {
      userId: req.user?.id,
      documentId: req.params.documentId,
    });

    const { documentId } = req.params;
    const { verificationStatus, notes } = req.body;

    try {
      const result = await DocumentService.updateDocumentVerification(
        documentId,
        verificationStatus,
        notes,
        req.user?.id || "system"
      );

      res.json({
        success: true,
        message: "Document verification status updated successfully",
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }
);
