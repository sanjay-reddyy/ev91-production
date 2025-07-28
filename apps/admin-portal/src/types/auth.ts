// Auth Types matching the backend
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  isActive: boolean
  department?: Department
  team?: Team
  roles: Role[]
}

export interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
  parentId?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  isActive: boolean
  departmentId: string
  teamLeadId?: string
  city: string
  country: string
  memberCount: number
  maxMembers: number
  skills: string[]
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt?: string
  // Virtual fields populated by backend
  department?: string
  teamLead?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

// API Request/Response Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  departmentId?: string
  teamId?: string
  roleIds?: string[]
}

export interface AuthResponse {
  success: boolean
  message?: string
  data: {
    user: User
    tokens: {
      accessToken: string
      refreshToken: string
      expiresIn: string
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errors?: Array<{
    field?: string
    message: string
  }>
}

// Auth Context Types
export interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalDepartments: number
  totalTeams: number
  totalRoles: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'user_created' | 'role_assigned' | 'department_created' | 'team_created'
  message: string
  timestamp: Date
  user?: string
}

// Form Types
export interface UserFormData {
  email: string
  firstName: string
  lastName: string
  phone?: string
  departmentId?: string
  teamId?: string
  roleIds?: string[]
  password?: string
}

export interface DepartmentFormData {
  name: string
  description?: string
  parentId?: string
}

export interface TeamFormData {
  name: string
  description?: string
  departmentId: string
  teamLeadId?: string
  city: string
  country: string
  maxMembers: number
  skills: string[]
}

export interface RoleFormData {
  name: string
  description?: string
  permissionIds?: string[]
}
