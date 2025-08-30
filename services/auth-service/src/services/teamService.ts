import { PrismaClient } from "@prisma/client";
import { Team, CreateTeamDto, UpdateTeamDto } from "../types/employee";

export class TeamService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new team
   */
  async createTeam(data: CreateTeamDto): Promise<Team> {
    // Validate department
    const department = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department || !department.isActive) {
      throw new Error("Invalid or inactive department");
    }

    // Check if team name already exists in the department
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        name: data.name,
        departmentId: data.departmentId,
      },
    });

    if (existingTeam) {
      throw new Error("Team with this name already exists in the department");
    }

    // Validate manager if provided
    if (data.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: data.managerId },
      });

      if (
        !manager ||
        !manager.isActive ||
        manager.departmentId !== data.departmentId
      ) {
        throw new Error(
          "Invalid manager or manager does not belong to the same department"
        );
      }
    }

    return (await this.prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        departmentId: data.departmentId,
        managerId: data.managerId,
        isActive: true,
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })) as any;
  }

  /**
   * Get all teams with optional filtering
   */
  async getAllTeams(departmentId?: string, includeInactive: boolean = false) {
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const results = await this.prisma.team.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        employees: {
          where: includeInactive ? {} : { isActive: true },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
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
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    });

    // Transform results to match Team type
    return results.map((result) => ({
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      departmentId: result.departmentId,
      managerId: result.managerId || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      department: {
        id: result.department.id,
        name: result.department.name,
        code: result.department.code || undefined,
      } as any,
      manager: result.manager
        ? ({
            id: result.manager.id,
            firstName: result.manager.firstName,
            lastName: result.manager.lastName,
            email: result.manager.email,
          } as any)
        : undefined,
      employees: result.employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        position: emp.position || undefined,
      })) as any,
    })) as Team[];
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    const result = await this.prisma.team.findUnique({
      where: { id },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
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

    // Transform result to match Team type
    return {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      departmentId: result.departmentId,
      managerId: result.managerId || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      department: {
        id: result.department.id,
        name: result.department.name,
        description: result.department.description || undefined,
        code: result.department.code || undefined,
        isActive: result.department.isActive,
        createdAt: result.department.createdAt,
        updatedAt: result.department.updatedAt,
      },
      manager: result.manager
        ? ({
            id: result.manager.id,
            firstName: result.manager.firstName,
            lastName: result.manager.lastName,
            email: result.manager.email,
            position: result.manager.position || undefined,
          } as any)
        : undefined,
      employees: result.employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        position: emp.position || undefined,
        isActive: emp.isActive,
      })) as any,
    } as Team;
  }

  /**
   * Update team
   */
  async updateTeam(id: string, data: UpdateTeamDto): Promise<Team> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Check for name conflicts within the same department
    if (data.name && data.name !== team.name) {
      const existingName = await this.prisma.team.findFirst({
        where: {
          name: data.name,
          departmentId: team.departmentId,
          id: { not: id },
        },
      });

      if (existingName) {
        throw new Error("Team with this name already exists in the department");
      }
    }

    // Validate manager if changing
    if (data.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: data.managerId },
      });

      if (
        !manager ||
        !manager.isActive ||
        manager.departmentId !== team.departmentId
      ) {
        throw new Error(
          "Invalid manager or manager does not belong to the same department"
        );
      }
    }

    return (await this.prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        managerId: data.managerId,
        isActive: data.isActive,
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })) as any;
  }

  /**
   * Delete team (only if no active employees)
   */
  async deleteTeam(id: string): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        employees: { where: { isActive: true } },
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    if (team.employees.length > 0) {
      throw new Error("Cannot delete team with active employees");
    }

    await this.prisma.team.delete({
      where: { id },
    });
  }

  /**
   * Add employee to team
   */
  async addEmployeeToTeam(teamId: string, employeeId: string): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { department: true },
    });

    if (!team || !team.isActive) {
      throw new Error("Invalid or inactive team");
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || !employee.isActive) {
      throw new Error("Invalid or inactive employee");
    }

    if (employee.departmentId !== team.departmentId) {
      throw new Error(
        "Employee does not belong to the same department as the team"
      );
    }

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { teamId: teamId },
    });
  }

  /**
   * Remove employee from team
   */
  async removeEmployeeFromTeam(employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { teamId: null },
    });
  }

  /**
   * Get teams by department
   */
  async getTeamsByDepartment(
    departmentId: string,
    includeInactive: boolean = false
  ) {
    const where = includeInactive
      ? { departmentId }
      : { departmentId, isActive: true };

    return await this.prisma.team.findMany({
      where,
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
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get team statistics
   */
  async getTeamStats() {
    const [totalTeams, activeTeams, totalEmployees] = await Promise.all([
      this.prisma.team.count(),
      this.prisma.team.count({ where: { isActive: true } }),
      this.prisma.employee.count({ where: { teamId: { not: null } } }),
    ]);

    const teamsWithEmployeeCounts = await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
      where: { isActive: true },
    });

    const averageTeamSize =
      totalEmployees > 0 ? totalEmployees / activeTeams : 0;

    return {
      totalTeams,
      activeTeams,
      inactiveTeams: totalTeams - activeTeams,
      totalEmployeesInTeams: totalEmployees,
      averageTeamSize: Math.round(averageTeamSize * 100) / 100,
      teamsWithEmployeeCounts,
    };
  }
}
