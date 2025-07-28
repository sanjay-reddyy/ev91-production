import AWS from 'aws-sdk';
import 'dotenv/config';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const uploadToS3 = async (fileBuffer: Buffer, fileName: string, mimeType: string) => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('AWS_S3_BUCKET not set');
  const params = {
    Bucket: bucket,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'private',
  };
  const result = await s3.upload(params).promise();
  return result.Location;
};
