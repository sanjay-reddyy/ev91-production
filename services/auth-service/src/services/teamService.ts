import { PrismaClient } from "@prisma/client";
import { Team, CreateTeamDto, UpdateTeamDto } from "../types/employee";

export class TeamService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Basic CRUD operations only - full implementation will come later
  async createTeam(data: CreateTeamDto): Promise<Team> {
    // Prepare the data for Prisma create
    const createData: any = {
      name: data.name,
      description: data.description,
      departmentId: data.departmentId,
      managerId: data.managerId,
      city: data.city,
      state: data.state,
      maxMembers: data.maxMembers || 10,
      memberCount: data.memberCount || 0,
      status: data.status || "Active",
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    // Convert skills array to JSON string if provided
    if (data.skills && Array.isArray(data.skills)) {
      createData.skills = JSON.stringify(data.skills);
    }

    // Handle empty managerId
    if (data.managerId === "") {
      createData.managerId = null;
    }

    return (await this.prisma.team.create({
      data: createData,
    })) as any;
  }

  async getTeamById(id: string): Promise<Team | null> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
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
        employees: {
          where: {
            user: { isActive: true },
          },
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            position: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    const teamData = { ...team };

    if (team.skills) {
      try {
        // Parse skills JSON string back to array
        (teamData as any).skills = JSON.parse(team.skills);
      } catch (e) {
        // If parsing fails, return as is or empty array
        (teamData as any).skills = [];
      }
    }

    // Add computed fields for frontend compatibility
    (teamData as any).memberCount = team.employees?.length || 0;
    (teamData as any).teamLead = team.manager?.user
      ? `${team.manager.user.firstName} ${team.manager.user.lastName}`
      : null;

    return teamData as any;
  }

  async getAllTeams(
    departmentId?: string,
    includeInactive?: boolean
  ): Promise<Team[]> {
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            isActive: true,
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
        employees: {
          where: {
            user: { isActive: true },
          },
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            position: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    // Parse skills JSON for all teams and add computed fields
    return teams.map((team) => {
      const teamData = { ...team };

      if (team.skills) {
        try {
          (teamData as any).skills = JSON.parse(team.skills);
        } catch (e) {
          (teamData as any).skills = [];
        }
      }

      // Add computed fields for frontend compatibility
      (teamData as any).memberCount = team.employees?.length || 0;
      (teamData as any).teamLead = team.manager?.user
        ? `${team.manager.user.firstName} ${team.manager.user.lastName}`
        : null;

      return teamData;
    }) as any;
  }

  async getTeamsByDepartment(
    departmentId: string,
    includeInactive?: boolean
  ): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      where: {
        departmentId,
        ...(includeInactive ? {} : { isActive: true }),
      },
    });

    // Parse skills JSON for all teams
    return teams.map((team) => {
      if (team.skills) {
        try {
          (team as any).skills = JSON.parse(team.skills);
        } catch (e) {
          (team as any).skills = [];
        }
      }
      return team;
    }) as any;
  }

  async updateTeam(
    id: string,
    data: UpdateTeamDto,
    updatedBy?: string
  ): Promise<Team> {
    // Prepare the data for Prisma update
    const updateData: any = { ...data };

    // Convert skills array to JSON string if provided
    if (data.skills && Array.isArray(data.skills)) {
      updateData.skills = JSON.stringify(data.skills);
    }

    // Handle empty managerId (team lead)
    if (data.managerId === "") {
      updateData.managerId = null;
    }

    return (await this.prisma.team.update({
      where: { id },
      data: updateData,
    })) as any;
  }

  async addEmployeeToTeam(teamId: string, employeeId: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { teamId },
    });
  }

  async removeEmployeeFromTeam(employeeId: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { teamId: null },
    });
  }

  async getTeamStats(): Promise<any> {
    // Simplified stats - full implementation later
    const total = await this.prisma.team.count();
    const active = await this.prisma.team.count({
      where: { isActive: true },
    });

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  async deleteTeam(id: string): Promise<void> {
    await this.prisma.team.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
