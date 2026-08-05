import type { Request, Response } from 'express';
import { analyticsService } from '@services/analytics.service';
import { sendSuccess, sendPaginated, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export class AnalyticsController {
  // ============================================
  // INVOICE HISTORY
  // ============================================

  /**
   * GET /analytics/invoices/history
   * List invoices with comprehensive filtering and pagination
   */
  async getInvoiceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, customerId, status, paymentStatus, createdBy, startDate, endDate, sort, order } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        customerId?: string;
        status?: string;
        paymentStatus?: string;
        createdBy?: string;
        startDate?: string;
        endDate?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      };

      const filters = {
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
        search,
        customerId,
        status: status as any,
        paymentStatus: paymentStatus as any,
        createdBy,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sort: sort || 'invoiceDate',
        order: order || 'desc',
      };

      // Validate dates
      if (filters.startDate && isNaN(filters.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (filters.endDate && isNaN(filters.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const result = await analyticsService.getInvoiceHistory(filters);
      sendPaginated(res, result.data, result.pagination, MESSAGES.SUCCESS, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch invoice history', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch invoice history', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/invoices/history/:id
   * Get single invoice with full details
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const invoice = await analyticsService.getInvoiceById(id);

      if (!invoice) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, invoice, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch invoice', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch invoice', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/invoices/search
   * Quick search for invoices (used in global search)
   */
  async searchInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = req.query as { q?: string; limit?: string };

      if (!q || q.trim().length < 2) {
        sendError(res, 'Search query must be at least 2 characters', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const limitNum = limit ? parseInt(limit, 10) : 10;
      // We'll reuse the history search with a limit
      const result = await analyticsService.getInvoiceHistory({
        page: 1,
        limit: limitNum,
        search: q.trim(),
        sort: 'invoiceDate',
        order: 'desc',
      });

      sendSuccess(res, result.data, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to search invoices', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to search invoices', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/invoices/export
   * Export invoices to CSV (returns data for frontend to handle download)
   */
  async exportInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { search, customerId, status, paymentStatus, createdBy, startDate, endDate } = req.query as {
        search?: string;
        customerId?: string;
        status?: string;
        paymentStatus?: string;
        createdBy?: string;
        startDate?: string;
        endDate?: string;
      };

      // Export uses larger limit but still paginated for memory safety
      const result = await analyticsService.getInvoiceHistory({
        page: 1,
        limit: 5000,
        search,
        customerId,
        status: status as any,
        paymentStatus: paymentStatus as any,
        createdBy,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sort: 'invoiceDate',
        order: 'desc',
      });

      // Transform for CSV export
      const csvData = result.data.map(inv => ({
        'Invoice Number': inv.invoiceNumber,
        'Invoice Date': inv.invoiceDate.toISOString().split('T')[0],
        'Due Date': inv.dueDate?.toISOString().split('T')[0] ?? '',
        'Customer Code': inv.customer.customerCode,
        'Customer Name': inv.customer.companyName,
        'Customer GST': inv.customer.gstNumber ?? '',
        'Status': inv.status,
        'Payment Status': inv.paymentStatus,
        'Subtotal': inv.subtotal.toString(),
        'Discount': inv.discountAmount.toString(),
        'Transport Charges': inv.transportCharges.toString(),
        'Other Charges': inv.otherCharges.toString(),
        'CGST': inv.cgstAmount.toString(),
        'SGST': inv.sgstAmount.toString(),
        'IGST': inv.igstAmount.toString(),
        'Total GST': inv.totalGstAmount.toString(),
        'Round Off': inv.roundOff.toString(),
        'Grand Total': inv.grandTotal.toString(),
        'Notes': inv.notes ?? '',
        'Terms': inv.terms ?? '',
        'Created At': inv.createdAt.toISOString(),
      }));

      sendSuccess(res, csvData, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to export invoices', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to export invoices', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  // ============================================
  // REPORTS
  // ============================================

  /**
   * GET /analytics/reports/sales
   * Sales Report with period support
   */
  async getSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query as {
        period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
        startDate?: string;
        endDate?: string;
      };

      const params: { period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; startDate?: Date; endDate?: Date } = {
        period: period || 'monthly',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      // Validate dates
      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.period === 'custom' && (!params.startDate || !params.endDate)) {
        sendError(res, 'Custom period requires startDate and endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.startDate && params.endDate && params.startDate > params.endDate) {
        sendError(res, 'startDate must be before endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const report = await analyticsService.getSalesReport(params);
      sendSuccess(res, report, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch sales report', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch sales report', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/reports/products
   * Product Report with period support
   */
  async getProductReport(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query as {
        period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
        startDate?: string;
        endDate?: string;
      };

      const params = {
        period: period || 'monthly',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.period === 'custom' && (!params.startDate || !params.endDate)) {
        sendError(res, 'Custom period requires startDate and endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.startDate && params.endDate && params.startDate > params.endDate) {
        sendError(res, 'startDate must be before endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const report = await analyticsService.getProductReport(params);
      sendSuccess(res, report, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch product report', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch product report', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/reports/customers
   * Customer Report with period support
   */
  async getCustomerReport(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query as {
        period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
        startDate?: string;
        endDate?: string;
      };

      const params = {
        period: period || 'monthly',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.period === 'custom' && (!params.startDate || !params.endDate)) {
        sendError(res, 'Custom period requires startDate and endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.startDate && params.endDate && params.startDate > params.endDate) {
        sendError(res, 'startDate must be before endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const report = await analyticsService.getCustomerReport(params);
      sendSuccess(res, report, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch customer report', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch customer report', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/reports/gst
   * GST Report with period support
   */
  async getGSTReport(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query as {
        period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
        startDate?: string;
        endDate?: string;
      };

      const params = {
        period: period || 'monthly',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.period === 'custom' && (!params.startDate || !params.endDate)) {
        sendError(res, 'Custom period requires startDate and endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.startDate && params.endDate && params.startDate > params.endDate) {
        sendError(res, 'startDate must be before endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const report = await analyticsService.getGSTReport(params);
      sendSuccess(res, report, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch GST report', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch GST report', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  // ============================================
  // BUSINESS ANALYTICS
  // ============================================

  /**
   * GET /analytics/top-customers
   * Top customers by revenue
   */
  async getTopCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { limit, startDate, endDate } = req.query as {
        limit?: string;
        startDate?: string;
        endDate?: string;
      };

      const limitNum = limit ? parseInt(limit, 10) : 10;
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        sendError(res, 'Invalid limit. Must be between 1 and 100', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
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
      if (dateRange.startDate && dateRange.endDate && dateRange.startDate > dateRange.endDate) {
        sendError(res, 'startDate must be before endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const customers = await analyticsService.getTopCustomers(limitNum, dateRange);
      sendSuccess(res, customers, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch top customers', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch top customers', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/top-products
   * Top products by quantity sold
   */
  async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit, startDate, endDate } = req.query as {
        limit?: string;
        startDate?: string;
        endDate?: string;
      };

      const limitNum = limit ? parseInt(limit, 10) : 10;
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        sendError(res, 'Invalid limit. Must be between 1 and 100', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
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
      if (dateRange.startDate && dateRange.endDate && dateRange.startDate > dateRange.endDate) {
        sendError(res, 'startDate must be before endDate', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const products = await analyticsService.getTopProducts(limitNum, dateRange);
      sendSuccess(res, products, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch top products', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch top products', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/revenue-trend
   * Revenue trend for charts
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

      if (params.startDate && isNaN(params.startDate.getTime())) {
        sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (!['daily', 'weekly', 'monthly'].includes(params.interval)) {
        sendError(res, 'Invalid interval. Must be daily, weekly, or monthly', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const trend = await analyticsService.getRevenueTrend(params);
      sendSuccess(res, trend, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch revenue trend', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch revenue trend', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/low-stock
   * Low stock products
   */
  async getLowStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await analyticsService.getLowStockProducts();
      sendSuccess(res, products, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch low stock products', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch low stock products', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/slow-moving
   * Slow moving products
   */
  async getSlowMovingProducts(req: Request, res: Response): Promise<void> {
    try {
      const { daysThreshold, limit } = req.query as {
        daysThreshold?: string;
        limit?: string;
      };

      const daysThresholdNum = daysThreshold ? parseInt(daysThreshold, 10) : 90;
      const limitNum = limit ? parseInt(limit, 10) : 20;

      if (isNaN(daysThresholdNum) || daysThresholdNum < 1) {
        sendError(res, 'Invalid daysThreshold. Must be a positive number', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        sendError(res, 'Invalid limit. Must be between 1 and 100', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const products = await analyticsService.getSlowMovingProducts(daysThresholdNum, limitNum);
      sendSuccess(res, products, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch slow moving products', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch slow moving products', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * GET /analytics/monthly-comparison
   * Monthly comparison for year-over-year analysis
   */
  async getMonthlyComparison(req: Request, res: Response): Promise<void> {
    try {
      const { months } = req.query as { months?: string };

      const monthsNum = months ? parseInt(months, 10) : 12;
      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 60) {
        sendError(res, 'Invalid months. Must be between 1 and 60', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const comparison = await analyticsService.getMonthlyComparison(monthsNum);
      sendSuccess(res, comparison, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to fetch monthly comparison', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to fetch monthly comparison', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  // ============================================
  // GLOBAL SEARCH
  // ============================================

  /**
   * GET /analytics/search
   * Global search across products, customers, invoices, categories, brands
   */
  async globalSearch(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = req.query as { q?: string; limit?: string };

      if (!q || q.trim().length < 2) {
        sendError(res, 'Search query must be at least 2 characters', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const limitNum = limit ? parseInt(limit, 10) : 10;
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        sendError(res, 'Invalid limit. Must be between 1 and 50', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const results = await analyticsService.globalSearch(q.trim(), limitNum);
      sendSuccess(res, results, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      logger.error('Failed to perform global search', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to perform global search', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const analyticsController = new AnalyticsController();