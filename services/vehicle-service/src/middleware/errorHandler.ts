import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "UNKNOWN_ERROR";

  // Log error for debugging with more details
  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    message,
    statusCode,
    code,
    details: err.details,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"],
  });

  // Don't leak error details in production
  const errorResponse = {
    success: false,
    error:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : message,
    code,
    ...(process.env.NODE_ENV === "development" &&
      err.details && { details: err.details }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"],
  };

  res.status(statusCode).json(errorResponse);
};

export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
