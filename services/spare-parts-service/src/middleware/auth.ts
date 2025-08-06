import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Add user information to request
      req.user = {
        id: decoded.id || decoded.userId,
        username: decoded.username || decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredPermissions,
        userPermissions,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as any;
          req.user = {
            id: decoded.id || decoded.userId,
            username: decoded.username || decoded.email,
            role: decoded.role || 'user',
            permissions: decoded.permissions || [],
          };
        } catch (jwtError) {
          // Token is invalid, but we don't fail - just continue without user
          req.user = undefined;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};
