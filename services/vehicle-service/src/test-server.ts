import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes with simple auth for testing
import vehicleRoutes from './routes/vehicles';
import serviceRoutes from './routes/service';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Security middleware
app.use(helmet());

// CORS configuration (dynamic origin)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(loggerMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'Vehicle Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Vehicle Inventory Management Service',
    version: '1.0.0',
    health: '/health',
    endpoints: {
      vehicles: '/api/v1/vehicles',
      service: '/api/v1/service'
    }
  });
});

// API Routes (without auth for testing)
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/service', serviceRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4004;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Vehicle Service listening on port ${PORT}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 Available endpoints:`);
      console.log(`   GET  /api/v1/vehicles - List vehicles`);
      console.log(`   POST /api/v1/vehicles - Create vehicle`);
      console.log(`   GET  /api/v1/service - List service records`);
      console.log(`   POST /api/v1/service - Create service record`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
