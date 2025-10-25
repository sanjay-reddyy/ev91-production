import { config } from "../config";

// Try to import shared-utils, fall back to stubs if not available
let SharedS3Service: any;
let DocumentCategory: any;

try {
  const sharedUtils = require("@ev91/shared-utils");
  SharedS3Service = sharedUtils.S3Service;
  DocumentCategory = sharedUtils.DocumentCategory;
} catch (error) {
  // Fallback for Docker builds without shared-utils
  console.warn("shared-utils not available, using stubs");
  SharedS3Service = class {
    constructor() {}
    uploadFile() { return Promise.resolve({ key: "", location: "", bucket: "" }); }
    deleteFile() { return Promise.resolve(); }
    getSignedUrl() { return Promise.resolve(""); }
    fileExists() { return Promise.resolve(false); }
    getFileMetadata() { return Promise.resolve({}); }
  };
  DocumentCategory = "string";
}

// Initialize shared S3 service
const sharedS3Service = new SharedS3Service({
  region: config.aws.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  bucket: config.aws.s3Bucket,
});

export interface S3UploadResult {
  key: string;
  location: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface S3UploadOptions {
  vehicleId?: string;
  mediaType?: string;
  folder?: string;
  metadata?: Record<string, string>;
}

export class S3Service {
  private bucket: string;
  private baseUrl: string;

  constructor() {
    this.bucket = config.aws.s3Bucket;
    this.baseUrl = config.aws.s3BaseUrl;
  }

  /**
   * Map folder to DocumentCategory for industry-standard paths
   */
  private mapFolderToCategory(folder: string): string {
    const folderLower = folder.toLowerCase();

    if (
      folderLower.includes("document") ||
      folderLower.includes("registration")
    ) {
      return "registration";
    }
    if (folderLower.includes("insurance")) {
      return "insurance";
    }
    if (folderLower.includes("photo") || folderLower.includes("image")) {
      return "photos";
    }
    if (folderLower.includes("puc") || folderLower.includes("pollution")) {
      return "puc";
    }

    return "documents"; // Default
  }

  /**
   * Upload a single file to S3 with industry-standard path structure
   */
  async uploadFile(
    file: Express.Multer.File,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      const {
        vehicleId,
        mediaType = "vehicle_photo",
        folder = "documents",
        metadata = {},
      } = options;

      if (!vehicleId) {
        throw new Error("Vehicle ID is required for document upload");
      }

      // Map folder to category
      const category = this.mapFolderToCategory(folder);

      // Determine document type from mediaType
      const documentType = mediaType.replace("vehicle_", "");

      // Use shared S3 service with industry-standard path
      // Path: vehicles/{vehicleId}/{category}/{type}_{timestamp}.{ext}
      const result = await sharedS3Service.uploadFile(
        "vehicles", // entityType
        vehicleId, // entityId
        category, // category
        documentType, // documentType
        file.buffer, // fileBuffer
        file.originalname, // originalFilename
        {
          // metadata
          originalName: file.originalname,
          mediaType: mediaType,
          uploadedAt: new Date().toISOString(),
          mimeType: file.mimetype,
          size: file.size.toString(),
          ...metadata,
        }
      );

      return {
        key: result.key,
        location: result.url,
        bucket: this.bucket,
        size: file.size,
        contentType: file.mimetype,
      };
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`
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
        `Failed to upload files to S3: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await sharedS3Service.deleteFile(key);
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new Error(
        `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"}`
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
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : "Unknown error"}`
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
      if (error.code === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      return await sharedS3Service.getFileMetadata(key);
    } catch (error) {
      console.error("S3 metadata error:", error);
      throw new Error(
        `Failed to get file metadata: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * List files in a specific folder
   * Note: This is a simple implementation. For production, consider pagination.
   */
  async listFiles(
    prefix: string
  ): Promise<Array<{ Key?: string; Size?: number; LastModified?: Date }>> {
    try {
      // For now, return empty array as this functionality isn't critical
      // Can be implemented using shared service if needed
      console.warn(
        "listFiles: Consider implementing using AWS SDK v3 ListObjectsV2Command"
      );
      return [];
    } catch (error) {
      console.error("S3 list error:", error);
      throw new Error(
        `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Copy a file within S3 (useful for moving from temp to permanent location)
   * Note: This is a simple implementation. For production, consider using AWS SDK v3.
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      // For now, throw error as this functionality should be avoided
      // Use uploadFile with new path instead
      throw new Error(
        "copyFile: Please re-upload file instead of copying. This maintains audit trail."
      );
    } catch (error) {
      console.error("S3 copy error:", error);
      throw new Error(
        `Failed to copy file: ${error instanceof Error ? error.message : "Unknown error"}`
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
