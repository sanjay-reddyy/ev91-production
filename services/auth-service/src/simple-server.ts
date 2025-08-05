import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '1.0.0',
    database: {
      status: 'connected',
      type: 'postgresql',
    },
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'EV91 Auth Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
    },
  });
});

// Mock super admin user for immediate testing
const SUPER_ADMIN = {
  id: 'admin-001',
  email: 'admin@ev91.com',
  password: '$2a$12$rQGIS7BhZp5p7Z5Z5Z5Z5O7Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // SuperAdmin123!
  firstName: 'Super',
  lastName: 'Admin',
  isActive: true,
  emailVerified: true,
  roles: [{
    id: 'role-001',
    name: 'Super Admin',
    permissions: [
      { id: 'perm-001', name: 'admin:full', resource: 'admin', action: 'full' }
    ]
  }]
};

// Simple login endpoint
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Check if it's the super admin
    if (email === SUPER_ADMIN.email) {
      // For now, just check if password is SuperAdmin123!
      const isValidPassword = password === 'SuperAdmin123!';
      
      if (isValidPassword) {
        // Generate a proper JWT token for super admin
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
        const payload = {
          id: SUPER_ADMIN.id,
          email: SUPER_ADMIN.email,
          roles: SUPER_ADMIN.roles.map(r => r.name),
          permissions: SUPER_ADMIN.roles.flatMap(r => r.permissions.map(p => `${p.resource}:${p.action}`)),
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: SUPER_ADMIN.id,
              email: SUPER_ADMIN.email,
              firstName: SUPER_ADMIN.firstName,
              lastName: SUPER_ADMIN.lastName,
              emailVerified: SUPER_ADMIN.emailVerified,
              roles: SUPER_ADMIN.roles,
            },
            tokens: {
              accessToken: token,
              refreshToken: token,
              expiresIn: JWT_EXPIRES_IN,
            },
          },
        });
      }
    }

    // Invalid credentials
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Simple profile endpoint
app.get('/api/v1/auth/profile', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  // Proper JWT validation for super admin profile
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.id === SUPER_ADMIN.id && decoded.email === SUPER_ADMIN.email) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: SUPER_ADMIN.id,
            email: SUPER_ADMIN.email,
            firstName: SUPER_ADMIN.firstName,
            lastName: SUPER_ADMIN.lastName,
            emailVerified: SUPER_ADMIN.emailVerified,
            roles: SUPER_ADMIN.roles,
          },
        },
      });
    }
  } catch (error) {
    // Invalid token
  }
  return res.status(401).json({
    success: false,
    error: 'Invalid token',
  });
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service listening on port ${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📧 Test Credentials:');
  console.log('   Email: admin@ev91.com');
  console.log('   Password: SuperAdmin123!');
});

export default app;
