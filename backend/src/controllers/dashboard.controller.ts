import type { Request, Response } from 'express';
import { dashboardService } from '@services/dashboard.service';
import { sendSuccess, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export class DashboardController {
  /**
   * GET /dashboard/summary
   * Returns key metrics for the executive dashboard
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await dashboardService.getSummary();
      sendSuccess(res, summary, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch dashboard summary', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch dashboard summary', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /dashboard/sales-overview
   * Returns sales overview for a specific period
   * Query params: period (today|week|month|year|custom), startDate, endDate
   */
  async getSalesOverview(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query as {
        period?: 'today' | 'week' | 'month' | 'year' | 'custom';
        startDate?: string;
        endDate?: string;
      };

      const params = {
        period: period || 'month',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      // Validate date formats
      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const overview = await dashboardService.getSalesOverview(params);
      sendSuccess(res, overview, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch sales overview', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else if (error instanceof Error) {
        sendError(res, error.message, HTTP_STATUS.BAD_REQUEST, [], req.requestId);
      } else {
        sendError(res, 'Failed to fetch sales overview', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /dashboard/recent-invoices
   * Returns latest invoices (without items)
   * Query param: limit (default 10, max 50)
   */
  async getRecentInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query as { limit?: string };
      const limitNum = limit ? parseInt(limit, 10) : 10;

      if (isNaN(limitNum) || limitNum < 1) {
        sendError(res, 'Invalid limit parameter', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const invoices = await dashboardService.getRecentInvoices(limitNum);
      sendSuccess(res, invoices, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch recent invoices', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch recent invoices', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /dashboard/top-products
   * Returns top products by quantity sold
   * Query params: limit (default 10, max 50), startDate, endDate
   */
  async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit, startDate, endDate } = req.query as {
        limit?: string;
        startDate?: string;
        endDate?: string;
      };

      const limitNum = limit ? parseInt(limit, 10) : 10;

      if (isNaN(limitNum) || limitNum < 1) {
        sendError(res, 'Invalid limit parameter', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const dateRange: { startDate?: Date; endDate?: Date } = {};
      if (startDate) {
        const parsed = new Date(startDate);
        if (isNaN(parsed.getTime())) {
          sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
          return;
        }
        dateRange.startDate = parsed;
      }
      if (endDate) {
        const parsed = new Date(endDate);
        if (isNaN(parsed.getTime())) {
          sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
          return;
        }
        dateRange.endDate = parsed;
      }

      const products = await dashboardService.getTopProducts(limitNum, dateRange);
      sendSuccess(res, products, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch top products', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else if (error instanceof Error) {
        sendError(res, error.message, HTTP_STATUS.BAD_REQUEST, [], req.requestId);
      } else {
        sendError(res, 'Failed to fetch top products', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /dashboard/low-stock
   * Returns products where currentStock <= minimumStock
   */
  async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      const products = await dashboardService.getLowStockProducts();
      sendSuccess(res, products, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch low stock products', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch low stock products', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /dashboard/customer-overview
   * Returns customer statistics
   */
  async getCustomerOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await dashboardService.getCustomerOverview();
      sendSuccess(res, overview, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch customer overview', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch customer overview', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /dashboard/revenue-trend
   * Returns chart-ready revenue trend data
   * Query params: interval (daily|weekly|monthly), startDate, endDate
   */
  async getRevenueTrend(req: Request, res: Response): Promise<void> {
    try {
      const { interval, startDate, endDate } = req.query as {
        interval?: 'daily' | 'weekly' | 'monthly';
        startDate?: string;
        endDate?: string;
      };

      const params = {
        interval: interval || 'monthly',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      // Validate date formats
      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      // Validate interval
      const validIntervals = ['daily', 'weekly', 'monthly'];
      if (!validIntervals.includes(params.interval)) {
        sendError(res, 'Invalid interval. Must be daily, weekly, or monthly', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const trend = await dashboardService.getRevenueTrend(params);
      sendSuccess(res, trend, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch revenue trend', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else if (error instanceof Error) {
        sendError(res, error.message, HTTP_STATUS.BAD_REQUEST, [], req.requestId);
      } else {
        sendError(res, 'Failed to fetch revenue trend', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const dashboardController = new DashboardController();