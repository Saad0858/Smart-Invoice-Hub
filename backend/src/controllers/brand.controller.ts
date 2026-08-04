import type { Request, Response } from 'express';
import { brandService } from '@services/brand.service';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';

export class BrandController {
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

      const result = await brandService.getAll(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        search,
        isActive !== undefined ? isActive === 'true' : undefined,
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch brands', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const brand = await brandService.getById(id);

      if (!brand) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, brand, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch brand', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const brand = await brandService.create({
        ...req.body,
        createdBy: userId,
      });

      sendCreated(res, brand, MESSAGES.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to create brand', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      const brand = await brandService.update(id, {
        ...req.body,
        updatedBy: userId,
      });

      sendSuccess(res, brand, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to update brand', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      await brandService.delete(id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to delete brand', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const brandController = new BrandController();