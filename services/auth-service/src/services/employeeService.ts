import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeLoginResponse,
  EmployeeSearchOptions,
} from "../types/employee";
import { EmployeeLoginCredentials, JwtPayload } from "../types/auth";
import { EmailService } from "./emailService";

export class EmployeeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new employee with user account
   */
  async createEmployee(
    data: CreateEmployeeDto,
    createdBy?: string
  ): Promise<Employee> {
    // Check if email or employeeId already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const existingEmployee = await this.prisma.employee.findUnique({
      where: { employeeId: data.employeeId },
    });

    if (existingEmployee) {
      throw new Error("Employee with this ID already exists");
    }

    // Validate department and team
    const department = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department || !department.isActive) {
      throw new Error("Invalid or inactive department");
    }

    if (data.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: data.teamId },
      });

      if (!team || !team.isActive || team.departmentId !== data.departmentId) {
        throw new Error(
          "Invalid team or team does not belong to the specified department"
        );
      }
    }

    // Validate manager if specified
    if (data.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: data.managerId },
      });

      if (!manager || !manager.isActive) {
        throw new Error("Invalid or inactive manager");
      }
    }

    // Hash temporary password
    const hashedPassword = await bcrypt.hash(data.temporaryPassword, 12);

    // Create user and employee in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: true,
          emailVerified: false, // Employee will need to verify email and change password
        },
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          departmentId: data.departmentId,
          teamId: data.teamId,
          managerId: data.managerId,
          position: data.position,
          hireDate: data.hireDate,
          isActive: true,
        },
        include: {
          user: true,
          department: true,
          team: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Assign roles
      if (data.roleIds && data.roleIds.length > 0) {
        // First, validate that all role IDs exist
        const existingRoles = await tx.role.findMany({
          where: {
            id: {
              in: data.roleIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        console.log("📝 Role validation:");
        console.log("  Requested role IDs:", data.roleIds);
        console.log("  Found roles:", existingRoles);

        const existingRoleIds = existingRoles.map((role) => role.id);
        const invalidRoleIds = data.roleIds.filter(
          (roleId) => !existingRoleIds.includes(roleId)
        );

        if (invalidRoleIds.length > 0) {
          throw new Error(
            `Invalid role IDs: ${invalidRoleIds.join(
              ", "
            )}. Available roles: ${existingRoles
              .map((r) => `${r.name} (${r.id})`)
              .join(", ")}`
          );
        }

        // Create user role assignments
        await Promise.all(
          data.roleIds.map((roleId) =>
            tx.userRole.create({
              data: {
                userId: user.id,
                roleId: roleId,
                createdBy: createdBy,
              },
            })
          )
        );
      }

      return employee;
    });

    // Send welcome email (optional)
    if (data.sendWelcomeEmail !== false) {
      await this.sendWelcomeEmail(
        result.email,
        data.temporaryPassword,
        result.employeeId
      );
    }

    // Transform result to match Employee type
    return {
      id: result.id,
      userId: result.userId,
      employeeId: result.employeeId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      phone: result.phone || undefined,
      departmentId: result.departmentId,
      teamId: result.teamId || undefined,
      managerId: result.managerId || undefined,
      position: result.position || undefined,
      hireDate: result.hireDate,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: {
        id: result.user.id,
        email: result.user.email,
        isActive: result.user.isActive,
        emailVerified: result.user.emailVerified,
        lastLoginAt: result.user.lastLoginAt || undefined,
      },
      department: result.department
        ? {
            id: result.department.id,
            name: result.department.name,
            description: result.department.description || undefined,
            code: result.department.code || undefined,
            isActive: result.department.isActive,
            createdAt: result.department.createdAt,
            updatedAt: result.department.updatedAt,
          }
        : undefined,
      team: result.team
        ? {
            id: result.team.id,
            name: result.team.name,
            description: result.team.description || undefined,
            departmentId: result.team.departmentId,
            managerId: result.team.managerId || undefined,
            isActive: result.team.isActive,
            createdAt: result.team.createdAt,
            updatedAt: result.team.updatedAt,
          }
        : undefined,
      manager: result.manager
        ? ({
            id: result.manager.id,
            firstName: result.manager.firstName,
            lastName: result.manager.lastName,
            email: result.manager.email,
          } as any)
        : undefined,
    } as Employee;
  }

  /**
   * Employee login with enhanced authentication
   */
  async loginEmployee(
    credentials: EmployeeLoginCredentials
  ): Promise<EmployeeLoginResponse> {
    let employee;

    // Find employee by email or employeeId
    if (credentials.employeeId) {
      employee = await this.prisma.employee.findUnique({
        where: { employeeId: credentials.employeeId },
        include: {
          user: {
            include: {
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
          },
          department: true,
          team: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } else {
      employee = await this.prisma.employee.findUnique({
        where: { email: credentials.email },
        include: {
          user: {
            include: {
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
          },
          department: true,
          team: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    if (!employee || !employee.isActive) {
      throw new Error("Employee not found or inactive");
    }

    if (!employee.user.isActive) {
      throw new Error("User account is inactive");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      credentials.password,
      employee.user.password
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Extract roles and permissions
    const roles = employee.user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      level: ur.role.level,
    }));

    const permissions = employee.user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        service: rp.permission.service,
        resource: rp.permission.resource,
        action: rp.permission.action,
      }))
    );

    // Create JWT payload
    const payload: JwtPayload = {
      userId: employee.user.id,
      email: employee.email,
      roles: roles,
      permissions: permissions,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        departmentId: employee.departmentId,
        teamId: employee.teamId || undefined,
        managerId: employee.managerId || undefined,
      },
    };

    // Generate tokens
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "8h",
    });
    const refreshToken = jwt.sign(
      { userId: employee.user.id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Update last login
    await this.prisma.user.update({
      where: { id: employee.user.id },
      data: { lastLoginAt: new Date() },
    });

    // Store session
    await this.prisma.session.create({
      data: {
        userId: employee.user.id,
        token: token,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      },
    });

    return {
      token,
      refreshToken,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        position: employee.position || undefined,
        department: {
          id: employee.department.id,
          name: employee.department.name,
          code: employee.department.code || undefined,
        },
        team: employee.team
          ? {
              id: employee.team.id,
              name: employee.team.name,
            }
          : undefined,
        roles: roles,
        permissions: permissions,
      },
    };
  }

  /**
   * Get employee by ID with full context
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    const result = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          include: {
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
        },
        department: true,
        team: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        managedTeams: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!result) return null;

    // Transform result to match Employee type
    return {
      id: result.id,
      userId: result.userId,
      employeeId: result.employeeId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      phone: result.phone || undefined,
      departmentId: result.departmentId,
      teamId: result.teamId || undefined,
      managerId: result.managerId || undefined,
      position: result.position || undefined,
      hireDate: result.hireDate,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: {
        id: result.user.id,
        email: result.user.email,
        isActive: result.user.isActive,
        emailVerified: result.user.emailVerified,
        lastLoginAt: result.user.lastLoginAt || undefined,
      },
      department: result.department
        ? {
            id: result.department.id,
            name: result.department.name,
            description: result.department.description || undefined,
            code: result.department.code || undefined,
            isActive: result.department.isActive,
            createdAt: result.department.createdAt,
            updatedAt: result.department.updatedAt,
          }
        : undefined,
      team: result.team
        ? {
            id: result.team.id,
            name: result.team.name,
            description: result.team.description || undefined,
            departmentId: result.team.departmentId,
            managerId: result.team.managerId || undefined,
            isActive: result.team.isActive,
            createdAt: result.team.createdAt,
            updatedAt: result.team.updatedAt,
          }
        : undefined,
      manager: result.manager
        ? ({
            id: result.manager.id,
            firstName: result.manager.firstName,
            lastName: result.manager.lastName,
            email: result.manager.email,
            position: result.manager.position || undefined,
          } as any)
        : undefined,
      roles:
        result.user.userRoles?.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
          level: userRole.role.level,
          permissions:
            userRole.role.permissions?.map((rp) => ({
              id: rp.permission.id,
              name: rp.permission.name,
              resource: rp.permission.resource,
              action: rp.permission.action,
              service: rp.permission.service,
            })) || [],
        })) || [],
    } as Employee;
  }

  /**
   * Search employees with filters and pagination
   */
  async searchEmployees(options: EmployeeSearchOptions) {
    const {
      departmentId,
      teamId,
      roleId,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = "name",
      sortOrder = "asc",
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters
    if (departmentId) where.departmentId = departmentId;
    if (teamId) where.teamId = teamId;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleId) {
      where.user = {
        userRoles: {
          some: {
            roleId: roleId,
          },
        },
      };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case "name":
        orderBy = [{ firstName: sortOrder }, { lastName: sortOrder }];
        break;
      case "email":
        orderBy = { email: sortOrder };
        break;
      case "hireDate":
        orderBy = { hireDate: sortOrder };
        break;
      case "department":
        orderBy = { department: { name: sortOrder } };
        break;
      case "team":
        orderBy = { team: { name: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              isActive: true,
              emailVerified: true,
              lastLoginAt: true,
              userRoles: {
                include: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      employees: employees.map((emp) => ({
        id: emp.id,
        userId: emp.userId,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone || undefined,
        departmentId: emp.departmentId,
        teamId: emp.teamId || undefined,
        managerId: emp.managerId || undefined,
        position: emp.position || undefined,
        hireDate: emp.hireDate,
        isActive: emp.isActive,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
        user: {
          id: emp.user.id,
          email: emp.email, // Use employee email since user.email is missing from select
          isActive: emp.user.isActive,
          emailVerified: emp.user.emailVerified,
          lastLoginAt: emp.user.lastLoginAt || undefined,
        },
        department: emp.department
          ? ({
              id: emp.department.id,
              name: emp.department.name,
              code: emp.department.code || undefined,
            } as any)
          : undefined,
        team: emp.team
          ? ({
              id: emp.team.id,
              name: emp.team.name,
            } as any)
          : undefined,
        manager: emp.manager
          ? ({
              id: emp.manager.id,
              firstName: emp.manager.firstName,
              lastName: emp.manager.lastName,
            } as any)
          : undefined,
        roles:
          emp.user.userRoles?.map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            level: userRole.role.level,
          })) || [],
      })) as Employee[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update employee information
   */
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Validate department if changing
    if (data.departmentId && data.departmentId !== employee.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department || !department.isActive) {
        throw new Error("Invalid or inactive department");
      }

      // If changing department, clear team if it doesn't belong to new department
      if (employee.teamId) {
        const team = await this.prisma.team.findUnique({
          where: { id: employee.teamId },
        });

        if (team && team.departmentId !== data.departmentId) {
          data.teamId = null;
        }
      }
    }

    // Validate team if changing
    if (data.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: data.teamId },
      });

      if (!team || !team.isActive) {
        throw new Error("Invalid or inactive team");
      }

      const departmentId = data.departmentId || employee.departmentId;
      if (team.departmentId !== departmentId) {
        throw new Error("Team does not belong to the specified department");
      }
    }

    // Update employee and handle role updates in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update employee basic information
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          departmentId: data.departmentId,
          teamId: data.teamId === null ? null : data.teamId,
          managerId: data.managerId,
          position: data.position,
          isActive: data.isActive,
        },
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
          department: true,
          team: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Handle role updates if provided
      if (data.roleIds !== undefined) {
        console.log("📝 Updating employee roles:");
        console.log("  Employee ID:", id);
        console.log("  New role IDs:", data.roleIds);

        // Validate that all role IDs exist
        if (data.roleIds.length > 0) {
          const existingRoles = await tx.role.findMany({
            where: {
              id: {
                in: data.roleIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
          });

          const existingRoleIds = existingRoles.map((role) => role.id);
          const invalidRoleIds = data.roleIds.filter(
            (roleId) => !existingRoleIds.includes(roleId)
          );

          if (invalidRoleIds.length > 0) {
            throw new Error(
              `Invalid role IDs: ${invalidRoleIds.join(
                ", "
              )}. Available roles: ${existingRoles
                .map((r) => `${r.name} (${r.id})`)
                .join(", ")}`
            );
          }
        }

        // Remove existing roles
        await tx.userRole.deleteMany({
          where: {
            userId: employee.userId,
          },
        });

        // Add new roles
        if (data.roleIds.length > 0) {
          await Promise.all(
            data.roleIds.map((roleId: string) =>
              tx.userRole.create({
                data: {
                  userId: employee.userId,
                  roleId: roleId,
                },
              })
            )
          );
        }

        // Fetch updated employee with new roles
        return await tx.employee.findUnique({
          where: { id },
          include: {
            user: {
              include: {
                userRoles: {
                  include: {
                    role: {
                      select: {
                        id: true,
                        name: true,
                        level: true,
                      },
                    },
                  },
                },
              },
            },
            department: true,
            team: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      }

      return updatedEmployee;
    });

    // Check if result is null
    if (!result) {
      throw new Error("Failed to update employee");
    }

    // Transform result to match Employee type
    return {
      id: result.id,
      userId: result.userId,
      employeeId: result.employeeId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      phone: result.phone || undefined,
      departmentId: result.departmentId,
      teamId: result.teamId || undefined,
      managerId: result.managerId || undefined,
      position: result.position || undefined,
      hireDate: result.hireDate,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: result.user
        ? {
            id: result.user.id,
            email: result.user.email,
            isActive: result.user.isActive,
            emailVerified: result.user.emailVerified,
            lastLoginAt: result.user.lastLoginAt || undefined,
          }
        : undefined,
      department: result.department
        ? {
            id: result.department.id,
            name: result.department.name,
            description: result.department.description || undefined,
            code: result.department.code || undefined,
            isActive: result.department.isActive,
            createdAt: result.department.createdAt,
            updatedAt: result.department.updatedAt,
          }
        : undefined,
      team: result.team
        ? {
            id: result.team.id,
            name: result.team.name,
            description: result.team.description || undefined,
            departmentId: result.team.departmentId,
            managerId: result.team.managerId || undefined,
            isActive: result.team.isActive,
            createdAt: result.team.createdAt,
            updatedAt: result.team.updatedAt,
          }
        : undefined,
      manager: result.manager
        ? ({
            id: result.manager.id,
            firstName: result.manager.firstName,
            lastName: result.manager.lastName,
            email: result.manager.email,
          } as any)
        : undefined,
      roles:
        result.user?.userRoles?.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
          level: userRole.role.level,
        })) || [],
    } as Employee;
  }

  /**
   * Deactivate employee (soft delete)
   */
  async deactivateEmployee(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!employee) {
        throw new Error("Employee not found");
      }

      // Deactivate employee
      await tx.employee.update({
        where: { id },
        data: { isActive: false },
      });

      // Deactivate user account
      await tx.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });

      // Invalidate all sessions
      await tx.session.deleteMany({
        where: { userId: employee.userId },
      });
    });
  }

  /**
   * Check if employee has specific permission
   */
  async hasPermission(
    employeeId: string,
    service: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          include: {
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
        },
      },
    });

    if (!employee || !employee.isActive) {
      return false;
    }

    return employee.user.userRoles.some((ur) =>
      ur.role.permissions.some(
        (rp) =>
          rp.permission.service === service &&
          rp.permission.resource === resource &&
          rp.permission.action === action &&
          rp.permission.isActive
      )
    );
  }

  /**
   * Send welcome email to new employee
   */
  private async sendWelcomeEmail(
    email: string,
    temporaryPassword: string,
    employeeId: string
  ): Promise<void> {
    try {
      await EmailService.sendWelcomeEmail(email, employeeId);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Don't throw error as employee creation should still succeed
    }
  }
}
