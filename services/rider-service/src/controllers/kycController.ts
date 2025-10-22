import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { KycService, KycDocumentType } from "../services/kycService";
import { KYC_STATUS } from "../constants/statusValues";
import multer from "multer";

const kycService = new KycService();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased from 5MB)
  },
  fileFilter: (req, file, cb) => {
    console.log(
      `📎 Multer receiving file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`
    );
    // Accept image files only
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      console.log(`❌ File type rejected: ${file.mimetype}`);
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`
        )
      );
    }
  },
});

// Map to store chunked upload sessions
interface UploadSession {
  chunks: Buffer[];
  fileName: string;
  fileType: string;
  documentType: string;
  documentNumber: string;
  chunksMeta: {
    received: boolean[];
    totalSize: number;
  };
  createdAt: Date;
}

const uploadSessions = new Map<string, UploadSession>();

// Clean up old upload sessions every hour
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of uploadSessions.entries()) {
    // Remove sessions older than 2 hours
    if (now.getTime() - session.createdAt.getTime() > 2 * 60 * 60 * 1000) {
      console.log(`Cleaning up expired upload session: ${sessionId}`);
      uploadSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

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

      // Check if S3 should be used or dev mode
      const useDevMode = false; // Set to false to use actual S3 upload

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
      console.log(`📤 Starting S3 upload for ${validDocType}...`);
      console.log(
        `File details: size=${file.size}, type=${file.mimetype}, name=${file.originalname}`
      );

      const result = await kycService.uploadDocument(
        riderId,
        validDocType as KycDocumentType,
        file, // Pass the entire file object instead of just buffer
        file.mimetype,
        documentNumber
      );

      console.log(`✅ Upload completed in ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("❌ Document upload error:", {
        error: errorMessage,
        stack: (error as Error).stack,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return res.status(500).json({
        success: false,
        error: errorMessage,
        message: "Failed to upload document",
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
   * NOW RETURNS PRE-SIGNED URLS FOR SECURE ACCESS
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

      console.log(
        `🚀 [Controller] Getting KYC documents for rider: ${riderId}`
      );
      const result = await kycService.getKycDocuments(riderId);
      console.log(
        `📦 [Controller] Got ${
          Array.isArray(result) ? result.length : 0
        } documents from service`
      );

      return res.status(200).json({
        success: true,
        data: result,
        _timestamp: Date.now(), // Test marker to verify this code runs
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
   * Verify/Reject a single KYC document (manual verification by admin)
   */
  async verifySingleKycDocument(req: Request, res: Response) {
    try {
      const { riderId, documentId } = req.params;
      const { status, notes } = req.body;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
      }

      if (![KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED].includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status must be either "${KYC_STATUS.VERIFIED}" or "${KYC_STATUS.REJECTED}"`,
        });
      }

      if (status === "rejected" && !notes) {
        return res.status(400).json({
          success: false,
          error: "Notes are required when rejecting KYC",
        });
      }

      const result = await kycService.verifySingleKycDocument(
        riderId,
        documentId,
        status,
        notes
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: `KYC document ${status} successfully`,
      });
    } catch (error) {
      console.error("Verify single KYC document error:", error);
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

      if (![KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED].includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status must be either "${KYC_STATUS.VERIFIED}" or "${KYC_STATUS.REJECTED}"`,
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

  /**
   * Initialize a chunked upload session
   */
  async initChunkedUpload(req: Request, res: Response) {
    const { riderId } = req.params;
    const { fileName, fileSize, fileType, totalChunks, sessionId } = req.body;
    const { documentType, documentNumber } = req.body;

    if (
      !riderId ||
      !fileName ||
      !fileSize ||
      !fileType ||
      !totalChunks ||
      !sessionId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    // Create upload session
    uploadSessions.set(sessionId, {
      chunks: Array(parseInt(totalChunks)).fill(null),
      fileName,
      fileType,
      documentType,
      documentNumber: documentNumber || `doc-${Date.now()}`,
      chunksMeta: {
        received: Array(parseInt(totalChunks)).fill(false),
        totalSize: parseInt(fileSize),
      },
      createdAt: new Date(),
    });

    console.log(`📝 Chunked upload session initialized: ${sessionId}`, {
      riderId,
      fileName,
      fileSize,
      totalChunks,
      documentType,
    });

    return res.status(200).json({
      success: true,
      message: "Upload session initialized",
      sessionId,
    });
  }

  /**
   * Upload a chunk for a chunked upload session
   */
  async uploadChunk(req: Request, res: Response) {
    const chunkUpload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max chunk size
    }).single("chunk");

    chunkUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: `Chunk upload error: ${err.message}`,
        });
      }

      const { riderId } = req.params;
      const { sessionId, chunkIndex } = req.body;
      const chunk = req.file;

      if (!chunk || !sessionId || chunkIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing chunk data or metadata",
        });
      }

      // Find the upload session
      const session = uploadSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Upload session not found",
        });
      }

      const index = parseInt(chunkIndex);

      // Store the chunk
      session.chunks[index] = chunk.buffer;
      session.chunksMeta.received[index] = true;

      // Count received chunks
      const receivedChunks = session.chunksMeta.received.filter(Boolean).length;
      const totalChunks = session.chunks.length;

      console.log(
        `📤 Received chunk ${index + 1}/${totalChunks} for session ${sessionId}`
      );

      return res.status(200).json({
        success: true,
        message: `Chunk ${index + 1}/${totalChunks} received`,
        progress: Math.round((receivedChunks / totalChunks) * 100),
      });
    });
  }

  /**
   * Complete a chunked upload and process the assembled file
   */
  async completeChunkedUpload(req: Request, res: Response) {
    const { riderId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    // Find the upload session
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Upload session not found",
      });
    }

    // Check if all chunks are received
    const missingChunks = session.chunksMeta.received
      .map((received, index) => (received ? -1 : index))
      .filter((index) => index !== -1);

    if (missingChunks.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing chunks: ${missingChunks.join(", ")}`,
      });
    }

    try {
      // Concatenate all chunks into a single buffer
      const fileBuffer = Buffer.concat(session.chunks);

      console.log(
        `🔄 Assembling file from ${session.chunks.length} chunks for ${session.fileName}`
      );

      // Validate and normalize document type
      const documentType = session.documentType.toLowerCase();
      let validDocType = null;

      // Map common variations to standard types (same as in uploadDocument)
      if (documentType.includes("aadhaar") || documentType.includes("aadhar")) {
        validDocType = KycDocumentType.AADHAAR;
      } else if (documentType.includes("pan")) {
        validDocType = KycDocumentType.PAN;
      } else if (
        documentType.includes("dl") ||
        documentType.includes("license") ||
        documentType.includes("driving")
      ) {
        validDocType = KycDocumentType.DL;
      } else if (
        documentType.includes("selfie") ||
        documentType.includes("photo")
      ) {
        validDocType = KycDocumentType.SELFIE;
      } else if (
        Object.values(KycDocumentType).includes(documentType as KycDocumentType)
      ) {
        validDocType = documentType as KycDocumentType;
      }

      if (!validDocType) {
        return res.status(400).json({
          success: false,
          message: `Invalid document type: ${documentType}`,
        });
      }

      // Process the file with actual S3 upload
      console.log(
        `📄 Processing chunked upload for ${session.fileName} (${fileBuffer.length} bytes)`
      );
      const result = await kycService.uploadDocument(
        riderId,
        validDocType,
        fileBuffer,
        session.fileType,
        session.documentNumber
      );

      // Clean up the session
      uploadSessions.delete(sessionId);

      return res.status(200).json({
        success: true,
        data: result,
        message: "File assembled and processed successfully",
      });
    } catch (error) {
      console.error(`Error completing chunked upload: ${error}`);
      return res.status(500).json({
        success: false,
        message: `Error completing upload: ${(error as Error).message}`,
      });
    }
  }
}
