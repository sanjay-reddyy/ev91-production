import AWS from 'aws-sdk';
import { env } from '../config/env';

// Configure AWS SDK
AWS.config.update({
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

// Create S3 client
const s3 = new AWS.S3();

/**
 * Upload a file to S3 bucket
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
  const params = {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'private',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
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

  return s3.getSignedUrl('getObject', params);
}

export { s3 };
