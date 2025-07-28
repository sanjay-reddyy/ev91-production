import { createLogger } from './utils/logger';
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, InternalServerError } from './utils/errors';
import { errorHandler } from './middleware/errorHandler';

// Export all common utilities
export {
  // Errors
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  
  // Logging
  createLogger,
  
  // Middleware
  errorHandler,
};

// Types for service communication
export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}
