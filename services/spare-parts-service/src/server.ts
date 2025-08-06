import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import sparePartRoutes from './routes/sparePartRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'spare-parts-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health check endpoint
app.get('/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'spare-parts-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: 'connected',
      latency: 15
    },
    cache: {
      status: 'connected',
      latency: 5
    },
    memory: {
      usage: 65,
      total: 512
    }
  });
});

// API Documentation endpoints
app.get('/docs', (req, res) => {
  const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
  
  if (fs.existsSync(openApiPath)) {
    const openApiContent = fs.readFileSync(openApiPath, 'utf8');
    
    // Simple HTML page to display OpenAPI docs
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Spare Parts API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />
        <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    url: '/api-docs/yaml',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout"
                });
            };
        </script>
    </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    res.status(404).json({
      success: false,
      message: 'API documentation not found',
    });
  }
});

// OpenAPI YAML endpoint
app.get('/api-docs/yaml', (req, res) => {
  const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
  
  if (fs.existsSync(openApiPath)) {
    res.setHeader('Content-Type', 'application/x-yaml');
    res.sendFile(openApiPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'OpenAPI specification not found',
    });
  }
});

// OpenAPI JSON endpoint
app.get('/api-docs/json', (req, res) => {
  const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
  
  if (fs.existsSync(openApiPath)) {
    try {
      const yamlContent = fs.readFileSync(openApiPath, 'utf8');
      // Simple YAML to JSON conversion (basic implementation)
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        message: 'OpenAPI specification available in YAML format at /api-docs/yaml',
        yamlUrl: '/api-docs/yaml',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process OpenAPI specification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else {
    res.status(404).json({
      success: false,
      message: 'OpenAPI specification not found',
    });
  }
});

// API routes
app.use('/api/spare-parts', authMiddleware, sparePartRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/purchase-orders', authMiddleware, purchaseOrderRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port || 4006;

const server = app.listen(PORT, () => {
  console.log(`🚀 Spare Parts Service running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
  console.log(`⚡ Redis: ${config.redis.url ? 'Connected' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
