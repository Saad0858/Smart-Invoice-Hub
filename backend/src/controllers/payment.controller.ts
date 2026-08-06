import type { Request, Response } from 'express';
import { paymentService } from '@services/payment.service';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export class PaymentController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, invoiceId, customerId, paymentMethod, startDate, endDate, isCancelled, sort, order } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        invoiceId?: string;
        customerId?: string;
        paymentMethod?: string;
        startDate?: string;
        endDate?: string;
        isCancelled?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const result = await paymentService.getAll(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        search,
        invoiceId,
        customerId,
        paymentMethod,
        startDate,
        endDate,
        isCancelled === 'true',
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch payments', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch payments', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const payment = await paymentService.getById(id);

      if (!payment) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, payment, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch payment', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch payment', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      const input = {
        ...req.body,
        paymentDate: new Date(req.body.paymentDate),
        createdBy: userId,
      };

      const payment = await paymentService.recordPayment(input);

      sendCreated(res, payment, MESSAGES.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to record payment', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to record payment', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      const input = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
        updatedBy: userId,
      };

      const payment = await paymentService.updatePayment(id, input);

      sendSuccess(res, payment, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to update payment', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to update payment', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
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

      const input = {
        cancelledReason: req.body.cancelledReason,
        updatedBy: userId,
      };

      await paymentService.cancelPayment(id, input);

      sendSuccess(res, null, 'Payment cancelled successfully', HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to cancel payment', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to cancel payment', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getByInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.invoiceId as string;

      const payments = await paymentService.getByInvoiceId(invoiceId);

      sendSuccess(res, payments, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch invoice payments', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch invoice payments', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId as string;

      const payments = await paymentService.getByCustomerId(customerId);

      sendSuccess(res, payments, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch customer payments', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch customer payments', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await paymentService.getStatistics();

      sendSuccess(res, statistics, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch payment statistics', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch payment statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getPaymentMethodDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const distribution = await paymentService.getPaymentMethodDistribution(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      sendSuccess(res, distribution, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch payment method distribution', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch payment method distribution', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getCollectionTrend(req: Request, res: Response): Promise<void> {
    try {
      const { interval, startDate, endDate } = req.query as {
        interval: 'daily' | 'weekly' | 'monthly';
        startDate?: string;
        endDate?: string;
      };

      if (!interval || !['daily', 'weekly', 'monthly'].includes(interval)) {
        sendError(res, 'Invalid interval. Must be daily, weekly, or monthly', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const trend = await paymentService.getCollectionTrend(
        interval,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      sendSuccess(res, trend, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch collection trend', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch collection trend', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const paymentController = new PaymentController();