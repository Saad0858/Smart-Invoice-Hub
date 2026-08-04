import type { Response } from 'express';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import type { ApiResponse, ApiErrorResponse, ApiErrorDetail, PaginatedResponse } from '@/types/api';

export class ApiResponseBuilder {
  private success: boolean;
  private message: string;
  private data: unknown;
  private errors: ApiErrorDetail[] = [];
  private timestamp: string;
  private path: string;
  private requestId?: string;

  constructor() {
    this.success = true;
    this.message = MESSAGES.SUCCESS;
    this.data = {};
    this.errors = [];
    this.timestamp = new Date().toISOString();
    this.path = '';
  }

  setSuccess(success: boolean): this {
    this.success = success;
    return this;
  }

  setMessage(message: string): this {
    this.message = message;
    return this;
  }

  setData<T>(data: T): this {
    this.data = data;
    return this;
  }

  setErrors(errors: ApiErrorDetail[]): this {
    this.errors = errors;
    return this;
  }

  setTimestamp(timestamp: string): this {
    this.timestamp = timestamp;
    return this;
  }

  setPath(path: string): this {
    this.path = path;
    return this;
  }

  setRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }

  build(): ApiResponse | ApiErrorResponse {
    if (this.success) {
      return {
        success: true,
        message: this.message,
        data: this.data,
      };
    }

    return {
      success: false,
      message: this.message,
      errors: this.errors,
      timestamp: this.timestamp,
      path: this.path,
      requestId: this.requestId,
    };
  }

  send(res: Response, statusCode: number = HTTP_STATUS.OK): Response {
    const response = this.build();
    return res.status(statusCode).json(response);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = MESSAGES.SUCCESS,
  statusCode: number = HTTP_STATUS.OK,
  requestId?: string
): Response => {
  return new ApiResponseBuilder()
    .setMessage(message)
    .setData(data)
    .setPath(res.req.originalUrl || '')
    .setRequestId(requestId || res.req.requestId)
    .send(res, statusCode);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = MESSAGES.CREATED,
  requestId?: string
): Response => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED, requestId);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  message: string = MESSAGES.SUCCESS,
  requestId?: string
): Response => {
  return new ApiResponseBuilder()
    .setMessage(message)
    .setData({ data, pagination })
    .setPath(res.req.originalUrl || '')
    .setRequestId(requestId || res.req.requestId)
    .send(res, HTTP_STATUS.OK);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors: ApiErrorDetail[] = [],
  requestId?: string
): Response => {
  return new ApiResponseBuilder()
    .setSuccess(false)
    .setMessage(message)
    .setErrors(errors)
    .setPath(res.req.originalUrl || '')
    .setRequestId(requestId || res.req.requestId)
    .send(res, statusCode);
};

export const sendValidationError = (
  res: Response,
  errors: ApiErrorDetail[],
  requestId?: string
): Response => {
  return sendError(
    res,
    MESSAGES.VALIDATION_FAILED,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors,
    requestId
  );
};

export const sendNotFound = (
  res: Response,
  message: string = MESSAGES.NOT_FOUND,
  requestId?: string
): Response => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND, [], requestId);
};

export const sendUnauthorized = (
  res: Response,
  message: string = MESSAGES.UNAUTHORIZED,
  requestId?: string
): Response => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED, [], requestId);
};

export const sendForbidden = (
  res: Response,
  message: string = MESSAGES.FORBIDDEN,
  requestId?: string
): Response => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN, [], requestId);
};

export const sendConflict = (
  res: Response,
  message: string = MESSAGES.RESOURCE_EXISTS,
  requestId?: string
): Response => {
  return sendError(res, message, HTTP_STATUS.CONFLICT, [], requestId);
};
