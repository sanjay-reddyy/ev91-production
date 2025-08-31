import dotenv from "dotenv";
dotenv.config();

// Environment variables with validation
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4005", 10),
  DATABASE_URL: process.env.DATABASE_URL || "file:../prisma/dev.db",

  // KYC Provider
  KYC_PROVIDER_URL:
    process.env.KYC_PROVIDER_URL || "https://sandbox.kyc-provider.com/api",
  KYC_PROVIDER_KEY: process.env.KYC_PROVIDER_KEY || "",

  // Digilocker Integration
  DIGILOCKER_API_URL:
    process.env.DIGILOCKER_API_URL || "https://sandbox.digilocker.gov.in/api",
  DIGILOCKER_API_KEY: process.env.DIGILOCKER_API_KEY || "",

  // E-Sign Provider
  ESIGN_PROVIDER_URL:
    process.env.ESIGN_PROVIDER_URL || "https://sandbox.esign-provider.com/api",
  ESIGN_PROVIDER_KEY: process.env.ESIGN_PROVIDER_KEY || "",

  // AWS S3
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "",

  // SMS Provider (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",
};

// ...existing code...
