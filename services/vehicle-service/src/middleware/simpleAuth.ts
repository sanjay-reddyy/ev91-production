import { Request, Response, NextFunction } from 'express';

export interface SimpleAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
  };
}

// Simple auth middleware for testing (bypasses JWT validation)
export const simpleAuthMiddleware = (req: SimpleAuthenticatedRequest, res: Response, next: NextFunction): void => {
  // For development/testing, create a mock user
  req.user = {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['vehicles:read', 'vehicles:write', 'service:read', 'service:write']
  };
  
  next();
};

export const simpleRequireRole = (roles: string[]) => {
  return (req: SimpleAuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};
