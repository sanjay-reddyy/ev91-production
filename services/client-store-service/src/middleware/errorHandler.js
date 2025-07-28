"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.asyncHandler = exports.errorHandler = void 0;
var errorHandler = function (error, req, res, next) {
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Default error response
    var statusCode = error.statusCode || 500;
    var message = error.message || 'Internal server error';
    var code = error.code || 'INTERNAL_ERROR';
    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
    }
    else if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
        code = 'DUPLICATE_ENTRY';
    }
    else if (error.message.includes('not found')) {
        statusCode = 404;
        code = 'NOT_FOUND';
    }
    // Prisma specific errors
    if (error.name === 'PrismaClientKnownRequestError') {
        var prismaError = error;
        switch (prismaError.code) {
            case 'P2002':
                statusCode = 409;
                message = 'Duplicate entry - record already exists';
                code = 'DUPLICATE_ENTRY';
                break;
            case 'P2014':
                statusCode = 400;
                message = 'Invalid ID - related record not found';
                code = 'INVALID_RELATION';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Foreign key constraint failed';
                code = 'FOREIGN_KEY_ERROR';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                code = 'NOT_FOUND';
                break;
            default:
                statusCode = 500;
                message = 'Database error';
                code = 'DATABASE_ERROR';
        }
    }
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    res.status(statusCode).json({
        success: false,
        error: __assign({ code: code, message: message }, (process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.details
        })),
        timestamp: new Date().toISOString()
    });
};
exports.errorHandler = errorHandler;
// Async error wrapper
var asyncHandler = function (fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Create custom error
var createError = function (message, statusCode, code) {
    if (statusCode === void 0) { statusCode = 500; }
    var error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};
exports.createError = createError;
