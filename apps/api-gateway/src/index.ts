import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import vehicleRoutes from './routes/vehicles';
import hubRoutes from './routes/hubs';
import clientStoreRoutes from './routes/client-store';
import riderRoutes from './routes/riders';

// Import middleware
import { authMiddleware } from './middleware/auth';

const app: Application = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5173'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'EV91 Platform API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      teams: '/api/teams/*',
      departments: '/api/departments/*',
      vehicles: '/api/vehicles/*',
      hubs: '/api/hubs/*',
      cities: '/api/cities/*',
      clients: '/api/clients/*',
      stores: '/api/stores/*',
      riders: '/api/riders/*',
      riderEarnings: '/api/rider-earnings/*'
    }
  });
});

// Apply authentication middleware to protected routes
app.use('/api/teams', authMiddleware);
app.use('/api/departments', authMiddleware);
app.use('/api/vehicles', authMiddleware);
app.use('/api/hubs', authMiddleware);
app.use('/api/cities', authMiddleware);
app.use('/api/clients', authMiddleware);
app.use('/api/stores', authMiddleware);
app.use('/api/riders', authMiddleware);
app.use('/api/rider-earnings', authMiddleware);

// Route configuration
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/departments', teamRoutes); // Departments are handled by team service
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/hubs', hubRoutes); // Dedicated hub routes
app.use('/api/cities', hubRoutes); // Cities are handled by hub service
app.use('/api', clientStoreRoutes); // Handles /clients, /stores, /rider-earnings
app.use('/api/riders', riderRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Gateway error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal gateway error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 EV91 Platform API Gateway listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Gateway endpoints: http://localhost:${PORT}/api/*`);
});
