/**
 * Production-safe error handling middleware
 * Prevents stack traces and sensitive data from leaking in production
 */

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants.js';

const isProduction = process.env.NODE_ENV === 'production';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

/**
 * Format error response safely for production
 */
function formatErrorResponse(error: ErrorWithStatus, req: Request) {
  const status = error.status || error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isClientError = status < HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // In production, hide internal errors
  if (isProduction && !isClientError) {
    return {
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      requestId: req.headers['x-request-id'] || 'unknown',
    };
  }

  // Development: full error details
  if (!isProduction) {
    return {
      error: error.name || 'Error',
      message: error.message || 'An error occurred',
      status,
      stack: error.stack,
      code: error.code,
    };
  }

  // Production: client errors (4xx) can show details
  return {
    error: error.name || 'Error',
    message: error.message || 'An error occurred',
    code: error.code,
  };
}

/**
 * Global error handler - must be registered last
 */
export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const status = error.status || error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log error details (always logged server-side)
  if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error('❌ Server error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id,
      tenantId: (req as any).tenant?.tenantId,
    });
  } else {
    console.warn('⚠️  Client error:', {
      error: error.message,
      url: req.url,
      method: req.method,
      status,
    });
  }

  // Send safe error response
  const errorResponse = formatErrorResponse(error, req);
  res.status(status).json(errorResponse);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    path: req.path,
  });
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
