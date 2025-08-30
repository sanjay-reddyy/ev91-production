const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const vehicleRoutes = require('./routes/vehicles');
const clientStoreRoutes = require('./routes/client-store');
const riderRoutes = require('./routes/riders');
const sparePartsRoutes = require('./routes/spare-parts');

// Import middleware
const { authMiddleware } = require('./middleware/auth');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:3001', 
    'http://localhost:5173', 
    'http://localhost:8081', // Expo development server
    'http://192.168.1.37:8081', // Mobile network access
    'http://192.168.1.35:8081', // Alternative mobile network
    'exp://localhost:19000', // Expo development URLs
    'exp://192.168.1.37:19000',
    'exp://192.168.1.35:19000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EV91 Platform API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      riderRegister: '/api/rider-register/*',
      teams: '/api/teams/*',
      departments: '/api/departments/*',
      vehicles: '/api/vehicles/*',
      clients: '/api/clients/*',
      stores: '/api/stores/*',
      riders: '/api/riders/*',
      riderEarnings: '/api/rider-earnings/*',
      spareParts: '/api/spare-parts/*'
    }
  });
});

// Apply authentication middleware to protected routes
app.use('/api/teams', authMiddleware);
app.use('/api/departments', authMiddleware);
app.use('/api/vehicles', authMiddleware);
app.use('/api/clients', authMiddleware);
app.use('/api/stores', authMiddleware);
app.use('/api/riders', authMiddleware);
app.use('/api/rider-earnings', authMiddleware);
app.use('/api/spare-parts', authMiddleware);

// Route configuration
app.use('/api/auth', authRoutes);
app.use('/api/rider-register', riderRoutes); // Public rider registration (no auth required)
app.use('/api/teams', teamRoutes);
app.use('/api/departments', teamRoutes); // Departments are handled by team service
app.use('/api/vehicles', vehicleRoutes);
app.use('/api', clientStoreRoutes); // Handles /clients, /stores, /rider-earnings
app.use('/api/riders', riderRoutes);
app.use('/api/spare-parts', sparePartsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Gateway error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal gateway error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 EV91 Platform API Gateway listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Gateway endpoints: http://localhost:${PORT}/api/*`);
});
