import { Request, Response, NextFunction } from "express";

// Custom error with code
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(
    message: string,
    statusCode: number,
    code: string = "UNKNOWN_ERROR"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper to create a standardized error
export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = "UNKNOWN_ERROR"
) => {
  return new ApiError(message, statusCode, code);
};

// Async handler to eliminate try-catch blocks
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handling middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`⚠️ Error: ${err.message}`);
  console.error(err.stack);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with this data already exists.",
        code: "DUPLICATE_RECORD",
      });
    } else if (prismaErr.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
        code: "NOT_FOUND",
      });
    } else if (prismaErr.code.startsWith("P2")) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided.",
        code: prismaErr.code,
      });
    }
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: "Server error. Please try again later.",
    code: "SERVER_ERROR",
  });
};
