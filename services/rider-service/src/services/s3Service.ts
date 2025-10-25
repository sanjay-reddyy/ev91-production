/**
 * S3 Service - Industry Standard Implementation
 *
 * This service wraps the shared S3Service utility to provide
 * rider-service-specific functionality with backward compatibility.
 *
 * New path structure: riders/{riderId}/{category}/{documentType}_{timestamp}.{ext}
 */

import { env } from "../config/env";
import path from "path";

// Try to import shared-utils, fall back to stubs if not available
let sharedS3Service: any;
let DocumentCategory: any;

try {
  const sharedUtils = require("@ev91/shared-utils");
  sharedS3Service = sharedUtils.s3Service;
  DocumentCategory = sharedUtils.DocumentCategory;
} catch (error) {
  // Fallback for Docker builds without shared-utils
  console.warn("shared-utils not available, using stubs");
  sharedS3Service = {
    uploadFile: () => Promise.resolve({ key: "", location: "", bucket: "" }),
    deleteFile: () => Promise.resolve(),
    getSignedUrl: () => Promise.resolve(""),
    fileExists: () => Promise.resolve(false),
    getFileMetadata: () => Promise.resolve({})
  };
  DocumentCategory = "string";
}

export interface S3UploadResult {
  key: string;
  location: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface S3UploadOptions {
  riderId?: string;
  documentType?: string;
  folder?: string;
  metadata?: Record<string, string>;
}

export class S3Service {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      env.S3_BASE_URL ||
      `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  }

  /**
   * Upload a single file to S3 using industry-standard path structure
   */
  async uploadFile(
    file: Express.Multer.File | Buffer,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      const {
        riderId,
        documentType = "document",
        folder = "kyc",
        metadata = {},
      } = options;

      // Handle both Multer file and Buffer
      const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;
      const originalName = Buffer.isBuffer(file)
        ? "document"
        : file.originalname;
      const mimeType = Buffer.isBuffer(file)
        ? "application/octet-stream"
        : file.mimetype;
      const fileSize = Buffer.isBuffer(file) ? file.length : file.size;

      if (!riderId) {
        throw new Error("riderId is required for document uploads");
      }

      console.log(
        `📤 Uploading file to S3 (industry standard): ${documentType} for rider ${riderId}`
      );

      const uploadStartTime = Date.now();

      // Map folder to proper document category
      const category: string =
        folder === "bank" ? "bank" : folder === "profile" ? "profile" : "kyc";

      // Upload using the shared S3Service with industry-standard path structure
      const result = await sharedS3Service.uploadFile(
        "riders",
        riderId,
        category,
        documentType,
        fileBuffer,
        originalName,
        {
          ...metadata,
          uploadedBy: "rider-service",
        }
      );

      const uploadDuration = Date.now() - uploadStartTime;
      console.log(
        `✅ S3 upload successful in ${uploadDuration}ms: ${result.key}`
      );

      return {
        key: result.key,
        location: result.url,
        bucket: result.bucket,
        size: fileSize,
        contentType: mimeType,
      };
    } catch (error) {
      console.error("❌ S3 upload error:", error);
      throw new Error(
        `Failed to upload file to S3: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, options)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("S3 multiple upload error:", error);
      throw new Error(
        `Failed to upload files to S3: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await sharedS3Service.deleteFile(key);
      console.log(`🗑️ Deleted file from S3: ${key}`);
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new Error(
        `Failed to delete file from S3: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get a presigned URL for temporary access to a file
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await sharedS3Service.getSignedUrl(key, expiresIn);
    } catch (error) {
      console.error("S3 presigned URL error:", error);
      throw new Error(
        `Failed to generate presigned URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      return await sharedS3Service.fileExists(key);
    } catch (error: any) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      return await sharedS3Service.getFileMetadata(key);
    } catch (error) {
      console.error("S3 metadata error:", error);
      throw new Error(
        `Failed to get file metadata: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate public URL for a file
   */
  generatePublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

export const s3Service = new S3Service();
