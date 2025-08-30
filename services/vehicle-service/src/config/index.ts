import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/vehicle_db",
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },

  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    team: process.env.TEAM_SERVICE_URL || "http://localhost:3002",
    clientStore:
      process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3004",
    rider: process.env.RIDER_SERVICE_URL || "http://localhost:3005",
  },

  // External API configuration
  external: {
    // Add any external API configurations here
    // e.g., vehicle data providers, insurance APIs, etc.
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // File upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || "5MB",
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  },

  // AWS S3 configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "ap-south-1",
    s3Bucket: process.env.AWS_S3_BUCKET || "ev91-vehicle-documents",
    s3BaseUrl:
      process.env.S3_BASE_URL ||
      "https://ev91-vehicle-documents.s3.ap-south-1.amazonaws.com",
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

export default config;
