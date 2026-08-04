import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import {
  sendError,
  sendValidationError,
  sendConflict,
  sendNotFound,
  sendUnauthorized,
} from './response';
import { logger } from './logger';
import type { ApiErrorDetail } from '@/types/api';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: unknown[] = [],
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message: string = MESSAGES.VALIDATION_FAILED,
    errors: unknown[] = []
  ): ApiError {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(message: string = MESSAGES.UNAUTHORIZED): ApiError {
    return new ApiError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message: string = MESSAGES.FORBIDDEN): ApiError {
    return new ApiError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message: string = MESSAGES.NOT_FOUND): ApiError {
    return new ApiError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message: string = MESSAGES.RESOURCE_EXISTS): ApiError {
    return new ApiError(message, HTTP_STATUS.CONFLICT);
  }

  static internal(message: string = MESSAGES.INTERNAL_ERROR): ApiError {
    return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, [], false);
  }

  static serviceUnavailable(message: string = MESSAGES.SERVICE_UNAVAILABLE): ApiError {
    return new ApiError(message, HTTP_STATUS.SERVICE_UNAVAILABLE, [], false);
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';

  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error(`${requestId} - Operational Error: ${err.message}`, {
        requestId,
        path: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode,
        errors: err.errors,
        stack: err.stack,
      });
    } else {
      logger.warn(`${requestId} - Client Error: ${err.message}`, {
        requestId,
        path: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode,
        errors: err.errors,
      });
    }

    sendError(res, err.message, err.statusCode, err.errors as ApiErrorDetail[], requestId);
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as unknown as {
      errors: Array<{ path: (string | number)[]; message: string; code: string }>;
    };
    const errors = zodError.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    logger.warn(`${requestId} - Validation Error`, {
      requestId,
      path: req.originalUrl,
      method: req.method,
      errors,
    });

    sendValidationError(res, errors, requestId);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: Record<string, unknown> };

    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target as string[] | undefined;
      logger.warn(`${requestId} - Duplicate Entry`, {
        requestId,
        path: req.originalUrl,
        method: req.method,
        field,
      });
      sendConflict(res, `Duplicate value for ${field?.join(', ') || 'field'}`);
      return;
    }

    if (prismaError.code === 'P2025') {
      logger.warn(`${requestId} - Record Not Found`, {
        requestId,
        path: req.originalUrl,
        method: req.method,
      });
      sendNotFound(res);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn(`${requestId} - Invalid Token`, {
      requestId,
      path: req.originalUrl,
      method: req.method,
    });
    sendUnauthorized(res, MESSAGES.TOKEN_INVALID, requestId);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn(`${requestId} - Token Expired`, {
      requestId,
      path: req.originalUrl,
      method: req.method,
    });
    sendUnauthorized(res, MESSAGES.TOKEN_EXPIRED, requestId);
    return;
  }

  // Unhandled errors
  logger.error(`${requestId} - Unhandled Error: ${err.message}`, {
    requestId,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  sendError(res, MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, [], requestId);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendNotFound(res, `Route ${req.method} ${req.originalUrl} not found`, req.requestId);
};
