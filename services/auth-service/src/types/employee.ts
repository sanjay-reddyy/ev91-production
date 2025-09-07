// Employee and organizational types

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  // Flattened user fields for frontend compatibility
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  phone?: string;
  departmentId: string;
  teamId?: string;
  managerId?: string;
  position?: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Populated relationships
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: Date;
  };
  roles: {
    id: string;
    name: string;
    description?: string;
    level?: number;
  }[];
  department?: Department;
  team?: Team;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  city?: string;
  state?: string;
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
  email?: string;
  employeeId?: string;
  phone?: string;
  departmentId?: string;
  teamId?: string | null;
  managerId?: string;
  position?: string;
  hireDate?: Date;
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
  city?: string;
  state?: string;
  maxMembers?: number;
  skills?: string[];
  status?: string;
  memberCount?: number;
  isActive?: boolean;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  departmentId?: string;
  managerId?: string;
  city?: string;
  state?: string;
  maxMembers?: number;
  skills?: string[];
  status?: string;
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
  employee: Employee;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
    permissions: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  }>;
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
  managerId?: string;
  isActive?: boolean;
  search?: string; // Search in name, email, employeeId
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "hireDate" | "department" | "team" | "createdAt";
  sortOrder?: "asc" | "desc";
}
