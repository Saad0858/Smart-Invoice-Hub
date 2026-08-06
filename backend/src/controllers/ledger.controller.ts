import type { Request, Response } from 'express';
import { ledgerService } from '@services/ledger.service';
import { sendSuccess, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export class LedgerController {
  async getCustomerLedger(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, startDate, endDate, includeOpeningBalance } = req.query as {
        customerId: string;
        startDate?: string;
        endDate?: string;
        includeOpeningBalance?: string;
      };

      if (!customerId) {
        sendError(res, 'Customer ID is required', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const ledger = await ledgerService.getCustomerLedger(
        customerId,
        startDate,
        endDate,
        includeOpeningBalance !== 'false'
      );

      sendSuccess(res, ledger, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch customer ledger', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch customer ledger', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getCustomerStatement(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, startDate, endDate } = req.query as {
        customerId: string;
        startDate?: string;
        endDate?: string;
      };

      if (!customerId) {
        sendError(res, 'Customer ID is required', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const statement = await ledgerService.getCustomerStatement(customerId, startDate, endDate);

      sendSuccess(res, statement, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to generate customer statement', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to generate customer statement', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getOutstandingAging(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.query as { customerId?: string };

      const aging = await ledgerService.getOutstandingAging(customerId);

      sendSuccess(res, aging, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        logger.error('Failed to fetch outstanding aging', { error: error instanceof Error ? error.message : 'Unknown error' });
        sendError(res, 'Failed to fetch outstanding aging', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const ledgerController = new LedgerController();