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
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = JwtService.verifyAccessToken(token);

    // Fetch full user data with roles and permissions
    const user = await AuthService.getUserWithRoles(payload.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "User not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
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
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Super Admin bypass - always allow if user has Super Admin role
    const isSuperAdmin = req.user.roles.some(
      (role) => role.name === "Super Admin"
    );

    if (isSuperAdmin) {
      console.log(`Super Admin bypass for ${service}:${resource}:${action}`);
      return next();
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
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${service}:${resource}:${action}`,
      });
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
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const hasRole = req.user.roles.some((role) => role.name === requiredRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${requiredRole}`,
      });
    }

    next();
  };
};

/**
 * Admin only middleware - allow Super Admin access
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "User not authenticated",
    });
  }

  // Check for Super Admin role
  const isSuperAdmin = req.user.roles.some(
    (role) => role.name === "Super Admin"
  );

  // Check for legacy ADMIN role
  const isAdmin = req.user.roles.some((role) => role.name === "ADMIN");

  if (!isSuperAdmin && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Admin role required.",
    });
  }

  next();
};

/**
 * Super admin only middleware
 */
export const superAdminOnly = requireRole("SUPER_ADMIN");
