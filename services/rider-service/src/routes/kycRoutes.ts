import { Router } from "express";
import { KycController } from "../controllers/kycController";
import {
  validateKycVerificationRequest,
  validateDocumentUploadRequest,
} from "../middleware/kycValidation";

const kycRouter = Router();
const kycController = new KycController();

/**
 * @swagger
 * /api/riders/{riderId}/kyc:
 *   get:
 *     summary: Get KYC documents for a rider
 *     description: Retrieves all KYC documents associated with a specific rider
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KYC documents retrieved successfully
 */
kycRouter.get("/:riderId/kyc", async (req, res) => {
  console.log("🔵 ROUTE HANDLER EXECUTING for riderId:", req.params.riderId);
  const result = await kycController.getKycDocuments(req, res);
  console.log("🟢 ROUTE HANDLER COMPLETE");
  return result;
});

/**
 * @swagger
 * /api/riders/{riderId}/kyc:
 *   post:
 *     summary: Upload a KYC document directly
 *     description: Upload a KYC document for a rider with document type in request body
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *               documentNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
kycRouter.post(
  "/:riderId/kyc",
  (req, res, next) => {
    console.log(`🔵 KYC upload route hit: ${req.params.riderId}`);
    console.log(`Content-Type: ${req.headers["content-type"]}`);
    next();
  },
  kycController.uploadMiddleware,
  (req, res, next) => {
    console.log(
      `🟢 Multer middleware passed, file: ${req.file ? "YES" : "NO"}`
    );
    next();
  },
  kycController.uploadDocument
);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/init-chunked-upload:
 *   post:
 *     summary: Initialize a chunked upload session
 *     description: Start a chunked upload session for a large KYC document
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               fileType:
 *                 type: string
 *               totalChunks:
 *                 type: number
 *               sessionId:
 *                 type: string
 *               documentType:
 *                 type: string
 *               documentNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload session initialized
 */
kycRouter.post(
  "/:riderId/kyc/init-chunked-upload",
  kycController.initChunkedUpload
);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/upload-chunk:
 *   post:
 *     summary: Upload a chunk of a file
 *     description: Upload an individual chunk as part of a chunked upload
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               chunk:
 *                 type: string
 *                 format: binary
 *               sessionId:
 *                 type: string
 *               chunkIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Chunk received
 */
kycRouter.post("/:riderId/kyc/upload-chunk", kycController.uploadChunk);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/complete-chunked-upload:
 *   post:
 *     summary: Complete a chunked upload
 *     description: Finalize a chunked upload and process the assembled file
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File upload completed
 */
kycRouter.post(
  "/:riderId/kyc/complete-chunked-upload",
  kycController.completeChunkedUpload
);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/{documentType}:
 *   post:
 *     summary: Upload a KYC document
 *     description: Upload a KYC document (aadhaar, pan, dl, selfie) for a rider
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *       - in: path
 *         name: documentType
 *         required: true
 *         description: Type of document (aadhaar, pan, dl, selfie)
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
kycRouter.post(
  "/:riderId/kyc/:documentType",
  kycController.uploadMiddleware,
  validateDocumentUploadRequest,
  kycController.uploadDocument
);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/verify:
 *   post:
 *     summary: Submit KYC documents for verification
 *     description: Submit the rider's KYC documents for verification
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KYC documents submitted for verification
 */
kycRouter.post("/:riderId/kyc/verify", kycController.submitForVerification);

/**
 * @swagger
 * /api/riders/kyc/pending:
 *   get:
 *     summary: Get pending KYC submissions
 *     description: Get all pending KYC submissions for admin review
 *     responses:
 *       200:
 *         description: Retrieved pending KYC submissions
 */
kycRouter.get("/kyc/pending", kycController.getPendingKycSubmissions);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/{documentId}/verify:
 *   patch:
 *     summary: Verify or reject a specific KYC document
 *     description: Admin verification or rejection of a single KYC document
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *       - in: path
 *         name: documentId
 *         required: true
 *         description: ID of the KYC document
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC document verified/rejected
 */
kycRouter.patch(
  "/:riderId/kyc/:documentId/verify",
  kycController.verifySingleKycDocument
);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/verify-admin:
 *   post:
 *     summary: Admin verification of KYC documents
 *     description: Admin verification or rejection of KYC documents
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *               rejectionReason:
 *                 type: string
 *               verifiedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC documents verified/rejected
 */
kycRouter.post(
  "/:riderId/kyc/verify-admin",
  validateKycVerificationRequest,
  kycController.verifyKycDocuments
);

/**
 * @swagger
 * /api/riders/{riderId}/kyc/auto-verify:
 *   post:
 *     summary: Auto-verify KYC documents
 *     description: Verify KYC documents using external verification service
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         description: ID of the rider
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: string
 *                 default: digilocker
 *     responses:
 *       200:
 *         description: Auto-verification completed
 */
kycRouter.post("/:riderId/kyc/auto-verify", kycController.autoVerifyKyc);

export default kycRouter;
