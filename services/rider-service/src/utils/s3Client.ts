import AWS from "aws-sdk";
import { env } from "../config/env";
import crypto from "crypto";

// Configure AWS SDK
const awsConfig = {
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
};

// Check if AWS configuration is complete
const hasValidAwsConfig = () => {
  const isValid = !!(
    env.AWS_REGION &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_S3_BUCKET
  );

  // Log AWS configuration status for debugging
  console.log(`AWS Configuration check: ${isValid ? "VALID" : "INVALID"}`, {
    region: env.AWS_REGION ? "✓" : "✗",
    accessKeyId: env.AWS_ACCESS_KEY_ID ? "✓" : "✗",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ? "✓" : "✗",
    bucket: env.AWS_S3_BUCKET ? "✓" : "✗",
  });

  return isValid;
};

// Log AWS credentials for debugging (without showing full secret)
const accessKeyIdPreview = env.AWS_ACCESS_KEY_ID
  ? `${env.AWS_ACCESS_KEY_ID.substring(
      0,
      5
    )}...${env.AWS_ACCESS_KEY_ID.substring(env.AWS_ACCESS_KEY_ID.length - 4)}`
  : "missing";

const secretKeyPreview = env.AWS_SECRET_ACCESS_KEY
  ? `${env.AWS_SECRET_ACCESS_KEY.substring(
      0,
      3
    )}...${env.AWS_SECRET_ACCESS_KEY.substring(
      env.AWS_SECRET_ACCESS_KEY.length - 3
    )}`
  : "missing";

console.log(`S3 Client Initialization:`, {
  region: env.AWS_REGION || "missing",
  accessKeyId: accessKeyIdPreview,
  secretKeyPreview: secretKeyPreview,
  bucket: env.AWS_S3_BUCKET || "missing",
  hasValidConfig: hasValidAwsConfig(),
});

// Create S3 client with increased timeout and retry settings
const s3 = new AWS.S3({
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  httpOptions: {
    timeout: 90000, // 90 seconds
    connectTimeout: 15000, // 15 seconds
  },
  maxRetries: 5,
});

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
  // Validate input parameters
  if (!file || file.length === 0) {
    throw new Error("Empty file buffer provided to uploadToS3");
  }

  if (!key || key.trim() === "") {
    throw new Error("Invalid S3 key provided to uploadToS3");
  }

  if (!contentType) {
    console.warn(
      "No content type provided, defaulting to application/octet-stream"
    );
    contentType = "application/octet-stream";
  }

  // If AWS credentials are missing, return a mock URL
  if (!hasValidAwsConfig()) {
    console.log(
      "⚠️ AWS configuration is invalid or incomplete - cannot upload to S3"
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

  // Add timeout and retry mechanism to the S3 upload to prevent hanging indefinitely
  const uploadWithTimeout = async () => {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    while (retryCount <= MAX_RETRIES) {
      try {
        return await new Promise<AWS.S3.ManagedUpload.SendData>(
          (resolve, reject) => {
            // Set a timeout of 45 seconds
            const timeout = setTimeout(() => {
              reject(new Error("S3 upload timeout after 45 seconds"));
            }, 45000);

            // Calculate progress percentage for better logging
            let lastLogged = 0;

            s3.upload(params)
              .on("httpUploadProgress", (progress) => {
                // Only log progress every 10% to avoid log spam
                const percent = Math.round(
                  (progress.loaded / progress.total) * 100
                );
                if (percent >= lastLogged + 10 || percent === 100) {
                  lastLogged = Math.floor(percent / 10) * 10;
                  console.log(
                    `S3 upload progress for ${key}: ${percent}% (${progress.loaded}/${progress.total} bytes)`
                  );
                }
              })
              .promise()
              .then((data: AWS.S3.ManagedUpload.SendData) => {
                clearTimeout(timeout);
                resolve(data);
              })
              .catch((err: Error) => {
                clearTimeout(timeout);
                reject(err);
              });
          }
        );
      } catch (error) {
        lastError = error as Error;
        retryCount++;

        if (retryCount <= MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          console.log(
            `S3 upload attempt ${retryCount} failed. Retrying in ${
              delayMs / 1000
            }s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          console.error(`S3 upload failed after ${MAX_RETRIES} retries`);
          throw lastError;
        }
      }
    }

    // This should never happen but TypeScript needs a return
    throw new Error("Unexpected end of retry loop");
  };

  try {
    const result = await uploadWithTimeout();
    console.log(`✅ S3 upload successful: ${result.Location}`);

    // Construct URL using S3_BASE_URL from environment if available
    // This ensures consistent URL format across the application
    let finalUrl = result.Location;
    if (env.S3_BASE_URL) {
      // Use the configured base URL instead of AWS SDK's Location
      finalUrl = `${env.S3_BASE_URL}/${key}`;
      console.log(`🔄 Using configured S3_BASE_URL: ${finalUrl}`);
    }

    return finalUrl;
  } catch (error: unknown) {
    // Properly type the error for better error handling
    const typedError = error as Error;

    // Enhanced error logging
    console.error("❌ S3 upload error:", {
      message: typedError.message,
      stack: typedError.stack?.split("\n").slice(0, 3).join("\n"),
      key: key,
      bucket: env.AWS_S3_BUCKET,
      contentType: contentType,
      fileSize: file.length,
    });

    // Log additional AWS details if available
    if ((error as AWS.AWSError).code) {
      const awsError = error as AWS.AWSError;
      console.error(`AWS Error Details:`, {
        code: awsError.code,
        requestId: awsError.requestId,
        statusCode: awsError.statusCode,
        time: awsError.time,
      });

      // Handle specific AWS error codes with more informative messages
      switch (awsError.code) {
        case "AccessDenied":
          console.error(
            "❌ Access denied to S3 bucket. Check IAM permissions for the access key."
          );
          break;
        case "NoSuchBucket":
          console.error(
            `❌ Bucket ${env.AWS_S3_BUCKET} does not exist. Please create it first.`
          );
          break;
        case "InvalidAccessKeyId":
          console.error(
            "❌ Invalid AWS access key. Check your AWS_ACCESS_KEY_ID environment variable."
          );
          break;
        case "SignatureDoesNotMatch":
          console.error(
            "❌ AWS signature validation failed. Check your AWS_SECRET_ACCESS_KEY environment variable."
          );
          break;
        case "NetworkingError":
        case "TimeoutError":
          console.error(
            `❌ Network or timeout error. Check your internet connection and AWS region settings.`
          );
          break;
        case "ThrottlingException":
          console.error(
            `❌ AWS request throttled. Consider implementing more robust rate limiting.`
          );
          break;
      }
    }

    // Test S3 bucket existence and permissions
    try {
      console.log(`🔍 Testing S3 bucket access for troubleshooting...`);
      s3.headBucket({ Bucket: env.AWS_S3_BUCKET })
        .promise()
        .then(() =>
          console.log(
            `✅ S3 bucket ${env.AWS_S3_BUCKET} exists and is accessible`
          )
        )
        .catch((err) =>
          console.error(`❌ S3 bucket error: ${err.code} - ${err.message}`)
        );
    } catch (bucketError) {
      console.error(`Failed to test bucket: ${(bucketError as Error).message}`);
    }

    // Only use fallback in development
    if (env.NODE_ENV !== "production") {
      const fallbackUrl = `https://fallback-storage.ev91platform.dev/${key}`;
      console.log(`🔄 Using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }

    throw new Error(`Failed to upload file to S3: ${typedError.message}`);
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
