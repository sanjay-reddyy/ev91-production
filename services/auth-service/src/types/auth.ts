import { Request } from "express";
import { Employee, Role, Permission } from "./employee";

// Enhanced User interface with RBAC and Employee context
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  emailVerified?: boolean;
  lastLoginAt?: Date;

  // Enhanced role and permission structure
  roles: Array<{
    id: string;
    name: string;
    level?: number; // Make this optional
    isActive: boolean; // Add this
    permissions: Array<{
      id: string;
      name: string;
      service: string;
      resource: string;
      action: string;
      isActive?: boolean; // Add this
    }>;
  }>;

  // Employee context if user is an employee
  employee?: {
    id: string;
    employeeId: string;
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
    manager?: {
      id: string;
      name: string;
    };
  };
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

// Password reset types
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Enhanced sign-up with email verification
export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface EmailVerificationData {
  token: string;
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

// Employee-specific authentication types
export interface EmployeeLoginCredentials {
  email: string;
  password: string;
  employeeId?: string; // Optional alternative to email
}

export interface EmployeeRegistrationData {
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

// Enhanced JWT payload for employees
export interface JwtPayload {
  userId: string;
  email: string;

  // Role and permission context
  roles: Array<{
    id: string;
    name: string;
    level?: number; // Make this optional
  }>;
  permissions: Array<{
    service: string;
    resource: string;
    action: string;
  }>;

  // Employee context (if applicable)
  employee?: {
    id: string;
    employeeId: string;
    departmentId: string;
    teamId?: string;
    managerId?: string;
  };

  // Standard JWT fields
  iat?: number;
  exp?: number;
}

// Permission check types with enhanced service context
export interface PermissionCheck {
  service: string; // auth, vehicle, rider, client-store, spare-parts, etc.
  resource: string; // users, vehicles, reports, etc.
  action: string; // create, read, update, delete, approve, etc.
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
  sortOrder?: "asc" | "desc";
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
