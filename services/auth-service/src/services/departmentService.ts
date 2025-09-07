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

  // Basic CRUD operations only - full implementation will come later
  async createDepartment(data: CreateDepartmentDto): Promise<Department> {
    return (await this.prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        code: data.code,
      },
    })) as any;
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    return (await this.prisma.department.findUnique({
      where: { id },
    })) as any;
  }

  async getAllDepartments(includeInactive?: boolean): Promise<Department[]> {
    const departments = await this.prisma.department.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            managerId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            manager: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            position: true,
          },
          where: {
            user: { isActive: true },
          },
        },
        _count: {
          select: {
            employees: true,
            teams: true,
          },
        },
      },
    });

    return departments as any;
  }

  async getDepartmentHierarchy(): Promise<any> {
    // Simplified hierarchy - full implementation later
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            employees: true,
            teams: true,
          },
        },
      },
    });

    return departments.map((dept) => ({
      ...dept,
      employeeCount: dept._count.employees,
      teamCount: dept._count.teams,
    }));
  }

  async getDepartmentStats(): Promise<any> {
    // Simplified stats - full implementation later
    const total = await this.prisma.department.count();
    const active = await this.prisma.department.count({
      where: { isActive: true },
    });

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  async updateDepartment(
    id: string,
    data: UpdateDepartmentDto
  ): Promise<Department> {
    return (await this.prisma.department.update({
      where: { id },
      data,
    })) as any;
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
