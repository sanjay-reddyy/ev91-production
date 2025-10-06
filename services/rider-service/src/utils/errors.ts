// Error handling utility classes

// Base class for custom errors
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request - Invalid input or parameters
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// 401 Unauthorized - Authentication required
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
  }
}

// 403 Forbidden - Authenticated but not authorized
export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
  }
}

// 404 Not Found - Resource not found
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

// 409 Conflict - Resource conflict
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// 422 Unprocessable Entity - Valid syntax but semantically incorrect
export class ValidationError extends AppError {
  errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(message, 422);
    this.errors = errors;
  }
}

// 500 Internal Server Error - Server-side error
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}

// Error handler for async functions
export const asyncHandler =
  (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
