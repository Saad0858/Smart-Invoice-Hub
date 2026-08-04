import type { Request, Response } from 'express';
import { invoiceService } from '@services/invoice.service';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export class InvoiceController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, customerId, status, startDate, endDate, sort, order } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        customerId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const result = await invoiceService.getAll(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        search,
        customerId,
        status,
        startDate,
        endDate,
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch invoices', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch invoices', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const invoice = await invoiceService.getById(id);

      if (!invoice) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, invoice, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch invoice', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch invoice', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      // Convert string dates to Date objects
      const input = {
        ...req.body,
        invoiceDate: new Date(req.body.invoiceDate),
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        createdBy: userId,
      };

      const invoice = await invoiceService.create(input);

      sendCreated(res, invoice, MESSAGES.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to create invoice', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to create invoice', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      // Convert string dates to Date objects if present
      const input = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : (req.body.dueDate === null ? null : undefined),
        updatedBy: userId,
      };

      const invoice = await invoiceService.update(id, input);

      sendSuccess(res, invoice, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to update invoice', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to update invoice', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const id = req.params.id as string;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      await invoiceService.cancel(id, userId);

      sendSuccess(res, null, 'Invoice cancelled successfully', HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to cancel invoice', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to cancel invoice', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const id = req.params.id as string;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const invoice = await invoiceService.duplicate(id, userId);

      sendCreated(res, invoice, 'Invoice duplicated successfully', req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to duplicate invoice', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to duplicate invoice', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getNextNumber(req: Request, res: Response): Promise<void> {
    try {
      const nextNumber = await invoiceService.getNextInvoiceNumber();

      sendSuccess(res, { nextInvoiceNumber: nextNumber }, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to get next invoice number', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to get next invoice number', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await invoiceService.getStatistics();

      sendSuccess(res, statistics, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch invoice statistics', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch invoice statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const invoiceController = new InvoiceController();