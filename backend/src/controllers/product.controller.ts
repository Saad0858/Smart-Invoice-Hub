import type { Request, Response } from 'express';
import { productService } from '@services/product.service';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';

export class ProductController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, categoryId, brandId, gstRate, isActive, lowStock, sort, order } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        categoryId?: string;
        brandId?: string;
        gstRate?: string;
        isActive?: string;
        lowStock?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const result = await productService.getAll(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        search,
        categoryId,
        brandId,
        gstRate,
        isActive !== undefined ? isActive === 'true' : undefined,
        lowStock !== undefined ? lowStock === 'true' : undefined,
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch products', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const product = await productService.getById(id);

      if (!product) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, product, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to fetch product', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const product = await productService.create({
        ...req.body,
        createdBy: userId,
      });

      sendCreated(res, product, MESSAGES.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to create product', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      const product = await productService.update(id, {
        ...req.body,
        updatedBy: userId,
      });

      sendSuccess(res, product, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to update product', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      await productService.delete(id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to delete product', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const productController = new ProductController();