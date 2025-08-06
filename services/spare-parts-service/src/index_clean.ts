import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

// Load environment variables
dotenv.config();

import { config, prisma, redis } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import routes
import sparePartRoutes from './routes/sparePartRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();

// Load OpenAPI specification
let openApiSpec: any = {};
try {
  const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
  if (fs.existsSync(openApiPath)) {
    openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8'));
  }
} catch (error) {
  console.warn('OpenAPI specification not found or invalid:', error);
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// Request logging
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Spare Parts Service is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
  });
});

// Documentation endpoints
app.get('/docs', (req, res) => {
  // Enhanced HTML page with CDN fallback to local assets
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>EV91 Platform - Spare Parts API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
      <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" sizes="16x16" />
      <style>
          html { 
              box-sizing: border-box; 
              overflow: -moz-scrollbars-vertical; 
              overflow-y: scroll; 
          }
          *, *:before, *:after { 
              box-sizing: inherit; 
          }
          body { 
              margin: 0; 
              background: #fafafa; 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .swagger-ui .topbar {
              background-color: #2196f3;
          }
          .swagger-ui .topbar .topbar-wrapper .link {
              color: #fff;
          }
      </style>
  </head>
  <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
      <script>
          SwaggerUIBundle({
              url: '/api/docs/spec',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
              ],
              plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              validatorUrl: null,
              tryItOutEnabled: true,
              supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
              onComplete: function() {
                  console.log("Swagger UI loaded successfully");
              },
              onFailure: function(data) {
                  console.error("Failed to load Swagger UI:", data);
              }
          });
      </script>
  </body>
  </html>`;
  res.send(html);
});

// Serve OpenAPI specification
app.get('/api/docs/spec', (req, res) => {
  res.json(openApiSpec);
});

// Serve Swagger UI assets
app.use('/docs', swaggerUi.serve);

// Create API router
const apiRouter = express.Router();

// Apply authentication middleware to all API routes except documentation
apiRouter.use((req, res, next) => {
  // Skip auth for documentation endpoints
  if (req.path.includes('/docs')) {
    return next();
  }
  return authMiddleware(req, res, next);
});

// Mount route handlers
apiRouter.use('/spare-parts', sparePartRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/purchase-orders', purchaseOrderRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

// Mount API router
app.use(`/api/${config.apiVersion}`, apiRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    // Close Redis connection
    if (redis) {
      await redis.quit();
      console.log('Redis connection closed');
    }
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 Spare Parts Service running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Version: ${config.apiVersion}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📖 API Base URL: http://localhost:${PORT}/api/${config.apiVersion}`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;
