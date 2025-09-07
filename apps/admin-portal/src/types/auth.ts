// Auth Types matching the backend
export interface User {
  id: string;
  userId?: string;
  employeeId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  position?: string;
  hireDate?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  createdAt?: string;
  updatedAt?: string;
  department?: Department;
  team?: Team;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    id: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
  };
  roles: Role[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  teams?: {
    id: string;
    name: string;
    description?: string;
    departmentId: string;
    managerId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    manager?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    _count?: {
      employees: number;
    };
  }[];
  employees?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    isActive: boolean;
  }[];
  _count?: {
    employees: number;
    teams: number;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
  managerId?: string;
  city?: string;
  state?: string;
  memberCount?: number;
  maxMembers?: number;
  skills?: string[];
  status?: "Active" | "Inactive";
  createdAt: string;
  updatedAt?: string;
  // Virtual fields populated by backend
  department?: string | { id: string; name: string; code: string };
  teamLead?:
    | string
    | { id: string; firstName: string; lastName: string; email: string };
  manager?: { id: string; firstName: string; lastName: string; email: string };
  employees?: Array<{
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  }>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: (Permission | RolePermission)[];
}

export interface Permission {
  id: string;
  name: string;
  service: string;
  resource: string;
  action: string;
  description?: string;
  isActive?: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId?: string;
  teamId?: string;
  roleIds?: string[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  totalTeams: number;
  totalRoles: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type:
    | "user_created"
    | "role_assigned"
    | "department_created"
    | "team_created";
  message: string;
  timestamp: Date;
  user?: string;
}

// Form Types
export interface UserFormData {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId: string;
  teamId?: string;
  roleIds: string[];
  hireDate: Date;
  position?: string;
  managerId?: string;
  temporaryPassword: string;
}

export interface DepartmentFormData {
  name: string;
  description?: string;
  code?: string;
  parentId?: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  code?: string;
  isActive?: boolean;
  parentId?: string;
}

export interface TeamFormData {
  name: string;
  description?: string;
  departmentId: string;
  teamLeadId?: string;
  city: string;
  state: string;
  maxMembers: number;
  skills: string[];
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissionIds?: string[];
}
