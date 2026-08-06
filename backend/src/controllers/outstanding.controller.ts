import type { Request, Response } from 'express';
import { outstandingService } from '@services/outstanding.service';
import { sendSuccess, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export class OutstandingController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, customerId, paymentStatus, startDate, endDate, dueDateStart, dueDateEnd, minAmount, maxAmount, onlyOverdue, sort, order } = req.query as {
        page?: string;
        limit?: string;
        customerId?: string;
        paymentStatus?: string;
        startDate?: string;
        endDate?: string;
        dueDateStart?: string;
        dueDateEnd?: string;
        minAmount?: string;
        maxAmount?: string;
        onlyOverdue?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const result = await outstandingService.getOutstandingInvoices(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
        customerId,
        paymentStatus,
        startDate,
        endDate,
        dueDateStart,
        dueDateEnd,
        minAmount ? parseFloat(minAmount) : undefined,
        maxAmount ? parseFloat(maxAmount) : undefined,
        onlyOverdue === 'true',
        sort,
        order
      );

      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch outstanding invoices', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch outstanding invoices', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId as string;

      const outstanding = await outstandingService.getOutstandingByCustomer(customerId);

      sendSuccess(res, outstanding, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch customer outstanding', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch customer outstanding', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await outstandingService.getSummary();

      sendSuccess(res, summary, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch outstanding summary', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch outstanding summary', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getAgingReport(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.query as { customerId?: string };

      const aging = await outstandingService.getAgingReport(customerId);

      sendSuccess(res, aging, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch aging report', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch aging report', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { daysOverdue } = req.query as { daysOverdue?: string };

      const overdue = await outstandingService.getOverdueInvoices(daysOverdue ? parseInt(daysOverdue, 10) : 0);

      sendSuccess(res, overdue, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch overdue invoices', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch overdue invoices', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getCollectionEfficiency(req: Request, res: Response): Promise<void> {
    try {
      const efficiency = await outstandingService.getCollectionEfficiency();

      sendSuccess(res, efficiency, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch collection efficiency', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch collection efficiency', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const outstandingController = new OutstandingController();