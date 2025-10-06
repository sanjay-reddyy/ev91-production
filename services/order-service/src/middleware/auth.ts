import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "./errorHandler.js";

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Interface for the authenticated request with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    teamId?: string;
  };
}

// Verify JWT token middleware
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from headers or cookies
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return next(createError("Authentication required", 401, "AUTH_REQUIRED"));
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        teamId: decoded.teamId,
      };
      next();
    } catch (error) {
      return next(
        createError("Invalid or expired token", 401, "INVALID_TOKEN")
      );
    }
  } catch (error) {
    return next(createError("Authentication error", 500));
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError("Authentication required", 401, "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          "You don't have permission to perform this action",
          403,
          "INSUFFICIENT_PERMISSIONS"
        )
      );
    }

    next();
  };
};

// Team access control middleware
export const requireTeamAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(createError("Authentication required", 401, "AUTH_REQUIRED"));
  }

  // Allow admins to bypass team restrictions
  if (["Admin", "Super Admin"].includes(req.user.role)) {
    return next();
  }

  // For non-admin roles, check if they have access to the requested team
  const requestedTeamId =
    req.params.teamId || req.query.teamId || req.body.teamId;

  if (requestedTeamId && req.user.teamId !== requestedTeamId) {
    return next(
      createError(
        "You don't have permission to access this team's data",
        403,
        "TEAM_ACCESS_DENIED"
      )
    );
  }

  next();
};
