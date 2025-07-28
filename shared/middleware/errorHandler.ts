import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware for Express
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error handling request: ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack,
    requestId: req.headers['x-request-id'] || 'unknown',
  });

  // Check if error is operational (expected)
  const appError = err instanceof AppError ? err : new AppError('Internal Server Error', 500);

  // Return standardized error response
  return res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
