import { useAuth } from "../contexts/AuthContext";
import { Permission } from "../types/auth";

export interface PermissionCheck {
  service: string;
  resource: string;
  action: string;
}

export const usePermissions = () => {
  const { user } = useAuth();

  // Check if user is super admin (defined early so other functions can use it)
  const isSuperAdmin = (): boolean => {
    const result =
      user?.roles?.some(
        (role) => role.name === "Super Admin" && role.isActive
      ) || false;

    return result;
  };

  // Get all user permissions from all roles
  const getUserPermissions = (): Permission[] => {
    if (!user?.roles) return [];

    console.log("🐛 getUserPermissions - User roles:", user.roles.length);

    const permissions: Permission[] = [];
    const seen = new Set<string>();

    user.roles.forEach((role, index) => {
      console.log(
        `🐛 Processing role ${index + 1}: ${role.name} (isActive: ${
          role.isActive
        })`
      );

      // Treat undefined isActive as true (active by default)
      if (role.isActive !== false && role.permissions) {
        console.log(
          `🐛 Role ${role.name} is active and has ${role.permissions.length} permissions`
        );

        role.permissions.forEach((rolePermission) => {
          let permission: Permission;

          // Handle both direct permissions and nested permission structure
          if ("permission" in rolePermission && rolePermission.permission) {
            permission = rolePermission.permission;
          } else {
            permission = rolePermission as Permission;
          }

          if (
            permission &&
            permission.isActive !== false &&
            !seen.has(permission.id)
          ) {
            permissions.push(permission);
            seen.add(permission.id);
            console.log(
              `🐛 Added permission: ${permission.service}:${permission.resource}:${permission.action}`
            );
          } else {
            console.log(
              `🐛 Skipped permission (already seen or inactive):`,
              permission?.id,
              permission?.isActive
            );
          }
        });
      } else {
        console.log(`🐛 Role ${role.name} is inactive or has no permissions`);
      }
    });

    console.log(`🐛 Total permissions extracted: ${permissions.length}`);
    return permissions;

    return permissions;
  };

  // Check if user has a specific permission
  const hasPermission = (
    service: string,
    resource: string,
    action: string
  ): boolean => {
    // Fallback bypass for admin@ev91.com
    if (user?.email === "admin@ev91.com") {
      return true;
    }

    // Super Admin bypass - always return true for Super Admin
    if (isSuperAdmin()) {
      return true;
    }

    const permissions = getUserPermissions();
    const result = permissions.some(
      (p) =>
        p.service === service && p.resource === resource && p.action === action
    );

    return result;
  };

  // Check if user has any permission for a resource (useful for showing/hiding UI elements)
  const hasAnyPermission = (service: string, resource: string): boolean => {
    // Fallback bypass for admin@ev91.com
    if (user?.email === "admin@ev91.com") {
      return true;
    }

    // Super Admin bypass
    if (isSuperAdmin()) {
      return true;
    }

    const permissions = getUserPermissions();
    return permissions.some(
      (p) => p.service === service && p.resource === resource
    );
  };

  // Check if user has read permission for a resource
  const hasReadPermission = (service: string, resource: string): boolean => {
    return hasPermission(service, resource, "read");
  };

  // Check if user has create permission for a resource
  const hasCreatePermission = (service: string, resource: string): boolean => {
    return hasPermission(service, resource, "create");
  };

  // Check if user has update permission for a resource
  const hasUpdatePermission = (service: string, resource: string): boolean => {
    return hasPermission(service, resource, "update");
  };

  // Check if user has delete permission for a resource
  const hasDeletePermission = (service: string, resource: string): boolean => {
    return hasPermission(service, resource, "delete");
  };

  // Check if user has manage permission for a resource (typically includes all CRUD operations)
  const hasManagePermission = (service: string, resource: string): boolean => {
    return hasPermission(service, resource, "manage");
  };

  // Check multiple permissions at once
  const hasPermissions = (permissions: PermissionCheck[]): boolean => {
    // Fallback bypass for admin@ev91.com
    if (user?.email === "admin@ev91.com") {
      return true;
    }

    // Super Admin bypass
    if (isSuperAdmin()) {
      return true;
    }

    return permissions.every((p) =>
      hasPermission(p.service, p.resource, p.action)
    );
  };

  // Check if user has any of the specified permissions (OR logic)
  const hasAnyOfPermissions = (permissions: PermissionCheck[]): boolean => {
    // Fallback bypass for admin@ev91.com
    if (user?.email === "admin@ev91.com") {
      return true;
    }

    // Super Admin bypass
    if (isSuperAdmin()) {
      return true;
    }

    return permissions.some((p) =>
      hasPermission(p.service, p.resource, p.action)
    );
  };

  // Get permission for displaying error messages
  const getRequiredPermission = (
    service: string,
    resource: string,
    action: string
  ): string => {
    return `${service}:${resource}:${action}`;
  };

  return {
    getUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasReadPermission,
    hasCreatePermission,
    hasUpdatePermission,
    hasDeletePermission,
    hasManagePermission,
    hasPermissions,
    hasAnyOfPermissions,
    isSuperAdmin,
    getRequiredPermission,
  };
};
