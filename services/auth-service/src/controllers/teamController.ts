import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { TeamService } from "../services/teamService";
import { CreateTeamDto, UpdateTeamDto } from "../types/employee";
import { ApiResponse } from "../types/auth";

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }

  /**
   * Create team validation rules
   */
  static createTeamValidation = [
    body("name").notEmpty().withMessage("Team name is required"),
    body("departmentId").notEmpty().withMessage("Department ID is required"),
    body("description").optional().isString(),
    body("managerId").optional().isString(),
    body("city").optional().isString(),
    body("state").optional().isString(),
    body("maxMembers")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max members must be a positive integer"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("Status must be Active or Inactive"),
    body("memberCount")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Member count must be a non-negative integer"),
    body("isActive").optional().isBoolean(),
  ];

  /**
   * Update team validation rules
   */
  static updateTeamValidation = [
    body("name").optional().notEmpty().withMessage("Team name cannot be empty"),
    body("description").optional().isString(),
    body("departmentId").optional().isString(),
    body("managerId").optional().isString(),
    body("city").optional().isString(),
    body("state").optional().isString(),
    body("maxMembers")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max members must be a positive integer"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("Status must be Active or Inactive"),
    body("isActive").optional().isBoolean(),
  ];

  /**
   * Create a new team
   */
  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const teamData: CreateTeamDto = req.body;
      const team = await this.teamService.createTeam(teamData);

      res.status(201).json({
        success: true,
        message: "Team created successfully",
        data: { team },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Create team error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create team",
      } as ApiResponse);
    }
  }

  /**
   * Get all teams with optional filtering
   */
  async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, includeInactive } = req.query;

      const teams = await this.teamService.getAllTeams(
        departmentId as string,
        includeInactive === "true"
      );

      res.json({
        success: true,
        message: "Teams retrieved successfully",
        data: { teams, count: teams.length },
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
   * Get team by ID
   */
  async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const team = await this.teamService.getTeamById(id);

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
        data: { team },
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
   * Update team
   */
  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const updateData: UpdateTeamDto = req.body;

      const team = await this.teamService.updateTeam(id, updateData);

      res.json({
        success: true,
        message: "Team updated successfully",
        data: { team },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Update team error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update team",
      } as ApiResponse);
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.teamService.deleteTeam(id);

      res.json({
        success: true,
        message: "Team deleted successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Delete team error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to delete team",
      } as ApiResponse);
    }
  }

  /**
   * Add employee to team
   */
  async addEmployeeToTeam(req: Request, res: Response): Promise<void> {
    try {
      const { teamId, employeeId } = req.params;
      await this.teamService.addEmployeeToTeam(teamId, employeeId);

      res.json({
        success: true,
        message: "Employee added to team successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Add employee to team error:", error);
      res.status(400).json({
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
      await this.teamService.removeEmployeeFromTeam(employeeId);

      res.json({
        success: true,
        message: "Employee removed from team successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Remove employee from team error:", error);
      res.status(400).json({
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

      const teams = await this.teamService.getTeamsByDepartment(
        departmentId,
        includeInactive === "true"
      );

      res.json({
        success: true,
        message: "Department teams retrieved successfully",
        data: { teams, count: teams.length },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get department teams error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve department teams",
      } as ApiResponse);
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.teamService.getTeamStats();

      res.json({
        success: true,
        message: "Team statistics retrieved successfully",
        data: stats,
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get team stats error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve team statistics",
      } as ApiResponse);
    }
  }
}
