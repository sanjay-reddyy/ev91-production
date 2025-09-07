import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
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
  private emailService: EmailService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
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
        include: { department: true },
      });

      if (!team || !team.isActive) {
        throw new Error("Invalid or inactive team");
      }

      if (team.departmentId !== data.departmentId) {
        throw new Error("Team does not belong to the specified department");
      }
    }

    // Validate manager if provided
    if (data.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: data.managerId },
        include: { user: true },
      });

      if (!manager || !manager.user.isActive) {
        throw new Error("Invalid or inactive manager");
      }
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(data.temporaryPassword, 10);

    // Create user and employee in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the user first
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          isActive: true,
          emailVerified: false,
        },
      });

      // Create the employee
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          departmentId: data.departmentId,
          teamId: data.teamId === "" ? null : data.teamId,
          managerId: data.managerId === "" ? null : data.managerId,
          position: data.position,
          hireDate: data.hireDate,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              emailVerified: true,
              lastLoginAt: true,
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
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Assign roles to user
      if (data.roleIds && data.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
            createdBy: createdBy || "system",
          })),
        });
      }

      return employee;
    });

    // Send welcome email if requested
    if (data.sendWelcomeEmail) {
      try {
        // Get the user details from the created user
        const createdUser = await this.prisma.user.findUnique({
          where: { id: result.userId },
        });

        if (createdUser) {
          await this.emailService.sendEmployeeWelcomeEmail(
            createdUser.email,
            `${createdUser.firstName} ${createdUser.lastName}`,
            data.temporaryPassword
          );
        }
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        // Don't throw here, just log the error
      }
    }

    return this.transformToEmployeeResponse(result);
  }

  /**
   * Get employee by ID with full details
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    return this.transformToEmployeeResponse(employee);
  }

  /**
   * Get employee by employee ID
   */
  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    return this.transformToEmployeeResponse(employee);
  }

  /**
   * Get employee by user email
   */
  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        user: {
          email,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    return this.transformToEmployeeResponse(employee);
  }

  /**
   * Update employee information
   */
  async updateEmployee(
    id: string,
    data: UpdateEmployeeDto,
    updatedBy?: string
  ): Promise<Employee> {
    // Check if employee exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingEmployee) {
      throw new Error("Employee not found");
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== existingEmployee.user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: {
          email: data.email,
          NOT: { id: existingEmployee.userId },
        },
      });

      if (emailExists) {
        throw new Error("Email already exists");
      }
    }

    // Check employee ID uniqueness if being updated
    if (data.employeeId && data.employeeId !== existingEmployee.employeeId) {
      const employeeIdExists = await this.prisma.employee.findUnique({
        where: {
          employeeId: data.employeeId,
          NOT: { id },
        },
      });

      if (employeeIdExists) {
        throw new Error("Employee ID already exists");
      }
    }

    // Validate department if being updated
    if (data.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department || !department.isActive) {
        throw new Error("Invalid or inactive department");
      }
    }

    // Validate team if being updated
    if (data.teamId !== undefined) {
      if (data.teamId) {
        const team = await this.prisma.team.findUnique({
          where: { id: data.teamId },
        });

        if (!team || !team.isActive) {
          throw new Error("Invalid or inactive team");
        }

        // Validate team belongs to department
        const departmentId = data.departmentId || existingEmployee.departmentId;
        if (team.departmentId !== departmentId) {
          throw new Error("Team does not belong to the specified department");
        }
      }
    }

    // Validate manager if being updated
    if (data.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: data.managerId },
        include: { user: true },
      });

      if (!manager || !manager.user.isActive) {
        throw new Error("Invalid or inactive manager");
      }

      // Prevent self-management
      if (data.managerId === id) {
        throw new Error("Employee cannot be their own manager");
      }
    }

    // Update in transaction
    const updatedEmployee = await this.prisma.$transaction(async (tx) => {
      // Update user fields
      const userUpdateData: any = {};
      if (data.firstName !== undefined)
        userUpdateData.firstName = data.firstName;
      if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
      if (data.email !== undefined) userUpdateData.email = data.email;
      if (data.phone !== undefined) userUpdateData.phone = data.phone;
      if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: userUpdateData,
        });
      }

      // Update employee fields
      const employeeUpdateData: any = {};
      if (data.employeeId !== undefined)
        employeeUpdateData.employeeId = data.employeeId;
      if (data.departmentId !== undefined)
        employeeUpdateData.departmentId = data.departmentId;
      if (data.teamId !== undefined) {
        // Handle empty string as null for optional team assignment
        employeeUpdateData.teamId = data.teamId === "" ? null : data.teamId;
      }
      if (data.managerId !== undefined) {
        // Handle empty string as null for optional manager assignment
        employeeUpdateData.managerId =
          data.managerId === "" ? null : data.managerId;
      }
      if (data.position !== undefined)
        employeeUpdateData.position = data.position;
      if (data.hireDate !== undefined) {
        // Convert ISO string back to Date object if needed
        employeeUpdateData.hireDate =
          typeof data.hireDate === "string"
            ? new Date(data.hireDate)
            : data.hireDate;
      }

      const employee = await tx.employee.update({
        where: { id },
        data: employeeUpdateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              emailVerified: true,
              lastLoginAt: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              description: true,
              code: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              description: true,
              departmentId: true,
              managerId: true,
              city: true,
              state: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          manager: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Update roles if provided
      if (data.roleIds !== undefined) {
        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { userId: existingEmployee.userId },
        });

        // Add new roles
        if (data.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: data.roleIds.map((roleId) => ({
              userId: existingEmployee.userId,
              roleId,
              createdBy: updatedBy || "system",
            })),
          });
        }
      }

      return employee;
    });

    return this.transformToEmployeeResponse(updatedEmployee);
  }

  /**
   * Delete employee (soft delete by deactivating user)
   */
  async deleteEmployee(id: string): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Soft delete by deactivating the user
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { isActive: false },
    });
  }

  /**
   * Search employees with filters and pagination
   */
  async searchEmployees(options: EmployeeSearchOptions): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    totalPages: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      departmentId,
      teamId,
      roleId,
      isActive, // Remove default value to show both active and inactive
      search,
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Only filter by isActive if explicitly provided
    if (isActive !== undefined) {
      where.user = {
        isActive: isActive,
      };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (search) {
      where.OR = [
        {
          user: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          employeeId: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (roleId) {
      // Ensure user object exists in where clause for role filtering
      if (!where.user) {
        where.user = {};
      }
      where.user = {
        ...where.user,
        userRoles: {
          some: {
            roleId: roleId,
          },
        },
      };
    }

    // Build order by clause
    let orderBy: any = {};

    if (sortBy === "name") {
      orderBy = [
        { user: { firstName: sortOrder } },
        { user: { lastName: sortOrder } },
      ];
    } else if (sortBy === "email") {
      orderBy = { user: { email: sortOrder } };
    } else if (sortBy === "department") {
      orderBy = { department: { name: sortOrder } };
    } else if (sortBy === "team") {
      orderBy = { team: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get total count
    const total = await this.prisma.employee.count({
      where,
    });

    // Get employees
    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            userRoles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
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
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      employees: employees.map((emp) => this.transformToEmployeeResponse(emp)),
      total,
      page,
      totalPages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Employee login
   */
  async login(
    credentials: EmployeeLoginCredentials
  ): Promise<EmployeeLoginResponse> {
    const { email, password, employeeId } = credentials;

    // Find employee by email or employee ID
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ user: { email } }, ...(employeeId ? [{ employeeId }] : [])],
      },
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
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new Error("Invalid credentials");
    }

    if (!employee.user.isActive) {
      throw new Error("Account is inactive");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      employee.user.password
    );

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: employee.user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const tokenPayload: JwtPayload = {
      userId: employee.user.id,
      email: employee.user.email,
      roles: employee.user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        level: ur.role.level,
      })),
      permissions: employee.user.userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => ({
          service: rp.permission.service,
          resource: rp.permission.resource,
          action: rp.permission.action,
        }))
      ),
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        departmentId: employee.departmentId,
        teamId: employee.teamId,
        managerId: employee.managerId,
      },
    };

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const jwtExpiry = process.env.JWT_EXPIRES_IN || "24h";

    const token = (jwt as any).sign(tokenPayload, jwtSecret, {
      expiresIn: jwtExpiry,
    });

    // Prepare response
    const roles = employee.user.userRoles.map((userRole) => ({
      id: userRole.role.id,
      name: userRole.role.name,
      description: userRole.role.description,
      permissions: userRole.role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    }));

    return {
      token,
      employee: this.transformToEmployeeResponse(employee),
      roles,
    };
  }

  /**
   * Get all employees under a manager
   */
  async getSubordinates(managerId: string): Promise<Employee[]> {
    const subordinates = await this.prisma.employee.findMany({
      where: { managerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return subordinates.map((emp) => this.transformToEmployeeResponse(emp));
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        departmentId,
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return employees.map((emp) => this.transformToEmployeeResponse(emp));
  }

  /**
   * Get employees by team
   */
  async getEmployeesByTeam(teamId: string): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        teamId,
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return employees.map((emp) => this.transformToEmployeeResponse(emp));
  }

  /**
   * Employee login (alias for login method for backward compatibility)
   */
  async loginEmployee(
    credentials: EmployeeLoginCredentials
  ): Promise<EmployeeLoginResponse> {
    return this.login(credentials);
  }

  /**
   * Deactivate employee (alias for deleteEmployee for backward compatibility)
   */
  async deactivateEmployee(id: string): Promise<void> {
    return this.deleteEmployee(id);
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    service: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user || !user.isActive) {
      return false;
    }

    // Check if user has the specific permission
    return user.userRoles.some(
      (userRole) =>
        userRole.role.isActive &&
        userRole.role.permissions.some(
          (rolePermission) =>
            rolePermission.permission.isActive &&
            rolePermission.permission.service === service &&
            rolePermission.permission.resource === resource &&
            rolePermission.permission.action === action
        )
    );
  }

  /**
   * Transform database result to Employee response format
   */
  private transformToEmployeeResponse(dbEmployee: any): Employee {
    return {
      id: dbEmployee.id,
      userId: dbEmployee.userId,
      employeeId: dbEmployee.employeeId,
      // Flatten user fields to root level for frontend compatibility
      firstName: dbEmployee.user.firstName,
      lastName: dbEmployee.user.lastName,
      email: dbEmployee.user.email,
      isActive: dbEmployee.user.isActive,
      phone: dbEmployee.user.phone,
      departmentId: dbEmployee.departmentId,
      teamId: dbEmployee.teamId,
      managerId: dbEmployee.managerId,
      position: dbEmployee.position,
      hireDate: dbEmployee.hireDate,
      createdAt: dbEmployee.createdAt,
      updatedAt: dbEmployee.updatedAt,
      // Keep nested user object for backward compatibility
      user: {
        id: dbEmployee.user.id,
        firstName: dbEmployee.user.firstName,
        lastName: dbEmployee.user.lastName,
        email: dbEmployee.user.email,
        phone: dbEmployee.user.phone,
        isActive: dbEmployee.user.isActive,
        emailVerified: dbEmployee.user.emailVerified,
        lastLoginAt: dbEmployee.user.lastLoginAt,
      },
      // Extract and transform roles
      roles: dbEmployee.user.userRoles
        ? dbEmployee.user.userRoles.map((userRole: any) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            description: userRole.role.description,
            level: userRole.role.level,
          }))
        : [],
      department: dbEmployee.department
        ? {
            id: dbEmployee.department.id,
            name: dbEmployee.department.name,
            description: dbEmployee.department.description,
            code: dbEmployee.department.code,
            isActive: dbEmployee.department.isActive,
            createdAt: dbEmployee.department.createdAt,
            updatedAt: dbEmployee.department.updatedAt,
          }
        : undefined,
      team: dbEmployee.team
        ? {
            id: dbEmployee.team.id,
            name: dbEmployee.team.name,
            description: dbEmployee.team.description,
            departmentId: dbEmployee.team.departmentId,
            managerId: dbEmployee.team.managerId,
            city: dbEmployee.team.city,
            state: dbEmployee.team.state,
            isActive: dbEmployee.team.isActive,
            createdAt: dbEmployee.team.createdAt,
            updatedAt: dbEmployee.team.updatedAt,
          }
        : undefined,
      manager: dbEmployee.manager
        ? {
            id: dbEmployee.manager.user.id,
            firstName: dbEmployee.manager.user.firstName,
            lastName: dbEmployee.manager.user.lastName,
            email: dbEmployee.manager.user.email,
          }
        : undefined,
    };
  }
}
