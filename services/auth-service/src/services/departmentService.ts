import { PrismaClient } from "@prisma/client";
import {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "../types/employee";

export class DepartmentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new department
   */
  async createDepartment(data: CreateDepartmentDto): Promise<Department> {
    // Check if department name already exists
    const existingDepartment = await this.prisma.department.findUnique({
      where: { name: data.name },
    });

    if (existingDepartment) {
      throw new Error("Department with this name already exists");
    }

    // Check if department code already exists (if provided)
    if (data.code) {
      const existingCode = await this.prisma.department.findUnique({
        where: { code: data.code },
      });

      if (existingCode) {
        throw new Error("Department with this code already exists");
      }
    }

    const result = await this.prisma.department.create({
      data: {
        name: data.name,
        description: data.description || null,
        code: data.code || null,
        isActive: true,
      },
      include: {
        teams: true,
        employees: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    // Transform result to match Department type
    return {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      code: result.code || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      teams: result.teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        departmentId: team.departmentId,
        managerId: team.managerId || undefined,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      employees: result.employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        position: emp.position || undefined,
        isActive: emp.isActive,
      })) as any,
    } as Department;
  }

  /**
   * Get all departments with optional filtering
   */
  async getAllDepartments(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    const results = await this.prisma.department.findMany({
      where,
      include: {
        teams: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                employees: true,
              },
            },
          },
        },
        _count: {
          select: {
            employees: true,
            teams: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform results to match Department type
    return results.map((result) => ({
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      code: result.code || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      teams: result.teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        departmentId: team.departmentId,
        managerId: team.managerId || undefined,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
    })) as Department[];
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<Department | null> {
    const result = await this.prisma.department.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                employees: true,
              },
            },
          },
        },
        employees: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    if (!result) return null;

    // Transform result to match Department type
    return {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      code: result.code || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      teams: result.teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        departmentId: team.departmentId,
        managerId: team.managerId || undefined,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      employees: result.employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        position: emp.position || undefined,
        isActive: emp.isActive,
      })) as any,
    } as Department;
  }

  /**
   * Update department
   */
  async updateDepartment(
    id: string,
    data: UpdateDepartmentDto
  ): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    // Check for name conflicts
    if (data.name && data.name !== department.name) {
      const existingName = await this.prisma.department.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        throw new Error("Department with this name already exists");
      }
    }

    // Check for code conflicts
    if (data.code && data.code !== department.code) {
      const existingCode = await this.prisma.department.findUnique({
        where: { code: data.code },
      });

      if (existingCode) {
        throw new Error("Department with this code already exists");
      }
    }

    const result = await this.prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        code: data.code,
        isActive: data.isActive,
      },
      include: {
        teams: {
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        employees: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    // Transform result to match Department type
    return {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      code: result.code || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      teams: result.teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        departmentId: team.departmentId,
        managerId: team.managerId || undefined,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      employees: result.employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        position: emp.position || undefined,
        isActive: emp.isActive,
      })) as any,
    } as Department;
  }

  /**
   * Delete department (only if no active employees or teams)
   */
  async deleteDepartment(id: string): Promise<void> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        teams: { where: { isActive: true } },
        employees: { where: { isActive: true } },
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    if (department.teams.length > 0) {
      throw new Error("Cannot delete department with active teams");
    }

    if (department.employees.length > 0) {
      throw new Error("Cannot delete department with active employees");
    }

    await this.prisma.department.delete({
      where: { id },
    });
  }

  /**
   * Get department hierarchy with statistics
   */
  async getDepartmentHierarchy() {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        teams: {
          where: { isActive: true },
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                employees: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            employees: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      description: dept.description,
      employeeCount: dept._count.employees,
      teams: dept.teams.map((team) => ({
        id: team.id,
        name: team.name,
        manager: team.manager
          ? {
              id: team.manager.id,
              name: `${team.manager.firstName} ${team.manager.lastName}`,
            }
          : null,
        employeeCount: team._count.employees,
      })),
    }));
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats() {
    const [totalDepartments, activeDepartments, totalEmployees, totalTeams] =
      await Promise.all([
        this.prisma.department.count(),
        this.prisma.department.count({ where: { isActive: true } }),
        this.prisma.employee.count(),
        this.prisma.team.count({ where: { isActive: true } }),
      ]);

    const departmentsWithCounts = await this.prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            employees: true,
            teams: true,
          },
        },
      },
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return {
      totalDepartments,
      activeDepartments,
      inactiveDepartments: totalDepartments - activeDepartments,
      totalEmployees,
      totalTeams,
      averageEmployeesPerDepartment:
        activeDepartments > 0
          ? Math.round((totalEmployees / activeDepartments) * 100) / 100
          : 0,
      departmentsWithCounts,
    };
  }
}
