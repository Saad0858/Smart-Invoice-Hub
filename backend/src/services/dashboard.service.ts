import { dashboardRepository } from '@repositories/dashboard.repository';
import { logger } from '@utils/logger';
import type {
  DashboardSummary,
  SalesOverviewData,
  SalesOverviewParams,
  RecentInvoiceData,
  TopProductData,
  LowStockProductData,
  CustomerOverviewData,
  RevenueTrendDataPoint,
  RevenueTrendParams,
} from '@repositories/dashboard.repository';

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
  getSalesOverview(params: SalesOverviewParams): Promise<SalesOverviewData>;
  getRecentInvoices(limit?: number): Promise<RecentInvoiceData[]>;
  getTopProducts(limit?: number, dateRange?: { startDate?: Date; endDate?: Date }): Promise<TopProductData[]>;
  getLowStockProducts(): Promise<LowStockProductData[]>;
  getCustomerOverview(): Promise<CustomerOverviewData>;
  getRevenueTrend(params: RevenueTrendParams): Promise<RevenueTrendDataPoint[]>;
}

export class DashboardServiceImpl implements DashboardService {
  /**
   * Get dashboard summary with key metrics
   */
  async getSummary(): Promise<DashboardSummary> {
    logger.info('Fetching dashboard summary');
    const summary = await dashboardRepository.getSummary();
    logger.info('Dashboard summary fetched successfully', {
      todaySales: summary.todaySales,
      monthlySales: summary.monthlySales,
    });
    return summary;
  }

  /**
   * Get sales overview for a specific period
   * Supports: today, week, month, year, custom date range
   */
  async getSalesOverview(params: SalesOverviewParams): Promise<SalesOverviewData> {
    logger.info('Fetching sales overview', { period: params.period, startDate: params.startDate, endDate: params.endDate });
    
    // Validate custom date range
    if (params.period === 'custom') {
      if (!params.startDate || !params.endDate) {
        throw new Error('Custom period requires startDate and endDate');
      }
      if (params.startDate > params.endDate) {
        throw new Error('startDate must be before endDate');
      }
    }

    const overview = await dashboardRepository.getSalesOverview(params);
    logger.info('Sales overview fetched successfully', { period: params.period, totalSales: overview.totalSales });
    return overview;
  }

  /**
   * Get recent invoices (latest only, no items)
   */
  async getRecentInvoices(limit: number = 10): Promise<RecentInvoiceData[]> {
    logger.info('Fetching recent invoices', { limit });
    
    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 50);
    
    const invoices = await dashboardRepository.getRecentInvoices(validLimit);
    logger.info('Recent invoices fetched successfully', { count: invoices.length });
    return invoices;
  }

  /**
   * Get top products by quantity sold
   */
  async getTopProducts(limit: number = 10, dateRange?: { startDate?: Date; endDate?: Date }): Promise<TopProductData[]> {
    logger.info('Fetching top products', { limit, dateRange });
    
    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 50);
    
    // Validate date range
    if (dateRange?.startDate && dateRange?.endDate && dateRange.startDate > dateRange.endDate) {
      throw new Error('startDate must be before endDate');
    }

    const products = await dashboardRepository.getTopProducts(validLimit, dateRange);
    logger.info('Top products fetched successfully', { count: products.length });
    return products;
  }

  /**
   * Get low stock products
   * Returns products where currentStock <= minimumStock
   */
  async getLowStockProducts(): Promise<LowStockProductData[]> {
    logger.info('Fetching low stock products');
    const products = await dashboardRepository.getLowStockProducts();
    logger.info('Low stock products fetched successfully', { count: products.length });
    return products;
  }

  /**
   * Get customer overview statistics
   */
  async getCustomerOverview(): Promise<CustomerOverviewData> {
    logger.info('Fetching customer overview');
    const overview = await dashboardRepository.getCustomerOverview();
    logger.info('Customer overview fetched successfully', { totalCustomers: overview.totalCustomers });
    return overview;
  }

  /**
   * Get revenue trend data for charts
   * Returns aggregated data grouped by interval (daily, weekly, monthly)
   */
  async getRevenueTrend(params: RevenueTrendParams): Promise<RevenueTrendDataPoint[]> {
    logger.info('Fetching revenue trend', { interval: params.interval, startDate: params.startDate, endDate: params.endDate });
    
    // Validate date range
    if (params.startDate && params.endDate && params.startDate > params.endDate) {
      throw new Error('startDate must be before endDate');
    }

    // Validate interval
    const validIntervals = ['daily', 'weekly', 'monthly'] as const;
    if (!validIntervals.includes(params.interval)) {
      throw new Error('Invalid interval. Must be daily, weekly, or monthly');
    }

    const trend = await dashboardRepository.getRevenueTrend(params);
    logger.info('Revenue trend fetched successfully', { dataPoints: trend.length });
    return trend;
  }
}

export const dashboardService = new DashboardServiceImpl();