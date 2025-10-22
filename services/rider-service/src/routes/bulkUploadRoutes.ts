import { Router } from "express";
import multer from "multer";
import { BulkUploadController } from "../controllers/bulkUploadController";

const router = Router();
const bulkUploadController = new BulkUploadController();

// Configure multer for CSV upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CSV
  },
  fileFilter: (req, file, cb) => {
    console.log("📄 Received file:", file.originalname, "Type:", file.mimetype);

    // Accept CSV files with various mime types
    const allowedMimes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/csv",
      "text/x-csv",
      "application/x-csv",
      "text/comma-separated-values",
      "text/x-comma-separated-values",
    ];

    const allowedExtensions = [".csv", ".CSV"];
    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.originalname.endsWith(ext)
    );

    if (hasValidMime || hasValidExtension) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Please upload a CSV file. Received: ${file.mimetype}`
        )
      );
    }
  },
});

/**
 * @swagger
 * /api/v1/riders/bulk-upload:
 *   post:
 *     summary: Bulk upload riders from CSV
 *     description: Upload multiple riders from a CSV file with optional KYC documents from Google Drive
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with rider data
 *               validateOnly:
 *                 type: boolean
 *                 description: If true, only validates without importing
 *               skipExisting:
 *                 type: boolean
 *                 description: Skip riders that already exist (default true)
 *               downloadKycDocuments:
 *                 type: boolean
 *                 description: Download KYC documents from Google Drive links (default true)
 *               batchSize:
 *                 type: integer
 *                 description: Number of riders to process per batch (default 100)
 *     responses:
 *       200:
 *         description: Upload started successfully
 *       400:
 *         description: Validation failed or invalid file
 */
router.post("/bulk-upload", upload.single("file"), (req, res) =>
  bulkUploadController.uploadBulkRiders(req, res)
);

/**
 * @swagger
 * /api/v1/riders/bulk-upload/{uploadId}/status:
 *   get:
 *     summary: Get bulk upload job status
 *     description: Check the progress and status of a bulk upload job
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload job ID
 *     responses:
 *       200:
 *         description: Upload status retrieved successfully
 *       404:
 *         description: Upload job not found
 */
router.get("/bulk-upload/:uploadId/status", (req, res) =>
  bulkUploadController.getUploadStatus(req, res)
);

/**
 * @swagger
 * /api/v1/riders/bulk-upload/{uploadId}/errors:
 *   get:
 *     summary: Download errors as CSV
 *     description: Download a CSV file containing all errors from the bulk upload
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload job ID
 *     responses:
 *       200:
 *         description: Errors CSV file
 *       404:
 *         description: Upload job not found or no errors
 */
router.get("/bulk-upload/:uploadId/errors", (req, res) =>
  bulkUploadController.downloadErrors(req, res)
);

export default router;
