import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Entity types for document organization
 */
export type EntityType = "riders" | "vehicles" | "stores" | "system";

/**
 * Document categories for better organization
 */
export type DocumentCategory =
  | "kyc"
  | "bank"
  | "profile"
  | "insurance"
  | "registration"
  | "puc"
  | "photos"
  | "documents"
  | "exports"
  | "reports";

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
}

/**
 * S3 Service Configuration
 */
export interface S3ServiceConfig {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
}

/**
 * Industry-standard S3 Document Storage Service
 *
 * Features:
 * - Structured path hierarchy: {entityType}/{entityId}/{category}/{documentType}_{timestamp}.{ext}
 * - Server-side encryption (AES256)
 * - Pre-signed URLs for secure temporary access
 * - Rich metadata tracking
 * - Proper content-type handling
 * - File validation
 *
 * @example
 * ```typescript
 * const s3Service = new S3Service();
 *
 * // Upload a document
 * const result = await s3Service.uploadFile(
 *   'riders',
 *   'R123456',
 *   'kyc',
 *   'aadhaar-front',
 *   fileBuffer,
 *   'aadhaar.jpg',
 *   { uploadedBy: 'admin123' }
 * );
 *
 * // Get a secure temporary URL
 * const url = await s3Service.getSignedUrl(result.key, 3600);
 * ```
 */
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(config?: S3ServiceConfig) {
    this.region = config?.region || process.env.AWS_REGION || "ap-south-1";
    this.bucketName =
      config?.bucket || process.env.AWS_S3_BUCKET || "ev91-documents-prod";

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey:
          config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  /**
   * Upload a file to S3 with industry-standard path structure
   *
   * @param entityType - Type of entity (riders, vehicles, stores, system)
   * @param entityId - Unique identifier of the entity
   * @param category - Document category (kyc, bank, insurance, etc.)
   * @param documentType - Specific document type (aadhaar-front, insurance-policy, etc.)
   * @param fileBuffer - File data as Buffer
   * @param originalFilename - Original filename
   * @param metadata - Additional metadata to store with the file
   * @returns Upload result with URL and S3 key
   */
  async uploadFile(
    entityType: EntityType,
    entityId: string,
    category: DocumentCategory,
    documentType: string,
    fileBuffer: Buffer,
    originalFilename: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const timestamp = Date.now();
      const extension = this.getFileExtension(originalFilename);
      const sanitizedFilename = this.sanitizeFilename(originalFilename);

      // Industry-standard key structure:
      // {entityType}/{entityId}/{category}/{documentType}_{timestamp}.{ext}
      const key = `${entityType}/${entityId}/${category}/${documentType}_${timestamp}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: this.getContentType(extension),
        Metadata: {
          originalFilename: sanitizedFilename,
          uploadedAt: new Date().toISOString(),
          entityType,
          entityId,
          category,
          documentType,
          ...metadata,
        },
        // Security settings
        ServerSideEncryption: "AES256", // Encrypt at rest
        ACL: "private", // Private by default - use pre-signed URLs for access
      });

      await this.s3Client.send(command);

      // Construct the S3 URL (note: this is not publicly accessible)
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      console.log(`✅ File uploaded successfully to S3: ${key}`);

      return {
        success: true,
        url,
        key,
        bucket: this.bucketName,
      };
    } catch (error) {
      console.error("❌ S3 Upload Error:", error);
      throw new Error(
        `Failed to upload file to S3: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate a pre-signed URL for secure temporary access to a private S3 object
   *
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Pre-signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      console.log(
        `✅ Generated signed URL for: ${key} (expires in ${expiresIn}s)`
      );

      return signedUrl;
    } catch (error) {
      console.error("❌ Error generating signed URL:", error);
      throw new Error(
        `Failed to generate signed URL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete a file from S3
   *
   * @param key - S3 object key to delete
   * @returns True if deletion successful
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      console.log(`✅ File deleted from S3: ${key}`);

      return true;
    } catch (error) {
      console.error("❌ S3 Delete Error:", error);
      throw new Error(
        `Failed to delete file from S3: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check if a file exists in S3
   *
   * @param key - S3 object key to check
   * @returns True if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      console.error("❌ Error checking file existence:", error);
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   *
   * @param key - S3 object key
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Metadata || null;
    } catch (error) {
      console.error("❌ Error getting file metadata:", error);
      return null;
    }
  }

  /**
   * Validate file before upload
   *
   * @param fileBuffer - File data
   * @param filename - Filename
   * @param maxSizeBytes - Maximum allowed file size (default: 10MB)
   * @param allowedTypes - Allowed MIME types
   */
  validateFile(
    fileBuffer: Buffer,
    filename: string,
    maxSizeBytes: number = 10 * 1024 * 1024, // 10MB default
    allowedTypes?: string[]
  ): { valid: boolean; error?: string } {
    // Check file size
    if (fileBuffer.length > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${
          maxSizeBytes / (1024 * 1024)
        }MB`,
      };
    }

    // Check file type if specified
    if (allowedTypes) {
      const extension = this.getFileExtension(filename);
      const contentType = this.getContentType(extension);

      if (!allowedTypes.includes(contentType)) {
        return {
          valid: false,
          error: `File type ${contentType} is not allowed. Allowed types: ${allowedTypes.join(
            ", "
          )}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Sanitize filename to remove special characters
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  /**
   * Get appropriate content type based on file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      // Text
      txt: "text/plain",
      csv: "text/csv",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
    };

    return contentTypes[extension.toLowerCase()] || "application/octet-stream";
  }

  /**
   * Get bucket name (useful for logging/debugging)
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Get region (useful for logging/debugging)
   */
  getRegion(): string {
    return this.region;
  }
}

// Export a singleton instance for convenience
export const s3Service = new S3Service();
