import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    teamId?: string;
    roles?: any[];
    permissions?: any[];
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    console.log("🔍 JWT Decoded payload:", JSON.stringify(decoded, null, 2));

    // Handle different JWT payload structures
    let userRole = "user"; // default role

    if (
      decoded.roles &&
      Array.isArray(decoded.roles) &&
      decoded.roles.length > 0
    ) {
      // Use the highest level role (Super Admin has level 10)
      const sortedRoles = decoded.roles.sort(
        (a: any, b: any) => (b.level || 0) - (a.level || 0)
      );
      userRole = sortedRoles[0].name;
      console.log("🎭 Using role from roles array:", userRole);
    } else if (decoded.role) {
      userRole = decoded.role;
      console.log("🎭 Using role from role field:", userRole);
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: userRole,
      teamId: decoded.teamId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    console.log("👤 User context set:", {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      rolesCount: req.user.roles?.length || 0,
    });

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    console.log("🔍 Role check - User role:", req.user.role);
    console.log("🔍 Role check - Allowed roles:", allowedRoles);
    console.log(
      "🔍 Role check - User roles array:",
      req.user.roles?.map((r: any) => r.name)
    );

    // Check if user's primary role is allowed
    const hasRequiredRole = allowedRoles.includes(req.user.role);

    // Also check if any of the user's roles are allowed (for roles array)
    const hasRoleFromArray = req.user.roles?.some((roleObj: any) =>
      allowedRoles.includes(roleObj.name)
    );

    if (!hasRequiredRole && !hasRoleFromArray) {
      console.log("❌ Access denied - insufficient permissions");
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    console.log("✅ Access granted");
    next();
  };
};

// Team-specific authorization
export const requireTeamAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Super admin can access everything
    if (req.user.role === "super_admin") {
      next();
      return;
    }

    // Check if user has team access for the requested resource
    const teamId = req.params.teamId || req.body.teamId || req.query.teamId;

    if (teamId && req.user.teamId !== teamId) {
      res.status(403).json({
        success: false,
        message: "Access denied to this team resource",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Team access middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authorization error",
    });
  }
};
