import { analyticsRepository } from '@repositories/analytics.repository';
import type {
  InvoiceHistoryFilters,
  ReportParams,
  InvoiceWithRelations,
  SalesReportData,
  ProductReportData,
  CustomerReportData,
  GSTReportData,
  TopCustomerData,
  TopProductData,
  RevenueTrendDataPoint,
  MonthlyComparisonData,
  SlowMovingProductData,
  LowStockData,
  SearchResults,
  // AR Analytics
  CollectionTrendDataPoint,
  MonthlyCollectionDataPoint,
  DailyCollectionDataPoint,
  TopPayingCustomerData,
  OutstandingAgingDataPoint,
  PaymentMethodAnalyticsData,
  CollectionForecastDataPoint,
} from '@repositories/analytics.repository';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export class AnalyticsService {
  /**
   * Invoice History - List with filters and pagination
   */
  async getInvoiceHistory(filters: InvoiceHistoryFilters): Promise<PaginatedResult<InvoiceWithRelations>> {
    const result = await analyticsRepository.findInvoicesHistory(filters);
    const totalPages = Math.ceil(result.total / filters.limit);

    return {
      data: result.data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    };
  }

  /**
   * Invoice History - Get single invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
    return analyticsRepository.findInvoiceById(id);
  }

  /**
   * Reports - Sales Report
   */
  async getSalesReport(params: ReportParams): Promise<SalesReportData> {
    return analyticsRepository.getSalesReport(params);
  }

  /**
   * Reports - Product Report
   */
  async getProductReport(params: ReportParams): Promise<ProductReportData[]> {
    return analyticsRepository.getProductReport(params);
  }

  /**
   * Reports - Customer Report
   */
  async getCustomerReport(params: ReportParams): Promise<CustomerReportData[]> {
    return analyticsRepository.getCustomerReport(params);
  }

  /**
   * Reports - GST Report
   */
  async getGSTReport(params: ReportParams): Promise<GSTReportData[]> {
    return analyticsRepository.getGSTReport(params);
  }

  /**
   * Business Analytics - Top Customers
   */
  async getTopCustomers(limit: number = 10, dateRange?: { startDate?: Date; endDate?: Date }): Promise<TopCustomerData[]> {
    return analyticsRepository.getTopCustomers(limit, dateRange);
  }

  /**
   * Business Analytics - Top Products
   */
  async getTopProducts(limit: number = 10, dateRange?: { startDate?: Date; endDate?: Date }): Promise<TopProductData[]> {
    return analyticsRepository.getTopProducts(limit, dateRange);
  }

  /**
   * Business Analytics - Revenue Trend
   */
  async getRevenueTrend(params: { interval: 'daily' | 'weekly' | 'monthly' } & { startDate?: Date; endDate?: Date }): Promise<RevenueTrendDataPoint[]> {
    return analyticsRepository.getRevenueTrend(params);
  }

  /**
   * Business Analytics - Low Stock Products
   */
  async getLowStockProducts(): Promise<LowStockData[]> {
    return analyticsRepository.getLowStockProducts();
  }

  /**
   * Business Analytics - Slow Moving Products
   */
  async getSlowMovingProducts(daysThreshold: number = 90, limit: number = 20): Promise<SlowMovingProductData[]> {
    return analyticsRepository.getSlowMovingProducts(daysThreshold, limit);
  }

  /**
   * Business Analytics - Monthly Comparison
   */
  async getMonthlyComparison(months: number = 12): Promise<MonthlyComparisonData[]> {
    return analyticsRepository.getMonthlyComparison(months);
  }

  /**
   * Global Search
   */
  async globalSearch(query: string, limit: number = 10): Promise<SearchResults> {
    return analyticsRepository.globalSearch(query, limit);
  }

  // ============================================
  // AR ANALYTICS
  // ============================================

  /**
   * Collection Trend - Collection amount over time
   */
  async getCollectionTrend(interval: 'daily' | 'weekly' | 'monthly', startDate?: Date, endDate?: Date): Promise<CollectionTrendDataPoint[]> {
    return analyticsRepository.getCollectionTrend(interval, startDate, endDate);
  }

  /**
   * Monthly Collection - Collection grouped by month
   */
  async getMonthlyCollection(startDate?: Date, endDate?: Date): Promise<MonthlyCollectionDataPoint[]> {
    return analyticsRepository.getMonthlyCollection(startDate, endDate);
  }

  /**
   * Daily Collection - Collection grouped by day
   */
  async getDailyCollection(startDate?: Date, endDate?: Date): Promise<DailyCollectionDataPoint[]> {
    return analyticsRepository.getDailyCollection(startDate, endDate);
  }

  /**
   * Top Paying Customers - Customers with highest payment amounts
   */
  async getTopPayingCustomers(limit: number = 10, startDate?: Date, endDate?: Date): Promise<TopPayingCustomerData[]> {
    return analyticsRepository.getTopPayingCustomers(limit, startDate, endDate);
  }

  /**
   * Outstanding Aging - Customer-wise aging report
   */
  async getOutstandingAging(startDate?: Date, endDate?: Date): Promise<OutstandingAgingDataPoint[]> {
    return analyticsRepository.getOutstandingAging(startDate, endDate);
  }

  /**
   * Payment Method Analytics - Distribution by payment method
   */
  async getPaymentMethodAnalytics(startDate?: Date, endDate?: Date): Promise<PaymentMethodAnalyticsData[]> {
    return analyticsRepository.getPaymentMethodAnalytics(startDate, endDate);
  }

  /**
   * Collection Forecast - Simple linear forecast based on historical data
   */
  async getCollectionForecast(months: number = 6): Promise<CollectionForecastDataPoint[]> {
    return analyticsRepository.getCollectionForecast(months);
  }
}

export const analyticsService = new AnalyticsService();