import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JwtPayload, AuthUser } from "../types/auth";
import { PermissionCheck } from "../types/employee";

const prisma = new PrismaClient();

/**
 * Enhanced authentication middleware for employees
 */
export const authenticateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication token required",
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user with employee context and roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: "User account not found or inactive",
      });
      return;
    }

    // Check if user is an employee
    if (!user.employee || !user.employee.isActive) {
      res.status(403).json({
        success: false,
        error: "Employee access required",
      });
      return;
    }

    // Build enhanced user object
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt || undefined,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        level: ur.role.level || 1,
        isActive: ur.role.isActive,
        permissions: ur.role.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          service: rp.permission.service,
          resource: rp.permission.resource,
          action: rp.permission.action,
          isActive: rp.permission.isActive,
        })),
      })),
      employee: {
        id: user.employee.id,
        employeeId: user.employee.employeeId,
        position: user.employee.position || undefined,
        department: {
          id: user.employee.department.id,
          name: user.employee.department.name,
          code: user.employee.department.code || undefined,
        },
        team: user.employee.team
          ? {
              id: user.employee.team.id,
              name: user.employee.team.name,
            }
          : undefined,
        manager: user.employee.manager
          ? {
              id: user.employee.manager.id,
              name: `${user.employee.manager.firstName} ${user.employee.manager.lastName}`,
            }
          : undefined,
      },
    };

    req.user = authUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid authentication token",
    });
    return;
  }
};

/**
 * Permission middleware factory - checks if user has specific permission
 */
export const requirePermission = (
  service: string,
  resource: string,
  action: string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user has the required permission
    const hasPermission = user.roles.some((role) =>
      role.permissions.some(
        (permission) =>
          // Super admin with admin:full has access to everything
          (permission.resource === "admin" && permission.action === "full") ||
          // Or exact permission match
          (permission.service === service &&
            permission.resource === resource &&
            permission.action === action) ||
          // Or manage action includes all other actions (create, read, update, delete)
          (permission.service === service &&
            permission.resource === resource &&
            permission.action === "manage" &&
            ["create", "read", "update", "delete"].includes(action))
      )
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${service}:${resource}:${action}`,
        requiredPermission: {
          service,
          resource,
          action,
        },
      });
    }

    next();
  };
};

/**
 * Multiple permissions middleware - checks if user has ANY of the specified permissions
 */
export const requireAnyPermission = (permissions: PermissionCheck[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some((perm) =>
      user.roles.some((role) =>
        role.permissions.some(
          (permission) =>
            // Super admin with admin:full has access to everything
            (permission.resource === "admin" && permission.action === "full") ||
            // Or exact permission match
            (permission.service === perm.service &&
              permission.resource === perm.resource &&
              permission.action === perm.action)
        )
      )
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        error:
          "Access denied. You do not have any of the required permissions.",
        requiredPermissions: permissions,
      });
    }

    next();
  };
};

/**
 * All permissions middleware - checks if user has ALL of the specified permissions
 */
export const requireAllPermissions = (permissions: PermissionCheck[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every((perm) =>
      user.roles.some((role) =>
        role.permissions.some(
          (permission) =>
            permission.service === perm.service &&
            permission.resource === perm.resource &&
            permission.action === perm.action
        )
      )
    );

    if (!hasAllPermissions) {
      const missingPermissions = permissions.filter(
        (perm) =>
          !user.roles.some((role) =>
            role.permissions.some(
              (permission) =>
                permission.service === perm.service &&
                permission.resource === perm.resource &&
                permission.action === perm.action
            )
          )
      );

      return res.status(403).json({
        success: false,
        error: "Access denied. You are missing required permissions.",
        missingPermissions,
      });
    }

    next();
  };
};

/**
 * Role level middleware - checks if user has a role with minimum level
 */
export const requireMinimumRoleLevel = (minLevel: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const hasMinimumLevel = user.roles.some(
      (role) => (role.level || 1) >= minLevel
    );

    if (!hasMinimumLevel) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Minimum role level ${minLevel} required.`,
        requiredLevel: minLevel,
        userMaxLevel: Math.max(...user.roles.map((r) => r.level || 1)),
      });
    }

    next();
  };
};

/**
 * Department access middleware - checks if user belongs to specific department
 */
export const requireDepartmentAccess = (departmentId?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user || !user.employee) {
      return res.status(401).json({
        success: false,
        error: "Employee authentication required",
      });
    }

    // If no specific department required, allow any department
    if (!departmentId) {
      next();
      return;
    }

    // Check if user belongs to the required department
    if (user.employee.department.id !== departmentId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not belong to the required department.",
        requiredDepartment: departmentId,
        userDepartment: user.employee.department.id,
      });
    }

    next();
  };
};

/**
 * Team access middleware - checks if user belongs to specific team
 */
export const requireTeamAccess = (teamId?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user || !user.employee) {
      return res.status(401).json({
        success: false,
        error: "Employee authentication required",
      });
    }

    // If no specific team required, allow any team
    if (!teamId) {
      next();
      return;
    }

    // Check if user belongs to the required team
    if (!user.employee.team || user.employee.team.id !== teamId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not belong to the required team.",
        requiredTeam: teamId,
        userTeam: user.employee.team?.id,
      });
    }

    next();
  };
};

/**
 * Manager access middleware - checks if user is a manager
 */
export const requireManagerAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;

    if (!user || !user.employee) {
      return res.status(401).json({
        success: false,
        error: "Employee authentication required",
      });
    }

    // Check if user manages any teams or has subordinates
    const employee = await prisma.employee.findUnique({
      where: { id: user.employee.id },
      include: {
        managedTeams: true,
        subordinates: true,
      },
    });

    if (
      !employee ||
      (employee.managedTeams.length === 0 && employee.subordinates.length === 0)
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Manager privileges required.",
      });
    }

    next();
  };
};
