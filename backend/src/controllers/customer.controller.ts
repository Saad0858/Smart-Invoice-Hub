import type { Request, Response } from 'express';
import { customerService } from '@services/customer.service';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';

export class CustomerController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, customerType, state, isActive, sort, order } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        customerType?: string;
        state?: string;
        isActive?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const result = await customerService.getAll(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        search,
        customerType,
        state,
        isActive !== undefined ? isActive === 'true' : undefined,
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch customers', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const customer = await customerService.getById(id);

      if (!customer) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, customer, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch customer', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const customer = await customerService.create({
        ...req.body,
        createdBy: userId,
      });

      sendCreated(res, customer, MESSAGES.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to create customer', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const id = req.params.id as string;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const customer = await customerService.update(id, {
        ...req.body,
        updatedBy: userId,
      });

      sendSuccess(res, customer, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to update customer', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const id = req.params.id as string;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      await customerService.delete(id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to delete customer', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await customerService.getStatistics();

      sendSuccess(res, statistics, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch customer statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }
}

export const customerController = new CustomerController();