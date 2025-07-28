import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware for JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }
  
  // TODO: Implement JWT verification
  // For now, just pass through - implement actual JWT verification later
  next();
};

/**
 * API Key authentication middleware
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;
  
  if (!expectedApiKey) {
    return res.status(500).json({
      success: false,
      message: 'API key not configured',
    });
  }
  
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
  }
  
  next();
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Extract user role from JWT token
    // For now, just pass through - implement actual role checking later
    const userRole = 'user'; // This would come from JWT payload
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
};

/**
 * CORS middleware with custom configuration
 */
export const customCors = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:4002',
    'http://localhost:3000',
    'http://localhost:8081',  // Expo development server
    'exp://192.168.1.35:8081', // Expo LAN
    'exp://localhost:8081',   // Expo localhost
    'http://192.168.1.35:8081', // Direct IP access
  ];
  const origin = req.headers.origin;
  
  // Allow all origins in development mode
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-Id, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};
