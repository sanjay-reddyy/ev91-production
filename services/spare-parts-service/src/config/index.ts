import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Database Configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Redis Configuration
let redis: any = null;
if (process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  redis.on('error', (err: any) => console.log('Redis Client Error', err));
}

// Application Configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || '4006'),
  apiVersion: process.env.API_VERSION || 'v1',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '3'),
  },

  // External Services
  services: {
    vehicleService: process.env.VEHICLE_SERVICE_URL || 'http://localhost:4004',
    clientStoreService: process.env.CLIENT_STORE_SERVICE_URL || 'http://localhost:3004',
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  },

  // File Upload
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads/spare-parts',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(','),
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL || 'noreply@ev91platform.com',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/spare-parts-service.log',
  },

  // Business Configuration
  business: {
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '10'),
    criticalStockThreshold: parseInt(process.env.CRITICAL_STOCK_THRESHOLD || '5'),
    autoReorderEnabled: process.env.AUTO_REORDER_ENABLED === 'true',
    defaultMarkupPercentage: parseFloat(process.env.DEFAULT_MARKUP_PERCENTAGE || '20'),
  },

  // Security
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

// Validate required configuration
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

export { prisma, redis };
export default config;
