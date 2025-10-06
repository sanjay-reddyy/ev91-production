import AWS from "aws-sdk";
import { env } from "../config/env";
import crypto from "crypto";

// Configure AWS SDK
const awsConfig = {
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
};

// Create S3 client with increased timeout and retry settings
const s3 = new AWS.S3({
  ...awsConfig,
  httpOptions: {
    timeout: 15000, // 15 seconds
    connectTimeout: 5000, // 5 seconds
  },
  maxRetries: 3,
});

// Check if AWS configuration is complete
const hasValidAwsConfig = () => {
  return !!(
    env.AWS_REGION &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_S3_BUCKET
  );
};

/**
 * Upload a file to S3 bucket with fallback for development
 * @param file - The file buffer to upload
 * @param key - The S3 object key (path)
 * @param contentType - MIME type of the file
 * @returns URL of the uploaded file
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  // If AWS credentials are missing or we're in development mode, return a mock URL
  if (!hasValidAwsConfig() || env.NODE_ENV === "development") {
    console.log(
      "⚠️ Using development mode for file storage (S3 upload skipped)"
    );

    // Generate a stable mock URL based on the file content and key
    const fileHash = crypto
      .createHash("md5")
      .update(file)
      .digest("hex")
      .substring(0, 10);

    // Create a mock URL that would be stable for the same file content
    return `https://mock-s3-storage.ev91platform.dev/${key}?hash=${fileHash}`;
  }

  // Log upload attempt with file details but not the actual content
  console.log(
    `📤 Uploading file to S3: ${key} (${file.length} bytes, ${contentType})`
  );

  const params = {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: "private",
  };

  // Add timeout to the S3 upload to prevent hanging indefinitely
  const uploadWithTimeout = async () => {
    return new Promise<AWS.S3.ManagedUpload.SendData>((resolve, reject) => {
      // Set a timeout of 15 seconds
      const timeout = setTimeout(() => {
        reject(new Error("S3 upload timeout after 15 seconds"));
      }, 15000);

      s3.upload(params)
        .promise()
        .then((data) => {
          clearTimeout(timeout);
          resolve(data);
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  };

  try {
    const result = await uploadWithTimeout();
    console.log(`✅ S3 upload successful: ${result.Location}`);
    return result.Location;
  } catch (error) {
    console.error("❌ S3 upload error:", error);

    // In case of error, provide a fallback URL for development/testing
    if (env.NODE_ENV === "development") {
      const fallbackUrl = `https://fallback-storage.ev91platform.dev/${key}`;
      console.log(`🔄 Using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }

    throw new Error(`Failed to upload file: ${(error as Error).message}`);
  }
}

/**
 * Generate a pre-signed URL for temporary file access
 * @param key - The S3 object key
 * @param expirationSeconds - URL expiration time in seconds (default: 3600)
 * @returns Pre-signed URL
 */
export function getSignedUrl(key: string, expirationSeconds = 3600): string {
  const params = {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Expires: expirationSeconds,
  };

  return s3.getSignedUrl("getObject", params);
}

export { s3 };
