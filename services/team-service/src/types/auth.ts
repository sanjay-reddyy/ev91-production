import { Request } from 'express';

// Enhanced User interface with team/department info
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
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

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
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

// JWT payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}
