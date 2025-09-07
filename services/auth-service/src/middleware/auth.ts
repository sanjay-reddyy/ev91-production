import { Request, Response, NextFunction } from "express";
import { PermissionCheck } from "../types/auth";
import { JwtService } from "../utils/jwt";
import { AuthService } from "../services/authService";

/**
 * Authentication middleware - verifies JWT token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Access token required",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = JwtService.verifyAccessToken(token);

    // Fetch full user data with roles and permissions
    const user = await AuthService.getUserWithRoles(payload.userId);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: "User not found or inactive",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
    return;
  }
};

/**
 * Require employee context middleware - checks if authenticated user has employee record
 */
export const requireEmployee = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return;
  }

  // Check if user has employee context
  if (!(req.user as any).employee) {
    res.status(403).json({
      success: false,
      error: "Employee access required - user must have an employee record",
    });
    return;
  }

  next();
};

/**
 * Permission check middleware factory
 */
export const requirePermission = (
  service: string,
  resource: string,
  action: string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    // Super Admin bypass - always allow if user has Super Admin role
    const isSuperAdmin = req.user.roles.some(
      (role) => role.name === "Super Admin"
    );

    if (isSuperAdmin) {
      console.log(`Super Admin bypass for ${service}:${resource}:${action}`);
      next();
      return;
    }

    // Check if user has the required permission
    const hasPermission = req.user.roles.some((role) =>
      role.permissions.some((permission) => {
        return (
          permission.service === service &&
          permission.resource === resource &&
          permission.action === action
        );
      })
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${service}:${resource}:${action}`,
      });
      return;
    }

    next();
  };
};

/**
 * Role check middleware factory
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => role.name === requiredRole);

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${requiredRole}`,
      });
      return;
    }

    next();
  };
};

/**
 * Admin only middleware - allow Super Admin access
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "User not authenticated",
    });
    return;
  }

  // Check for Super Admin role
  const isSuperAdmin = req.user.roles.some(
    (role) => role.name === "Super Admin"
  );

  // Check for legacy ADMIN role
  const isAdmin = req.user.roles.some((role) => role.name === "ADMIN");

  if (!isSuperAdmin && !isAdmin) {
    res.status(403).json({
      success: false,
      error: "Access denied. Admin role required.",
    });
    return;
  }

  next();
};

/**
 * Super admin only middleware
 */
export const superAdminOnly = requireRole("SUPER_ADMIN");
