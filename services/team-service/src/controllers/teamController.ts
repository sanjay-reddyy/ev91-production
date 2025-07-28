import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  departmentId: z.string(),
  teamLeadId: z.string().optional(),
  city: z.string().min(2).optional(), // Made optional
  country: z.string().min(2).optional(), // Made optional
  maxMembers: z.number().min(1).max(1000),
  skills: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateTeamSchema = createTeamSchema.partial();

// Helper function to format team response
const formatTeamResponse = (team: any) => {
  return {
    ...team,
    skills: team.skills ? JSON.parse(team.skills) : [],
    // Add virtual fields from relationships
    department: team.department?.name,
    teamLead: team.teamLeadId ? `${team.department?.users?.find((u: any) => u.id === team.teamLeadId)?.firstName || ''} ${team.department?.users?.find((u: any) => u.id === team.teamLeadId)?.lastName || ''}`.trim() : undefined,
  };
};

export class TeamController {
  // Get all teams
  static async getAllTeams(req: Request, res: Response) {
    try {
      const { departmentId } = req.query;
      
      const teams = await prisma.team.findMany({
        where: departmentId ? { departmentId: String(departmentId) } : {},
        include: {
          department: {
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedTeams = teams.map(formatTeamResponse);

      res.json({
        success: true,
        data: { teams: formattedTeams },
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teams',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get team by ID
  static async getTeamById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          department: {
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      const formattedTeam = formatTeamResponse(team);

      res.json({
        success: true,
        data: { team: formattedTeam },
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create new team
  static async createTeam(req: Request, res: Response) {
    try {
      const validatedData = createTeamSchema.parse(req.body);
      
      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });

      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if team name already exists in the department
      const existingTeam = await prisma.team.findFirst({
        where: {
          name: validatedData.name,
          departmentId: validatedData.departmentId,
        },
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'Team name already exists in this department',
        });
      }

      // Validate team lead if provided
      if (validatedData.teamLeadId) {
        const teamLead = await prisma.user.findUnique({
          where: { id: validatedData.teamLeadId },
        });

        if (!teamLead) {
          return res.status(400).json({
            success: false,
            message: 'Team lead not found',
          });
        }
      }

      const team = await prisma.team.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          departmentId: validatedData.departmentId!,
          teamLeadId: validatedData.teamLeadId,
          city: validatedData.city || 'Unknown',
          country: validatedData.country || 'Unknown',
          maxMembers: validatedData.maxMembers,
          skills: validatedData.skills ? JSON.stringify(validatedData.skills) : '[]',
          isActive: validatedData.isActive ?? true,
          status: validatedData.isActive !== false ? 'Active' : 'Inactive',
          memberCount: 0,
        },
        include: {
          department: true,
        },
      });

      const formattedTeam = formatTeamResponse(team);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team: formattedTeam },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      console.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update team
  static async updateTeam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateTeamSchema.parse(req.body);

      // Check if team exists
      const existingTeam = await prisma.team.findUnique({
        where: { id },
      });

      if (!existingTeam) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      // Check department if being updated
      if (validatedData.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: validatedData.departmentId },
        });

        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Department not found',
          });
        }
      }

      // Validate team lead if provided
      if (validatedData.teamLeadId) {
        const teamLead = await prisma.user.findUnique({
          where: { id: validatedData.teamLeadId },
        });

        if (!teamLead) {
          return res.status(400).json({
            success: false,
            message: 'Team lead not found',
          });
        }
      }

      // Update member count if needed
      const memberCount = await prisma.user.count({
        where: { teamId: id },
      });

      const updateData: any = {
        ...validatedData,
        memberCount,
      };

      if (validatedData.skills) {
        updateData.skills = JSON.stringify(validatedData.skills);
      }

      if (validatedData.isActive !== undefined) {
        updateData.status = validatedData.isActive ? 'Active' : 'Inactive';
      }

      const team = await prisma.team.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
        },
      });

      const formattedTeam = formatTeamResponse(team);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: { team: formattedTeam },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete team
  static async deleteTeam(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          users: true,
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      // Check if team has members
      if (team.users.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete team with active members. Please reassign or remove team members first.',
        });
      }

      await prisma.team.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete team',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get team statistics
  static async getTeamStats(req: Request, res: Response) {
    try {
      const totalTeams = await prisma.team.count();
      const activeTeams = await prisma.team.count({
        where: { isActive: true },
      });
      const inactiveTeams = totalTeams - activeTeams;

      const teamsByDepartment = await prisma.team.groupBy({
        by: ['departmentId'],
        _count: {
          id: true,
        },
      });

      // Get department names separately
      const departmentIds = teamsByDepartment.map(t => t.departmentId);
      const departments = await prisma.department.findMany({
        where: {
          id: { in: departmentIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const departmentMap = new Map(departments.map(d => [d.id, d.name]));
      
      const teamsByDepartmentWithNames = teamsByDepartment.map(item => ({
        departmentId: item.departmentId,
        departmentName: departmentMap.get(item.departmentId) || 'Unknown',
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
      });
    } catch (error) {
      console.error('Error fetching team stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
