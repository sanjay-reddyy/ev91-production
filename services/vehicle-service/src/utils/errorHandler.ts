/**
 * Application Error class for better error handling
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;
  public timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "UNKNOWN_ERROR",
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error handling utilities for vehicle service
 */
export class ErrorHandler {
  /**
   * Create and throw a standardized error
   */
  static createError(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
    details?: any
  ): never {
    throw new AppError(message, statusCode, code, details);
  }

  /**
   * Handle Prisma errors and convert to standardized format
   */
  static handlePrismaError(error: any): never {
    Logger.error("Prisma error details:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack,
    });

    if (error.code === "P2002") {
      throw new AppError(
        "A record with this information already exists",
        409,
        "DUPLICATE_RECORD",
        { field: error.meta?.target }
      );
    }

    if (error.code === "P2025") {
      throw new AppError("Record not found", 404, "NOT_FOUND");
    }

    if (error.code === "P2003") {
      throw new AppError(
        "Related record not found",
        400,
        "FOREIGN_KEY_CONSTRAINT",
        { field: error.meta?.field_name }
      );
    }

    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Default for unknown Prisma errors
    throw new AppError(
      `Database operation failed: ${error.message}`,
      500,
      "DATABASE_ERROR",
      { originalError: error.message, code: error.code }
    );
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, message: string): never {
    throw new AppError(
      `Validation failed for ${field}: ${message}`,
      400,
      "VALIDATION_ERROR",
      { field }
    );
  }

  /**
   * Handle authorization errors
   */
  static handleAuthError(message: string = "Unauthorized"): never {
    throw new AppError(message, 401, "UNAUTHORIZED");
  }

  /**
   * Handle forbidden errors
   */
  static handleForbiddenError(message: string = "Forbidden"): never {
    throw new AppError(message, 403, "FORBIDDEN");
  }

  /**
   * Handle not found errors
   */
  static handleNotFoundError(resource: string): never {
    throw new AppError(`${resource} not found`, 404, "NOT_FOUND", { resource });
  }
}

/**
 * Logger utility for consistent logging
 */
export class Logger {
  static info(message: string, metadata?: any) {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      metadata || ""
    );
  }

  static warn(message: string, metadata?: any) {
    console.warn(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      metadata || ""
    );
  }

  static error(message: string, error?: any) {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || ""
    );
  }

  static debug(message: string, metadata?: any) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        metadata || ""
      );
    }
  }
}
