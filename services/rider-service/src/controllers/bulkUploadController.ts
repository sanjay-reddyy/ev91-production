import { Request, Response } from "express";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";
import { prisma } from "../config/database";
import { s3Service } from "../services/s3Service";
import { downloadFromGoogleDrive } from "../services/googleDriveService";

interface BulkUploadRow {
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  dlNumber?: string;
  panDocumentUrl?: string; // Google Drive link
  aadhaarDocumentUrl?: string; // Google Drive link
  dlDocumentUrl?: string; // Google Drive link
  selfieUrl?: string; // Google Drive link
}

interface UploadJob {
  id: string;
  status: "processing" | "completed" | "failed";
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{ row: number; error: string; data: any }>;
  startedAt: Date;
  completedAt?: Date;
}

// In-memory job tracking (use Redis in production)
const uploadJobs = new Map<string, UploadJob>();

export class BulkUploadController {
  /**
   * Validate and start bulk upload
   */
  async uploadBulkRiders(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: "CSV file is required",
        });
      }

      const options = {
        validateOnly: req.body.validateOnly === "true",
        skipExisting: req.body.skipExisting !== "false", // Default true
        downloadKycDocuments: req.body.downloadKycDocuments !== "false",
        batchSize: parseInt(req.body.batchSize) || 100,
      };

      console.log("📊 Starting bulk upload with options:", options);

      // Parse CSV
      const csvContent = file.buffer.toString("utf-8");
      const records: BulkUploadRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relaxColumnCount: true, // Allow missing columns
      });

      console.log(`📋 Parsed ${records.length} records from CSV`);

      // Validation phase
      const validationErrors = await this.validateRecords(records);

      if (validationErrors.length > 0 && !options.validateOnly) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: validationErrors.slice(0, 100), // Return first 100 errors
          totalErrors: validationErrors.length,
        });
      }

      if (options.validateOnly) {
        return res.json({
          success: true,
          message: "Validation completed",
          totalRecords: records.length,
          errors: validationErrors,
          isValid: validationErrors.length === 0,
        });
      }

      // Create upload job
      const uploadId = randomUUID();
      const job: UploadJob = {
        id: uploadId,
        status: "processing",
        totalRecords: records.length,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [],
        startedAt: new Date(),
      };
      uploadJobs.set(uploadId, job);

      // Start async processing (don't await)
      this.processRecords(uploadId, records, options).catch((error) => {
        console.error("❌ Bulk upload processing error:", error);
        const job = uploadJobs.get(uploadId);
        if (job) {
          job.status = "failed";
          job.completedAt = new Date();
        }
      });

      // Return immediately
      return res.json({
        success: true,
        uploadId,
        totalRecords: records.length,
        status: "processing",
        estimatedTime: `${Math.ceil(
          records.length / options.batchSize
        )} minutes`,
        statusUrl: `/api/v1/riders/bulk-upload/${uploadId}/status`,
      });
    } catch (error: any) {
      console.error("❌ Bulk upload error:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get upload job status
   */
  async getUploadStatus(req: Request, res: Response) {
    const { uploadId } = req.params;
    const job = uploadJobs.get(uploadId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Upload job not found",
      });
    }

    return res.json({
      success: true,
      uploadId: job.id,
      status: job.status,
      progress: {
        total: job.totalRecords,
        processed: job.processedRecords,
        successful: job.successfulRecords,
        failed: job.failedRecords,
        percentage: parseFloat(
          ((job.processedRecords / job.totalRecords) * 100).toFixed(2)
        ),
      },
      errors: job.errors.slice(0, 100), // First 100 errors
      totalErrors: job.errors.length,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      duration: job.completedAt
        ? (
            (job.completedAt.getTime() - job.startedAt.getTime()) /
            1000
          ).toFixed(2) + " seconds"
        : null,
    });
  }

  /**
   * Download errors as CSV
   */
  async downloadErrors(req: Request, res: Response) {
    const { uploadId } = req.params;
    const job = uploadJobs.get(uploadId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Upload job not found",
      });
    }

    if (job.errors.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No errors found",
      });
    }

    // Generate CSV content
    const csvHeader = "Row,Error,Name,Phone,Email\n";
    const csvRows = job.errors
      .map((err) => {
        const data = err.data;
        return `${err.row},"${err.error}","${data.name || ""}","${
          data.phone || ""
        }","${data.email || ""}"`;
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bulk-upload-errors-${uploadId}.csv"`
    );
    return res.send(csvContent);
  }

  /**
   * Validate all records
   */
  private async validateRecords(
    records: BulkUploadRow[]
  ): Promise<Array<{ row: number; errors: string[] }>> {
    const validationErrors: Array<{ row: number; errors: string[] }> = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const errors: string[] = [];

      // Required fields
      if (!record.name || record.name.trim().length === 0) {
        errors.push("Name is required");
      }
      if (!record.phone || !this.validatePhone(record.phone)) {
        errors.push("Valid 10-digit phone number is required");
      }

      // Optional email validation
      if (record.email && !this.validateEmail(record.email)) {
        errors.push("Invalid email format");
      }

      // Document number validation
      if (record.aadhaarNumber && !this.validateAadhaar(record.aadhaarNumber)) {
        errors.push("Invalid Aadhaar format (12 digits required)");
      }
      if (record.panNumber && !this.validatePAN(record.panNumber)) {
        errors.push("Invalid PAN format (e.g., ABCDE1234F)");
      }

      if (errors.length > 0) {
        validationErrors.push({ row: i + 2, errors }); // +2 for header and 1-indexed
      }
    }

    return validationErrors;
  }

  /**
   * Process records in batches
   */
  private async processRecords(
    uploadId: string,
    records: BulkUploadRow[],
    options: any
  ) {
    const job = uploadJobs.get(uploadId);
    if (!job) return;

    const batchSize = options.batchSize;
    console.log(
      `🚀 Starting batch processing: ${records.length} records in batches of ${batchSize}`
    );

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(records.length / batchSize);

      console.log(
        `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`
      );

      await Promise.all(
        batch.map(async (record, batchIndex) => {
          const rowNumber = i + batchIndex + 2; // +2 for header and 1-indexed
          try {
            await this.processRecord(record, options);
            job.successfulRecords++;
            console.log(`✅ Row ${rowNumber}: Success - ${record.name}`);
          } catch (error: any) {
            job.failedRecords++;
            job.errors.push({
              row: rowNumber,
              error: error.message,
              data: record,
            });
            console.error(`❌ Row ${rowNumber}: Failed - ${error.message}`);
          } finally {
            job.processedRecords++;
          }
        })
      );

      console.log(
        `✅ Batch ${batchNumber}/${totalBatches} completed. Progress: ${job.processedRecords}/${job.totalRecords}`
      );
    }

    job.status = "completed";
    job.completedAt = new Date();
    console.log(
      `🎉 Bulk upload completed: ${job.successfulRecords}/${job.totalRecords} successful, ${job.failedRecords} failed`
    );
  }

  /**
   * Process single record
   */
  private async processRecord(record: BulkUploadRow, options: any) {
    // Check for existing rider
    if (options.skipExisting) {
      const existing = await prisma.rider.findFirst({
        where: {
          OR: [
            { phone: record.phone },
            {
              email:
                record.email && record.email.length > 0
                  ? record.email
                  : undefined,
            },
          ].filter(Boolean),
        },
      });

      if (existing) {
        throw new Error(`Rider already exists with phone ${record.phone}`);
      }
    }

    // Create rider
    const rider = await prisma.rider.create({
      data: {
        name: record.name,
        phone: record.phone,
        email: record.email || null,
        dob: record.dob || null,
        address1: record.address1 || null,
        address2: record.address2 || null,
        city: record.city || null,
        state: record.state || null,
        pincode: record.pincode || null,
        emergencyName: record.emergencyName || null,
        emergencyPhone: record.emergencyPhone || null,
        emergencyRelation: record.emergencyRelation || null,
        aadhaar: record.aadhaarNumber || null,
        pan: record.panNumber || null,
        dl: record.dlNumber || null,
        registrationStatus: "COMPLETED",
        kycStatus: "pending",
        isActive: false, // Activate after KYC verification
      },
    });

    console.log(`👤 Created rider: ${rider.name} (${rider.id})`);

    // Download and upload KYC documents if URLs provided
    if (options.downloadKycDocuments) {
      const documentPromises: Promise<void>[] = [];

      if (record.panDocumentUrl && record.panDocumentUrl.trim().length > 0) {
        documentPromises.push(
          this.downloadAndUploadDocument(
            rider.id,
            "pan",
            record.panDocumentUrl,
            record.panNumber
          )
        );
      }
      if (
        record.aadhaarDocumentUrl &&
        record.aadhaarDocumentUrl.trim().length > 0
      ) {
        documentPromises.push(
          this.downloadAndUploadDocument(
            rider.id,
            "aadhaar",
            record.aadhaarDocumentUrl,
            record.aadhaarNumber
          )
        );
      }
      if (record.dlDocumentUrl && record.dlDocumentUrl.trim().length > 0) {
        documentPromises.push(
          this.downloadAndUploadDocument(
            rider.id,
            "dl",
            record.dlDocumentUrl,
            record.dlNumber
          )
        );
      }
      if (record.selfieUrl && record.selfieUrl.trim().length > 0) {
        documentPromises.push(
          this.downloadAndUploadDocument(rider.id, "selfie", record.selfieUrl)
        );
      }

      if (documentPromises.length > 0) {
        await Promise.all(documentPromises);
        console.log(
          `📄 Uploaded ${documentPromises.length} documents for rider ${rider.id}`
        );
      }
    }
  }

  /**
   * Download from Google Drive and upload to S3
   */
  private async downloadAndUploadDocument(
    riderId: string,
    documentType: string,
    googleDriveUrl: string,
    documentNumber?: string
  ): Promise<void> {
    try {
      console.log(
        `📥 Downloading ${documentType} for rider ${riderId} from ${googleDriveUrl.substring(
          0,
          50
        )}...`
      );

      // Download from Google Drive
      const fileBuffer = await downloadFromGoogleDrive(googleDriveUrl);

      // Upload to S3
      const uploadResult = await s3Service.uploadFile(fileBuffer, {
        riderId,
        documentType,
        folder: "kyc",
      });

      // Create KYC document record with S3 KEY (not full URL)
      await prisma.kycDocument.create({
        data: {
          riderId,
          documentType,
          documentTypeDisplay: this.getDocumentTypeDisplay(documentType),
          documentNumber: documentNumber || `doc-${Date.now()}`,
          documentImageUrl: uploadResult.key, // Store S3 key only - IMPORTANT!
          verificationStatus: "pending",
        },
      });

      console.log(`✅ Uploaded ${documentType} to S3: ${uploadResult.key}`);
    } catch (error: any) {
      console.error(`❌ Failed to process ${documentType}:`, error.message);
      throw new Error(
        `Failed to upload ${documentType} document: ${error.message}`
      );
    }
  }

  // Validation helpers
  private validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    return /^[0-9]{10}$/.test(cleaned);
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private validateAadhaar(aadhaar: string): boolean {
    const cleaned = aadhaar.replace(/\s/g, "");
    return /^[0-9]{12}$/.test(cleaned);
  }

  private validatePAN(pan: string): boolean {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
  }

  private getDocumentTypeDisplay(type: string): string {
    const map: Record<string, string> = {
      aadhaar: "Aadhaar Card",
      pan: "PAN Card",
      dl: "Driving License",
      selfie: "Selfie Photo",
    };
    return map[type] || type;
  }

  /**
   * Clear old completed jobs (cleanup)
   */
  static cleanupOldJobs() {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    for (const [jobId, job] of uploadJobs.entries()) {
      if (job.completedAt && now - job.completedAt.getTime() > ONE_HOUR) {
        uploadJobs.delete(jobId);
        console.log(`🧹 Cleaned up old job: ${jobId}`);
      }
    }
  }
}

// Cleanup old jobs every hour
setInterval(() => {
  BulkUploadController.cleanupOldJobs();
}, 60 * 60 * 1000);
