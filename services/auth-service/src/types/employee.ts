// Employee and organizational types

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  teamId?: string;
  managerId?: string;
  position?: string;
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Populated relationships
  user?: {
    id: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: Date;
  };
  department?: Department;
  team?: Team;
  manager?: Employee;
  subordinates?: Employee[];
  managedTeams?: Team[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Populated relationships
  teams?: Team[];
  employees?: Employee[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Populated relationships
  department?: Department;
  manager?: Employee;
  employees?: Employee[];
  teamMembers?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Populated relationships
  permissions?: Array<{
    permission: Permission;
  }>;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  service: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for creating/updating entities
export interface CreateEmployeeDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  teamId?: string;
  managerId?: string;
  position?: string;
  hireDate: Date;
  roleIds: string[];
  temporaryPassword: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
  teamId?: string | null;
  managerId?: string;
  position?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  code?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  departmentId: string;
  managerId?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  level?: number;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  level?: number;
  isActive?: boolean;
}

export interface CreatePermissionDto {
  name: string;
  description?: string;
  service: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Login response for employees
export interface EmployeeLoginResponse {
  token: string;
  refreshToken: string;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    position?: string;
    department: {
      id: string;
      name: string;
      code?: string;
    };
    team?: {
      id: string;
      name: string;
    };
    roles: Array<{
      id: string;
      name: string;
      level: number;
    }>;
    permissions: Array<{
      service: string;
      resource: string;
      action: string;
    }>;
  };
}

// Permission check types
export interface PermissionCheck {
  service: string;
  resource: string;
  action: string;
}

export interface HasPermissionOptions {
  requireAll?: boolean; // If checking multiple permissions
  checkInactive?: boolean; // Include inactive permissions
}

// Organizational hierarchy types
export interface OrganizationalHierarchy {
  departments: Array<{
    id: string;
    name: string;
    teams: Array<{
      id: string;
      name: string;
      manager?: {
        id: string;
        name: string;
      };
      employeeCount: number;
    }>;
    employeeCount: number;
  }>;
}

// Employee search/filter types
export interface EmployeeSearchOptions {
  departmentId?: string;
  teamId?: string;
  roleId?: string;
  isActive?: boolean;
  search?: string; // Search in name, email, employeeId
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "hireDate" | "department" | "team";
  sortOrder?: "asc" | "desc";
}
