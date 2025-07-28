import { Request, Response, NextFunction } from 'express';
import { PermissionCheck } from '../types/auth';
import { JwtService } from '../utils/jwt';
import { AuthService } from '../services/authService';

export class RBACMiddleware {
  /**
   * Authentication middleware - verifies JWT token
   */
  static async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Access token required',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = JwtService.verifyAccessToken(token);
      
      // Fetch full user data with roles and permissions
      const user = await AuthService.getUserWithRoles(payload.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  }

  /**
   * Authorization middleware - checks permissions
   */
  static authorize(permissions: PermissionCheck | PermissionCheck[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userPermissions = req.user.roles.flatMap((role: any) => 
        role.permissions.map((p: any) => `${p.resource}:${p.action}`)
      );

      const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions];
      
      const hasPermission = permissionsToCheck.every(permission => {
        const requiredPermission = `${permission.resource}:${permission.action}`;
        return userPermissions.includes(requiredPermission);
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: permissionsToCheck,
        });
      }

      next();
    };
  }

  /**
   * Role-based authorization middleware
   */
  static requireRole(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userRoles = req.user.roles.map((role: any) => role.name);
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient role privileges',
          required: requiredRoles,
          current: userRoles,
        });
      }

      next();
    };
  }

  /**
   * Super admin only access
   */
  static requireSuperAdmin() {
    return RBACMiddleware.requireRole('super_admin');
  }

  /**
   * Admin level access (super_admin or admin)
   */
  static requireAdmin() {
    return RBACMiddleware.requireRole(['super_admin', 'admin']);
  }
}
