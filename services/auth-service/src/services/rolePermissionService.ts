import { PrismaClient } from "@prisma/client";
import {
  Role,
  Permission,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from "../types/employee";

export class RolePermissionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // =================== ROLE METHODS ===================

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleDto): Promise<Role> {
    // Check if role name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new Error("Role with this name already exists");
    }

    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        level: data.level || 1,
        isActive: true,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Assign permissions if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      await this.assignPermissionsToRole(role.id, data.permissionIds);

      // Fetch updated role with permissions
      return (await this.getRoleById(role.id)) as Role;
    }

    return role as Role;
  }

  /**
   * Get all roles
   */
  async getAllRoles(includeInactive: boolean = false): Promise<Role[]> {
    const where = includeInactive ? {} : { isActive: true };

    return (await this.prisma.role.findMany({
      where,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: [{ level: "desc" }, { name: "asc" }],
    })) as Role[];
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    return (await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              include: {
                employee: {
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
                  },
                },
              },
            },
          },
        },
      },
    })) as Role;
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // Check for name conflicts
    if (data.name && data.name !== role.name) {
      const existingName = await this.prisma.role.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        throw new Error("Role with this name already exists");
      }
    }

    return (await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.isActive,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })) as Role;
  }

  /**
   * Delete role (only if no users assigned)
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.userRoles.length > 0) {
      throw new Error("Cannot delete role with assigned users");
    }

    // Delete role permissions first
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Delete role
    await this.prisma.role.delete({
      where: { id },
    });
  }

  // =================== PERMISSION METHODS ===================

  /**
   * Create a new permission
   */
  async createPermission(data: CreatePermissionDto): Promise<Permission> {
    // Check if permission already exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: {
        service_resource_action: {
          service: data.service,
          resource: data.resource,
          action: data.action,
        },
      },
    });

    if (existingPermission) {
      throw new Error(
        "Permission with this service-resource-action combination already exists"
      );
    }

    return (await this.prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        service: data.service,
        resource: data.resource,
        action: data.action,
        isActive: true,
      },
    })) as Permission;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(
    includeInactive: boolean = false
  ): Promise<Permission[]> {
    const where = includeInactive ? {} : { isActive: true };

    return (await this.prisma.permission.findMany({
      where,
      orderBy: [{ service: "asc" }, { resource: "asc" }, { action: "asc" }],
    })) as Permission[];
  }

  /**
   * Get permissions by service
   */
  async getPermissionsByService(service: string): Promise<Permission[]> {
    return (await this.prisma.permission.findMany({
      where: {
        service: service,
        isActive: true,
      },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    })) as Permission[];
  }

  /**
   * Update permission
   */
  async updatePermission(
    id: string,
    data: UpdatePermissionDto
  ): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new Error("Permission not found");
    }

    return (await this.prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    })) as Permission;
  }

  // =================== ROLE-PERMISSION ASSIGNMENT METHODS ===================

  /**
   * Assign permissions to role
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    // Validate role
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // SAFETY CHECK: Prevent Super Admin role from losing permissions
    if (role.name === "Super Admin" && permissionIds.length === 0) {
      throw new Error("Cannot remove all permissions from Super Admin role");
    }

    // Validate all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
        isActive: true,
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new Error("One or more permissions not found or inactive");
    }

    // Use a transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Remove existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions (only if we have any)
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });
  }

  /**
   * Remove permissions from role
   */
  async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    });
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission) as Permission[];
  }

  // =================== USER-ROLE ASSIGNMENT METHODS ===================

  /**
   * Assign roles to user
   */
  async assignRolesToUser(
    userId: string,
    roleIds: string[],
    createdBy?: string
  ): Promise<void> {
    // Validate user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // SAFETY CHECK: Prevent Super Admin users from losing Super Admin role
    const hasSuperAdminRole = user.userRoles.some(
      (ur) => ur.role.name === "Super Admin"
    );
    if (hasSuperAdminRole && user.email === "admin@ev91.com") {
      const superAdminRole = await this.prisma.role.findFirst({
        where: { name: "Super Admin" },
      });

      if (superAdminRole && !roleIds.includes(superAdminRole.id)) {
        throw new Error(
          "Cannot remove Super Admin role from primary admin user (admin@ev91.com)"
        );
      }
    }

    // Validate all roles exist
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
        isActive: true,
      },
    });

    if (roles.length !== roleIds.length) {
      throw new Error("One or more roles not found or inactive");
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Remove existing roles
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Add new roles
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          createdBy,
        })),
      });
    });
  }

  /**
   * Remove roles from user
   */
  async removeRolesFromUser(userId: string, roleIds: string[]): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: { in: roleIds },
      },
    });
  }

  /**
   * Get user roles with permissions
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
    });

    return userRoles.map((ur) => ur.role) as Role[];
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(
    userId: string,
    service: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
    });

    return userRoles.some(
      (ur) =>
        ur.role.isActive &&
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
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
    });

    const permissions = new Map<string, Permission>();

    userRoles.forEach((ur) => {
      if (ur.role.isActive) {
        ur.role.permissions.forEach((rp) => {
          if (rp.permission.isActive) {
            permissions.set(rp.permission.id, rp.permission as Permission);
          }
        });
      }
    });

    return Array.from(permissions.values());
  }

  // =================== SINGLE ITEM METHODS ===================

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission | null> {
    const result = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      service: result.service,
      resource: result.resource,
      action: result.action,
      description: result.description || undefined,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * Delete permission
   */
  async deletePermission(id: string): Promise<void> {
    // Check if permission is being used
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { permissionId: id },
    });

    if (rolePermissions.length > 0) {
      throw new Error("Cannot delete permission that is assigned to roles");
    }

    await this.prisma.permission.delete({
      where: { id },
    });
  }

  /**
   * Assign single permission to role
   */
  async assignPermissionToRole(
    roleId: string,
    permissionId: string
  ): Promise<void> {
    console.log(
      `🔍 Service: Assigning permission ${permissionId} to role ${roleId}`
    );

    // Validate role
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      console.error(`❌ Role not found: ${roleId}`);
      throw new Error("Role not found");
    }

    console.log(`✅ Role found: ${role.name} (${role.id})`);

    // Validate permission exists and is active
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission || !permission.isActive) {
      console.error(`❌ Permission not found or inactive: ${permissionId}`);
      throw new Error("Permission not found or inactive");
    }

    console.log(`✅ Permission found: ${permission.name} (${permission.id})`);

    // Check if permission is already assigned
    const existingAssignment = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: roleId,
        permissionId: permissionId,
      },
    });

    if (existingAssignment) {
      console.log(`ℹ️  Permission already assigned, skipping...`);
      // Permission already assigned, no action needed
      return;
    }

    console.log(`🔄 Creating new role-permission assignment...`);

    // Assign the permission
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    console.log(`✅ Permission assignment completed successfully`);
  }

  /**
   * Remove single permission from role
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Promise<void> {
    // Validate role
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // SAFETY CHECK: Prevent removing permissions from Super Admin role
    if (role.name === "Super Admin") {
      throw new Error(
        "Cannot remove permissions from Super Admin role. Super Admin must have all permissions for security reasons."
      );
    }

    // Remove the specific permission
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Assign single role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.assignRolesToUser(userId, [roleId]);
  }

  /**
   * Remove single role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.removeRolesFromUser(userId, [roleId]);
  }

  /**
   * Get user effective permissions (alias for getUserPermissions)
   */
  async getUserEffectivePermissions(userId: string): Promise<Permission[]> {
    return this.getUserPermissions(userId);
  }
}
