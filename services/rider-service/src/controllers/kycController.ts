import { Request, Response } from "express";
import { KycService, KycDocumentType } from "../services/kycService";
import multer from "multer";

const kycService = new KycService();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * KYC controller handling HTTP requests for document upload and verification
 */
export class KycController {
  // Multer middleware for file upload
  uploadMiddleware = upload.single("file");

  /**
   * Upload KYC document
   */
  async uploadDocument(req: Request, res: Response) {
    const startTime = Date.now();
    try {
      const { riderId } = req.params;
      // Get document type from either params or body (to support both endpoint versions)
      let documentType = req.params.documentType;

      // If documentType is not in params, try to get it from the request body
      if (!documentType && req.body && req.body.documentType) {
        documentType = req.body.documentType;
      }

      const file = req.file;
      const documentNumber = req.body?.documentNumber || `doc-${Date.now()}`;

      console.log("📝 KYC Document Upload Request:", {
        riderId,
        documentType,
        hasFile: !!file,
        fileSize: file?.size,
        fileType: file?.mimetype,
        documentNumber,
        requestTime: new Date().toISOString(),
      });

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      if (!documentType) {
        return res.status(400).json({
          success: false,
          error: "Document type is required",
          providedFields: Object.keys(req.body || {}),
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "File is required for document upload",
          contentType: req.headers["content-type"],
          providedFields: Object.keys(req.body || {}),
        });
      }

      // Validate and normalize document type
      const normalizedType = documentType.toLowerCase();
      let validDocType = null;

      // Map common variations to standard types
      if (
        normalizedType.includes("aadhaar") ||
        normalizedType.includes("aadhar")
      ) {
        validDocType = KycDocumentType.AADHAAR;
      } else if (normalizedType.includes("pan")) {
        validDocType = KycDocumentType.PAN;
      } else if (
        normalizedType.includes("dl") ||
        normalizedType.includes("license") ||
        normalizedType.includes("driving")
      ) {
        validDocType = KycDocumentType.DL;
      } else if (
        normalizedType.includes("selfie") ||
        normalizedType.includes("photo")
      ) {
        validDocType = KycDocumentType.SELFIE;
      } else if (
        Object.values(KycDocumentType).includes(
          normalizedType as KycDocumentType
        )
      ) {
        validDocType = normalizedType as KycDocumentType;
      }

      if (!validDocType) {
        return res.status(400).json({
          success: false,
          error: `Invalid document type: ${documentType}. Valid types are: ${Object.values(
            KycDocumentType
          ).join(", ")}`,
        });
      }

      // Always use development mode to avoid S3 timeouts
      const useDevMode = true; // Force dev mode to avoid S3 timeouts

      if (useDevMode) {
        console.log(`📄 KYC Document Upload (Dev Mode):`, {
          riderId,
          documentType: validDocType,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          processingTime: `${Date.now() - startTime}ms`,
        });

        // Save the document reference in the database without S3 upload
        const result = await kycService.uploadDocument(
          riderId,
          validDocType as KycDocumentType,
          file.buffer,
          file.mimetype,
          documentNumber
        );

        return res.status(200).json({
          success: true,
          data: {
            ...result,
            message: "Document uploaded successfully",
            processingTime: `${Date.now() - startTime}ms`,
          },
        });
      }

      // Production: Use actual S3 upload
      const result = await kycService.uploadDocument(
        riderId,
        documentType as KycDocumentType,
        file.buffer,
        file.mimetype
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get KYC status
   */
  async getKycStatus(req: Request, res: Response) {
    try {
      const { riderId } = req.params;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      const result = await kycService.getKycStatus(riderId);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Get KYC status error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Submit KYC for verification
   */
  async submitForVerification(req: Request, res: Response) {
    try {
      const { riderId } = req.params;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      const result = await kycService.submitForVerification(riderId);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("KYC verification submission error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  // ==========================================
  // ADMIN/DASHBOARD KYC VERIFICATION METHODS
  // ==========================================

  /**
   * Get all pending KYC submissions for manual review
   */
  async getPendingKycSubmissions(req: Request, res: Response) {
    try {
      const result = await kycService.getPendingKycSubmissions();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get pending KYC submissions error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get KYC documents for a specific rider (for manual review)
   */
  async getKycDocuments(req: Request, res: Response) {
    try {
      const { riderId } = req.params;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      const result = await kycService.getKycDocuments(riderId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get KYC documents error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Verify/Reject KYC documents (manual verification by admin)
   */
  async verifyKycDocuments(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      const { status, rejectionReason, verifiedBy } = req.body;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be either "verified" or "rejected"',
        });
      }

      if (status === "rejected" && !rejectionReason) {
        return res.status(400).json({
          success: false,
          error: "Rejection reason is required when rejecting KYC",
        });
      }

      const result = await kycService.verifyKycDocuments(
        riderId,
        status,
        rejectionReason,
        verifiedBy || "admin"
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: `KYC ${status} successfully`,
      });
    } catch (error) {
      console.error("Verify KYC documents error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Auto-verify using external KYC service (Digilocker integration)
   */
  async autoVerifyKyc(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      const { service } = req.body; // 'digilocker' or other services

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      const result = await kycService.autoVerifyKyc(
        riderId,
        service || "digilocker"
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: "Auto-verification completed",
      });
    } catch (error) {
      console.error("Auto-verify KYC error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
}
