/**
 * Error handling utilities for vehicle service
 */
export class ErrorHandler {
  /**
   * Create a standardized error response
   */
  static createError(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    return {
      error: {
        message,
        code,
        statusCode,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Handle Prisma errors and convert to standardized format
   */
  static handlePrismaError(error: any) {
    if (error.code === 'P2002') {
      return this.createError(
        'A record with this information already exists',
        'DUPLICATE_RECORD',
        409,
        { field: error.meta?.target }
      );
    }

    if (error.code === 'P2025') {
      return this.createError(
        'Record not found',
        'NOT_FOUND',
        404
      );
    }

    if (error.code === 'P2003') {
      return this.createError(
        'Related record not found',
        'FOREIGN_KEY_CONSTRAINT',
        400,
        { field: error.meta?.field_name }
      );
    }

    // Default Prisma error
    return this.createError(
      'Database operation failed',
      'DATABASE_ERROR',
      500,
      { originalError: error.message }
    );
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, message: string) {
    return this.createError(
      `Validation failed for ${field}: ${message}`,
      'VALIDATION_ERROR',
      400,
      { field }
    );
  }

  /**
   * Handle authorization errors
   */
  static handleAuthError(message: string = 'Unauthorized') {
    return this.createError(
      message,
      'UNAUTHORIZED',
      401
    );
  }

  /**
   * Handle forbidden errors
   */
  static handleForbiddenError(message: string = 'Forbidden') {
    return this.createError(
      message,
      'FORBIDDEN',
      403
    );
  }

  /**
   * Handle not found errors
   */
  static handleNotFoundError(resource: string) {
    return this.createError(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      { resource }
    );
  }
}

/**
 * Logger utility for consistent logging
 */
export class Logger {
  static info(message: string, metadata?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, metadata || '');
  }

  static warn(message: string, metadata?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, metadata || '');
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }

  static debug(message: string, metadata?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, metadata || '');
    }
  }
}
