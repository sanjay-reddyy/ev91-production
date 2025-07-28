import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors from express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};

/**
 * Middleware to parse and validate request body size
 */
export const validateRequestSize = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Request body too large. Maximum size: ${maxSize}`,
      });
    }
    
    next();
  };
};

/**
 * Middleware to add request ID for tracking
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-Id', req.headers['x-request-id']);
  next();
};

/**
 * Middleware to log requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'];
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Request ID: ${requestId}`);
  });
  
  next();
};

/**
 * Rate limiting middleware
 */
export const rateLimitByEndpoint = (maxRequests: number, windowMs: number) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [k, v] of requestCounts.entries()) {
      if (v.resetTime < windowStart) {
        requestCounts.delete(k);
      }
    }
    
    const current = requestCounts.get(key);
    
    if (!current) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (current.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      });
    }
    
    current.count++;
    next();
  };
};

// Helper functions
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) throw new Error(`Invalid size format: ${size}`);
  
  const [, value, unit] = match;
  return parseFloat(value) * units[unit];
}

function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
