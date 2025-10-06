import { Router } from "express";
import { KycController } from "../controllers/kycController";

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
kycRouter.get("/:riderId/kyc", kycController.getKycDocuments);

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
  kycController.uploadMiddleware,
  kycController.uploadDocument
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
kycRouter.post("/:riderId/kyc/verify-admin", kycController.verifyKycDocuments);

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
