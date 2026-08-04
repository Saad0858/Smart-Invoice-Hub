import type { Request, Response } from 'express';
import { categoryService } from '@services/category.service';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';

export class CategoryController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, isActive, sort, order } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        isActive?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const result = await categoryService.getAll(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        search,
        isActive !== undefined ? isActive === 'true' : undefined,
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch categories', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const category = await categoryService.getById(id);

      if (!category) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, category, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch category', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const category = await categoryService.create({
        ...req.body,
        createdBy: userId,
      });

      sendCreated(res, category, MESSAGES.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to create category', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      const category = await categoryService.update(id, {
        ...req.body,
        updatedBy: userId,
      });

      sendSuccess(res, category, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to update category', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      await categoryService.delete(id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to delete category', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const categoryController = new CategoryController();