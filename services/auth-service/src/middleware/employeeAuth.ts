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
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
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
        error: "Invalid or inactive user",
      });
      return;
    }

    if (!user.employee) {
      res.status(403).json({
        success: false,
        error: "User is not an employee",
      });
      return;
    }

    // Build AuthUser object
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      roles: user.userRoles.map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        level: userRole.role.level,
        isActive: userRole.role.isActive,
        permissions: userRole.role.permissions.map((rolePermission) => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          service: rolePermission.permission.service,
          resource: rolePermission.permission.resource,
          action: rolePermission.permission.action,
          isActive: rolePermission.permission.isActive,
        })),
      })),
      employee: {
        id: user.employee.id,
        employeeId: user.employee.employeeId,
        position: user.employee.position,
        department: {
          id: user.employee.department.id,
          name: user.employee.department.name,
          code: user.employee.department.code,
        },
        team: user.employee.team
          ? {
              id: user.employee.team.id,
              name: user.employee.team.name,
            }
          : undefined,
        manager: user.employee.manager
          ? {
              id: user.employee.manager.user.id,
              name: `${user.employee.manager.user.firstName} ${user.employee.manager.user.lastName}`,
            }
          : undefined,
      },
    };

    // Attach user to request
    req.user = authUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

/**
 * Permission checking middleware
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
        error: "Authentication required",
      });
      return;
    }

    const hasPermission = req.user.roles.some((role) =>
      role.permissions.some(
        (permission) =>
          permission.service === service &&
          permission.resource === resource &&
          permission.action === action &&
          permission.isActive
      )
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

/**
 * Role checking middleware
 */
export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => role.name === roleName);

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: `Role '${roleName}' required`,
      });
      return;
    }

    next();
  };
};

/**
 * Department access checking middleware
 */
export const requireDepartmentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.employee) {
    res.status(403).json({
      success: false,
      error: "Employee access required",
    });
    return;
  }

  // You can add department-specific logic here
  // For now, just allow access if user is an employee
  next();
};

/**
 * Manager level access checking middleware
 */
export const requireManagerAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.employee) {
    res.status(403).json({
      success: false,
      error: "Employee access required",
    });
    return;
  }

  // Check if user has manager role or manage permission
  const hasManagerRole = req.user.roles.some(
    (role) =>
      role.name.toLowerCase().includes("manager") ||
      role.name.toLowerCase().includes("lead")
  );

  const hasManagePermission = req.user.roles.some((role) =>
    role.permissions.some(
      (permission) => permission.action === "manage" && permission.isActive
    )
  );

  if (!hasManagerRole && !hasManagePermission) {
    res.status(403).json({
      success: false,
      error: "Manager level access required",
    });
    return;
  }

  next();
};

/**
 * Admin level access checking middleware
 */
export const requireAdminAccess = (
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

  const hasAdminRole = req.user.roles.some(
    (role) =>
      role.name.toLowerCase().includes("admin") ||
      role.name.toLowerCase().includes("super")
  );

  if (!hasAdminRole) {
    res.status(403).json({
      success: false,
      error: "Admin access required",
    });
    return;
  }

  next();
};

/**
 * Team access checking middleware
 */
export const requireTeamAccess = (teamId?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.employee) {
      res.status(403).json({
        success: false,
        error: "Employee access required",
      });
      return;
    }

    // If no specific team ID is provided, allow any team member
    if (!teamId) {
      next();
      return;
    }

    // Check if user belongs to the specific team
    if (req.user.employee.team?.id !== teamId) {
      res.status(403).json({
        success: false,
        error: "Team access required",
      });
      return;
    }

    next();
  };
};

/**
 * Check multiple permissions (AND logic)
 */
export const requireAllPermissions = (permissions: PermissionCheck[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const hasAllPermissions = permissions.every((check) =>
      req.user!.roles.some((role) =>
        role.permissions.some(
          (permission) =>
            permission.service === check.service &&
            permission.resource === check.resource &&
            permission.action === check.action &&
            permission.isActive
        )
      )
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

/**
 * Check any of multiple permissions (OR logic)
 */
export const requireAnyPermission = (permissions: PermissionCheck[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const hasAnyPermission = permissions.some((check) =>
      req.user!.roles.some((role) =>
        role.permissions.some(
          (permission) =>
            permission.service === check.service &&
            permission.resource === check.resource &&
            permission.action === check.action &&
            permission.isActive
        )
      )
    );

    if (!hasAnyPermission) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

/**
 * Check minimum role level access
 */
export const requireMinimumRoleLevel = (minimumLevel: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const hasMinimumLevel = req.user.roles.some(
      (role) => role.level && role.level >= minimumLevel
    );

    if (!hasMinimumLevel) {
      res.status(403).json({
        success: false,
        error: `Minimum role level ${minimumLevel} required`,
      });
      return;
    }

    next();
  };
};

/**
 * Development/debug middleware to log user context
 */
export const logUserContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === "development" && req.user) {
    console.log("User Context:", {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles.map((r) => r.name),
      employee: req.user.employee
        ? {
            id: req.user.employee.id,
            department: req.user.employee.department.name,
            team: req.user.employee.team?.name,
          }
        : null,
    });
  }
  next();
};
