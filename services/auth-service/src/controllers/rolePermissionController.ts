import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { RolePermissionService } from "../services/rolePermissionService";
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from "../types/employee";
import { ApiResponse } from "../types/auth";

export class RolePermissionController {
  private rolePermissionService: RolePermissionService;

  constructor() {
    this.rolePermissionService = new RolePermissionService();
  }

  // =================== ROLE METHODS ===================

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response): Promise<void> {
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

      const roleData: CreateRoleDto = req.body;
      const role = await this.rolePermissionService.createRole(roleData);

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: { role },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Create role error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create role",
      } as ApiResponse);
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const { includeInactive } = req.query;
      const roles = await this.rolePermissionService.getAllRoles(
        includeInactive === "true"
      );

      res.json({
        success: true,
        message: "Roles retrieved successfully",
        data: { roles, count: roles.length },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get roles error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve roles",
      } as ApiResponse);
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const role = await this.rolePermissionService.getRoleById(id);

      if (!role) {
        res.status(404).json({
          success: false,
          error: "Role not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Role retrieved successfully",
        data: { role },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get role error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve role",
      } as ApiResponse);
    }
  }

  /**
   * Update role
   */
  async updateRole(req: Request, res: Response): Promise<void> {
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
      const updateData: UpdateRoleDto = req.body;

      const role = await this.rolePermissionService.updateRole(id, updateData);

      res.json({
        success: true,
        message: "Role updated successfully",
        data: { role },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Update role error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update role",
      } as ApiResponse);
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.rolePermissionService.deleteRole(id);

      res.json({
        success: true,
        message: "Role deleted successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Delete role error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to delete role",
      } as ApiResponse);
    }
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionId } = req.params;
      console.log(`🔄 Assigning permission ${permissionId} to role ${roleId}`);

      await this.rolePermissionService.assignPermissionToRole(
        roleId,
        permissionId
      );

      console.log(
        `✅ Successfully assigned permission ${permissionId} to role ${roleId}`
      );
      res.json({
        success: true,
        message: "Permission assigned to role successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("❌ Assign permission to role error:", error);
      console.error("Error stack:", error.stack);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to assign permission to role",
      } as ApiResponse);
    }
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionId } = req.params;
      await this.rolePermissionService.removePermissionFromRole(
        roleId,
        permissionId
      );

      res.json({
        success: true,
        message: "Permission removed from role successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Remove permission from role error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to remove permission from role",
      } as ApiResponse);
    }
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permissions = await this.rolePermissionService.getRolePermissions(
        id
      );

      res.json({
        success: true,
        message: "Role permissions retrieved successfully",
        data: { permissions },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get role permissions error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve role permissions",
      } as ApiResponse);
    }
  }

  // =================== PERMISSION METHODS ===================

  /**
   * Create a new permission
   */
  async createPermission(req: Request, res: Response): Promise<void> {
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

      const permissionData: CreatePermissionDto = req.body;
      const permission = await this.rolePermissionService.createPermission(
        permissionData
      );

      res.status(201).json({
        success: true,
        message: "Permission created successfully",
        data: { permission },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Create permission error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create permission",
      } as ApiResponse);
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { includeInactive } = req.query;
      const permissions = await this.rolePermissionService.getAllPermissions(
        includeInactive === "true"
      );

      res.json({
        success: true,
        message: "Permissions retrieved successfully",
        data: { permissions, count: permissions.length },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get permissions error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve permissions",
      } as ApiResponse);
    }
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await this.rolePermissionService.getPermissionById(id);

      if (!permission) {
        res.status(404).json({
          success: false,
          error: "Permission not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Permission retrieved successfully",
        data: { permission },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get permission error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve permission",
      } as ApiResponse);
    }
  }

  /**
   * Update permission
   */
  async updatePermission(req: Request, res: Response): Promise<void> {
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
      const updateData: UpdatePermissionDto = req.body;

      const permission = await this.rolePermissionService.updatePermission(
        id,
        updateData
      );

      res.json({
        success: true,
        message: "Permission updated successfully",
        data: { permission },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Update permission error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update permission",
      } as ApiResponse);
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.rolePermissionService.deletePermission(id);

      res.json({
        success: true,
        message: "Permission deleted successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Delete permission error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to delete permission",
      } as ApiResponse);
    }
  }

  // =================== USER ROLE METHODS ===================

  /**
   * Assign role to user
   */
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.params;
      await this.rolePermissionService.assignRoleToUser(userId, roleId);

      res.json({
        success: true,
        message: "Role assigned to user successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Assign role to user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to assign role to user",
      } as ApiResponse);
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.params;
      await this.rolePermissionService.removeRoleFromUser(userId, roleId);

      res.json({
        success: true,
        message: "Role removed from user successfully",
      } as ApiResponse);
    } catch (error: any) {
      console.error("Remove role from user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to remove role from user",
      } as ApiResponse);
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const roles = await this.rolePermissionService.getUserRoles(userId);

      res.json({
        success: true,
        message: "User roles retrieved successfully",
        data: { roles },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get user roles error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve user roles",
      } as ApiResponse);
    }
  }

  /**
   * Get user effective permissions
   */
  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const permissions =
        await this.rolePermissionService.getUserEffectivePermissions(userId);

      res.json({
        success: true,
        message: "User permissions retrieved successfully",
        data: { permissions },
      } as ApiResponse);
    } catch (error: any) {
      console.error("Get user permissions error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve user permissions",
      } as ApiResponse);
    }
  }
}
