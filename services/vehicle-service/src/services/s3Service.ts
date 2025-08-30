import AWS from "aws-sdk";
import { config } from "../config";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Configure AWS SDK
AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const s3 = new AWS.S3();

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
   * Upload a single file to S3
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

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;

      // Create S3 key with folder structure
      const s3Key = vehicleId
        ? `vehicles/${vehicleId}/${folder}/${fileName}`
        : `temp/${folder}/${fileName}`;

      // Prepare upload parameters
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: "inline",
        Metadata: {
          originalName: file.originalname,
          mediaType: mediaType,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      };

      // Upload to S3
      const result = await s3.upload(uploadParams).promise();

      return {
        key: s3Key,
        location: result.Location,
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
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await s3.deleteObject(deleteParams).promise();
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
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      };

      return s3.getSignedUrl("getObject", params);
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
      await s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      return true;
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
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      return await s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error("S3 metadata error:", error);
      throw new Error(
        `Failed to get file metadata: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * List files in a specific folder
   */
  async listFiles(prefix: string): Promise<AWS.S3.Object[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error("S3 list error:", error);
      throw new Error(
        `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Copy a file within S3 (useful for moving from temp to permanent location)
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const copyParams: AWS.S3.CopyObjectRequest = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      };

      await s3.copyObject(copyParams).promise();
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
