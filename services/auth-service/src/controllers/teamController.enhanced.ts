import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { TeamService } from "../services/teamService";
import { CreateTeamDto, UpdateTeamDto } from "../types/employee";
import { ApiResponse } from "../types/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Enhanced validation schemas with team-service features
const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  departmentId: z.string(),
  managerId: z.string().optional(),
  city: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  maxMembers: z.number().min(1).max(1000).default(10),
  skills: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
  status: z.string().optional().default("Active"),
});

const updateTeamSchema = createTeamSchema.partial();

// Helper function to format team response
const formatTeamResponse = (team: any) => {
  return {
    ...team,
    skills: team.skills ? JSON.parse(team.skills) : [],
    manager: team.manager
      ? {
          id: team.manager.id,
          firstName: team.manager.firstName,
          lastName: team.manager.lastName,
          email: team.manager.email,
        }
      : null,
    department: team.department
      ? {
          id: team.department.id,
          name: team.department.name,
        }
      : null,
  };
};

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }

  /**
   * Enhanced Create team validation rules
   */
  static createTeamValidation = [
    body("name").notEmpty().withMessage("Team name is required"),
    body("departmentId").notEmpty().withMessage("Department ID is required"),
    body("description").optional().isString(),
    body("managerId").optional().isString(),
    body("city").optional().isString(),
    body("country").optional().isString(),
    body("maxMembers").optional().isInt({ min: 1 }),
    body("skills").optional().isArray(),
  ];

  /**
   * Enhanced Update team validation rules
   */
  static updateTeamValidation = [
    body("name").optional().notEmpty().withMessage("Team name cannot be empty"),
    body("description").optional().isString(),
    body("managerId").optional().isString(),
    body("isActive").optional().isBoolean(),
    body("city").optional().isString(),
    body("country").optional().isString(),
    body("maxMembers").optional().isInt({ min: 1 }),
    body("skills").optional().isArray(),
    body("status").optional().isString(),
  ];

  /**
   * Enhanced Get all teams with team-service features
   */
  async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, includeInactive } = req.query;

      const teams = await prisma.team.findMany({
        where: {
          ...(departmentId && { departmentId: String(departmentId) }),
          ...(includeInactive !== "true" && { isActive: true }),
        },
        include: {
          department: {
            select: { id: true, name: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          employees: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedTeams = teams.map(formatTeamResponse);

      res.json({
        success: true,
        message: "Teams retrieved successfully",
        data: { teams: formattedTeams, count: formattedTeams.length },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get teams error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve teams",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Create a new team with team-service features
   */
  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const validatedData = createTeamSchema.parse(req.body);

      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });

      if (!department) {
        res.status(400).json({
          success: false,
          error: "Department not found",
        } as ApiResponse);
        return;
      }

      // Check if team name already exists in the department
      const existingTeam = await prisma.team.findFirst({
        where: {
          name: validatedData.name,
          departmentId: validatedData.departmentId,
        },
      });

      if (existingTeam) {
        res.status(400).json({
          success: false,
          error: "Team name already exists in this department",
        } as ApiResponse);
        return;
      }

      // Validate manager if provided
      if (validatedData.managerId) {
        const manager = await prisma.employee.findUnique({
          where: { id: validatedData.managerId },
        });

        if (!manager) {
          res.status(400).json({
            success: false,
            error: "Manager not found",
          } as ApiResponse);
          return;
        }
      }

      const team = await prisma.team.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          departmentId: validatedData.departmentId,
          managerId: validatedData.managerId,
          city: validatedData.city || "Unknown",
          country: validatedData.country || "Unknown",
          maxMembers: validatedData.maxMembers || 10,
          skills: validatedData.skills
            ? JSON.stringify(validatedData.skills)
            : null,
          isActive: validatedData.isActive ?? true,
          status: validatedData.status || "Active",
        },
        include: {
          department: { select: { id: true, name: true } },
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Team created successfully",
        data: { team: formatTeamResponse(team) },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Create team error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create team",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Get team by ID with team-service features
   */
  async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          department: { select: { id: true, name: true } },
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          employees: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!team) {
        res.status(404).json({
          success: false,
          error: "Team not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Team retrieved successfully",
        data: { team: formatTeamResponse(team) },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get team error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve team",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Update team with team-service features
   */
  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const validatedData = updateTeamSchema.parse(req.body);

      // Check if team exists
      const existingTeam = await prisma.team.findUnique({
        where: { id },
      });

      if (!existingTeam) {
        res.status(404).json({
          success: false,
          error: "Team not found",
        } as ApiResponse);
        return;
      }

      // Check department if being updated
      if (validatedData.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: validatedData.departmentId },
        });

        if (!department) {
          res.status(400).json({
            success: false,
            error: "Department not found",
          } as ApiResponse);
          return;
        }
      }

      // Check manager if being updated
      if (validatedData.managerId) {
        const manager = await prisma.employee.findUnique({
          where: { id: validatedData.managerId },
        });

        if (!manager) {
          res.status(400).json({
            success: false,
            error: "Manager not found",
          } as ApiResponse);
          return;
        }
      }

      const team = await prisma.team.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.departmentId && {
            departmentId: validatedData.departmentId,
          }),
          ...(validatedData.managerId !== undefined && {
            managerId: validatedData.managerId,
          }),
          ...(validatedData.city && { city: validatedData.city }),
          ...(validatedData.country && { country: validatedData.country }),
          ...(validatedData.maxMembers && {
            maxMembers: validatedData.maxMembers,
          }),
          ...(validatedData.skills && {
            skills: JSON.stringify(validatedData.skills),
          }),
          ...(validatedData.isActive !== undefined && {
            isActive: validatedData.isActive,
          }),
          ...(validatedData.status && { status: validatedData.status }),
        },
        include: {
          department: { select: { id: true, name: true } },
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      res.json({
        success: true,
        message: "Team updated successfully",
        data: { team: formatTeamResponse(team) },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Update team error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update team",
      } as ApiResponse);
    }
  }

  /**
   * Enhanced Delete team
   */
  async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const team = await prisma.team.findUnique({
        where: { id },
        include: { employees: true },
      });

      if (!team) {
        res.status(404).json({
          success: false,
          error: "Team not found",
        } as ApiResponse);
        return;
      }

      // Check if team has employees
      if (team.employees.length > 0) {
        res.status(400).json({
          success: false,
          error:
            "Cannot delete team with existing employees. Please reassign employees first.",
        } as ApiResponse);
        return;
      }

      await prisma.team.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Team deleted successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Delete team error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete team",
      } as ApiResponse);
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(req: Request, res: Response): Promise<void> {
    try {
      const totalTeams = await prisma.team.count();
      const activeTeams = await prisma.team.count({
        where: { isActive: true },
      });
      const inactiveTeams = totalTeams - activeTeams;

      const teamsByDepartment = await prisma.team.groupBy({
        by: ["departmentId"],
        _count: {
          id: true,
        },
      });

      // Get department names
      const departmentIds = teamsByDepartment.map((t) => t.departmentId);
      const departments = await prisma.department.findMany({
        where: {
          id: { in: departmentIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

      const teamsByDepartmentWithNames = teamsByDepartment.map((item) => ({
        departmentId: item.departmentId,
        departmentName: departmentMap.get(item.departmentId) || "Unknown",
        teamCount: item._count.id,
      }));

      res.json({
        success: true,
        data: {
          stats: {
            totalTeams,
            activeTeams,
            inactiveTeams,
            teamsByDepartment: teamsByDepartmentWithNames,
          },
        },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch team statistics",
      } as ApiResponse);
    }
  }

  /**
   * Add employee to team
   */
  async addEmployeeToTeam(req: Request, res: Response): Promise<void> {
    try {
      const { teamId, employeeId } = req.params;

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          employees: true,
        },
      });

      if (!team) {
        res.status(404).json({
          success: false,
          error: "Team not found",
        } as ApiResponse);
        return;
      }

      if (team.employees.length >= team.maxMembers) {
        res.status(400).json({
          success: false,
          error: "Team has reached maximum capacity",
        } as ApiResponse);
        return;
      }

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        } as ApiResponse);
        return;
      }

      await prisma.employee.update({
        where: { id: employeeId },
        data: { teamId },
      });

      // Update member count
      await prisma.team.update({
        where: { id: teamId },
        data: { memberCount: team.employees.length + 1 },
      });

      res.json({
        success: true,
        message: "Employee added to team successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Add employee to team error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to add employee to team",
      } as ApiResponse);
    }
  }

  /**
   * Remove employee from team
   */
  async removeEmployeeFromTeam(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { team: true },
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        } as ApiResponse);
        return;
      }

      if (!employee.teamId) {
        res.status(400).json({
          success: false,
          error: "Employee is not in any team",
        } as ApiResponse);
        return;
      }

      const oldTeamId = employee.teamId;

      await prisma.employee.update({
        where: { id: employeeId },
        data: { teamId: null },
      });

      // Update member count
      const teamEmployeeCount = await prisma.employee.count({
        where: { teamId: oldTeamId },
      });

      await prisma.team.update({
        where: { id: oldTeamId },
        data: { memberCount: teamEmployeeCount },
      });

      res.json({
        success: true,
        message: "Employee removed from team successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Remove employee from team error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to remove employee from team",
      } as ApiResponse);
    }
  }

  /**
   * Get teams by department
   */
  async getTeamsByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      const { includeInactive } = req.query;

      const teams = await prisma.team.findMany({
        where: {
          departmentId,
          ...(includeInactive !== "true" && { isActive: true }),
        },
        include: {
          department: { select: { id: true, name: true } },
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          employees: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedTeams = teams.map(formatTeamResponse);

      res.json({
        success: true,
        message: "Department teams retrieved successfully",
        data: { teams: formattedTeams, count: formattedTeams.length },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get department teams error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve department teams",
      } as ApiResponse);
    }
  }
}
