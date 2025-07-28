import { Request } from 'express';

// Enhanced User interface with RBAC
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  roles: Array<{
    id: string;
    name: string;
    permissions: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  }>;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}

// Role types
export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Permission types
export interface CreatePermissionData {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// Role assignment types
export interface AssignRoleData {
  userId: string;
  roleId: string;
  expiresAt?: Date;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Permission check types
export interface PermissionCheck {
  resource: string;
  action: string;
  requireAll?: boolean; // For multiple permissions
}

// API Response types
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

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
    interface User extends AuthUser {}
  }
}
