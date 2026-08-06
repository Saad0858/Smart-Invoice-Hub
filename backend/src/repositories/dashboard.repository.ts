import { prisma } from '@config/database';
import type { Prisma, GSTRate, InvoiceStatus, PaymentMethod } from '@prisma/client';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface SalesOverviewParams extends DateRange {
  period: 'today' | 'week' | 'month' | 'year' | 'custom';
}

export interface RevenueTrendParams extends DateRange {
  interval: 'daily' | 'weekly' | 'monthly';
}

export interface DashboardSummary {
  todaySales: number;
  todayInvoices: number;
  monthlySales: number;
  monthlyInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  gstCollected: number;
  // AR Metrics
  todayCollection: number;
  outstandingAmount: number;
  overdueAmount: number;
  collectionThisMonth: number;
  collectionThisYear: number;
  paymentMethodDistribution: Record<PaymentMethod, { count: number; amount: number }>;
  averageCollectionTime: number;
}

export interface SalesOverviewData {
  period: string;
  totalSales: number;
  totalInvoices: number;
  totalGstAmount: number;
  averageOrderValue: number;
  invoiceStatusBreakdown: {
    draft: number;
    generated: number;
    cancelled: number;
  };
  paymentStatusBreakdown: {
    unpaid: number;
    partiallyPaid: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
}

export interface RecentInvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  grandTotal: number;
  status: InvoiceStatus;
  paymentStatus: string;
}

export interface TopProductData {
  productId: string;
  sku: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  gstRate: GSTRate;
}

export interface LowStockProductData {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  categoryName?: string;
  brandName?: string;
}

export interface CustomerOverviewData {
  totalCustomers: number;
  businessCustomers: number;
  individualCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  outstandingBalance: number;
}

export interface RevenueTrendDataPoint {
  period: string;
  revenue: number;
  invoiceCount: number;
  gstAmount: number;
}

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>;
  getSalesOverview(params: SalesOverviewParams): Promise<SalesOverviewData>;
  getRecentInvoices(limit: number): Promise<RecentInvoiceData[]>;
  getTopProducts(limit: number, dateRange?: DateRange): Promise<TopProductData[]>;
  getLowStockProducts(): Promise<LowStockProductData[]>;
  getCustomerOverview(): Promise<CustomerOverviewData>;
  getRevenueTrend(params: RevenueTrendParams): Promise<RevenueTrendDataPoint[]>;
}

export class DashboardRepositoryImpl implements DashboardRepository {
  /**
   * Get dashboard summary with key metrics
   * Uses parallel queries and aggregations for optimal performance
   */
  async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const [
      todayStats,
      monthlyStats,
      totalCustomers,
      totalProducts,
      lowStockCount,
      gstCollectedAgg,
      // AR Metrics
      todayCollectionAgg,
      outstandingAgg,
      overdueAgg,
      monthCollectionAgg,
      yearCollectionAgg,
      paymentMethodStats,
      avgCollectionDaysAgg,
    ] = await Promise.all([
      // Today's sales and invoices
      prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: startOfToday, lte: endOfToday },
          status: { not: 'CANCELLED' },
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      // Monthly sales and invoices
      prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: startOfMonth, lte: endOfMonth },
          status: { not: 'CANCELLED' },
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      // Total active customers
      prisma.customer.count({
        where: { deletedAt: null, isActive: true },
      }),
      // Total active products
      prisma.product.count({
        where: { deletedAt: null, isActive: true },
      }),
      // Low stock count
      prisma.product.count({
        where: {
          deletedAt: null,
          isActive: true,
          currentStock: { lte: prisma.product.fields.minStock },
        },
      }),
      // GST collected (sum of totalGstAmount for generated invoices)
      prisma.invoice.aggregate({
        where: {
          status: 'GENERATED',
        },
        _sum: { totalGstAmount: true },
      }),
      // Today's collection
      prisma.payment.aggregate({
        where: {
          isCancelled: false,
          paymentDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
      // Outstanding amount
      prisma.invoice.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
      }),
      // Overdue amount
      prisma.invoice.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
          dueDate: { lt: now },
        },
        _sum: { balanceAmount: true },
      }),
      // This month collection
      prisma.payment.aggregate({
        where: {
          isCancelled: false,
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // This year collection
      prisma.payment.aggregate({
        where: {
          isCancelled: false,
          paymentDate: { gte: startOfYear, lte: endOfYear },
        },
        _sum: { amount: true },
      }),
      // Payment method distribution
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { isCancelled: false },
        _sum: { amount: true },
        _count: true,
      }),
      // Average collection days
      prisma.$queryRawUnsafe<any[]>(`
        SELECT AVG(EXTRACT(DAY FROM (p."paymentDate" - i."invoiceDate"))) as avg_days
        FROM "invoices" i
        JOIN "payments" p ON p."invoiceId" = i.id
        WHERE i."status" != 'CANCELLED'
          AND i."paymentStatus" = 'PAID'
          AND p."isCancelled" = false
      `),
    ]);

    const paymentMethodDistribution: Record<PaymentMethod, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      BANK_TRANSFER: { count: 0, amount: 0 },
      CHEQUE: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      OTHER: { count: 0, amount: 0 },
    };

    for (const item of paymentMethodStats) {
      if (item.paymentMethod in paymentMethodDistribution) {
        paymentMethodDistribution[item.paymentMethod as PaymentMethod] = {
          count: item._count,
          amount: Number(item._sum.amount ?? 0),
        };
      }
    }

    return {
      todaySales: Number(todayStats._sum.grandTotal ?? 0),
      todayInvoices: todayStats._count,
      monthlySales: Number(monthlyStats._sum.grandTotal ?? 0),
      monthlyInvoices: monthlyStats._count,
      totalCustomers,
      totalProducts,
      lowStockCount,
      gstCollected: Number(gstCollectedAgg._sum.totalGstAmount ?? 0),
      // AR Metrics
      todayCollection: Number(todayCollectionAgg._sum.amount ?? 0),
      outstandingAmount: Number(outstandingAgg._sum.balanceAmount ?? 0),
      overdueAmount: Number(overdueAgg._sum.balanceAmount ?? 0),
      collectionThisMonth: Number(monthCollectionAgg._sum.amount ?? 0),
      collectionThisYear: Number(yearCollectionAgg._sum.amount ?? 0),
      paymentMethodDistribution,
      averageCollectionTime: avgCollectionDaysAgg[0]?.avg_days ? Number(avgCollectionDaysAgg[0].avg_days) : 0,
    };
  }

  /**
   * Get sales overview for a specific period
   * Supports: today, week, month, year, custom date range
   */
  async getSalesOverview(params: SalesOverviewParams): Promise<SalesOverviewData> {
    const { period, startDate, endDate } = params;
    const now = new Date();

    let dateFilter: Prisma.DateTimeFilter = {};

    switch (period) {
      case 'today': {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        dateFilter = { gte: startOfDay, lte: endOfDay };
        break;
      }
      case 'week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        dateFilter = { gte: startOfWeek, lte: endOfWeek };
        break;
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        dateFilter = { gte: startOfMonth, lte: endOfMonth };
        break;
      }
      case 'year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        dateFilter = { gte: startOfYear, lte: endOfYear };
        break;
      }
      case 'custom': {
        if (startDate && endDate) {
          dateFilter = { gte: startDate, lte: endDate };
        } else {
          // Default to current month if no custom dates provided
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          dateFilter = { gte: startOfMonth, lte: endOfMonth };
        }
        break;
      }
    }

    const where: Prisma.InvoiceWhereInput = {
      invoiceDate: dateFilter,
    };

    const [
      salesAgg,
      invoiceStatusCounts,
      paymentStatusCounts,
    ] = await Promise.all([
      // Total sales, GST, and invoice count
      prisma.invoice.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { grandTotal: true, totalGstAmount: true },
        _count: true,
      }),
      // Invoice status breakdown
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      // Payment status breakdown
      prisma.invoice.groupBy({
        by: ['paymentStatus'],
        where: { ...where, status: { not: 'CANCELLED' } },
        _count: true,
      }),
    ]);

    const totalSales = Number(salesAgg._sum.grandTotal ?? 0);
    const totalInvoices = salesAgg._count;
    const totalGstAmount = Number(salesAgg._sum.totalGstAmount ?? 0);
    const averageOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

    // Build invoice status breakdown
    const invoiceStatusBreakdown = {
      draft: 0,
      generated: 0,
      cancelled: 0,
    };
    for (const item of invoiceStatusCounts) {
      if (item.status === 'DRAFT') invoiceStatusBreakdown.draft = item._count;
      else if (item.status === 'GENERATED') invoiceStatusBreakdown.generated = item._count;
      else if (item.status === 'CANCELLED') invoiceStatusBreakdown.cancelled = item._count;
    }

    // Build payment status breakdown
    const paymentStatusBreakdown = {
      unpaid: 0,
      partiallyPaid: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };
    for (const item of paymentStatusCounts) {
      if (item.paymentStatus === 'UNPAID') paymentStatusBreakdown.unpaid = item._count;
      else if (item.paymentStatus === 'PARTIALLY_PAID') paymentStatusBreakdown.partiallyPaid = item._count;
      else if (item.paymentStatus === 'PAID') paymentStatusBreakdown.paid = item._count;
      else if (item.paymentStatus === 'OVERDUE') paymentStatusBreakdown.overdue = item._count;
      else if (item.paymentStatus === 'CANCELLED') paymentStatusBreakdown.cancelled = item._count;
    }

    return {
      period,
      totalSales,
      totalInvoices,
      totalGstAmount,
      averageOrderValue,
      invoiceStatusBreakdown,
      paymentStatusBreakdown,
    };
  }

  /**
   * Get recent invoices (latest only, no items)
   */
  async getRecentInvoices(limit: number = 10): Promise<RecentInvoiceData[]> {
    const invoices = await prisma.invoice.findMany({
      take: limit,
      orderBy: { invoiceDate: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        grandTotal: true,
        status: true,
        paymentStatus: true,
        customer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      customerName: inv.customer.companyName,
      grandTotal: Number(inv.grandTotal),
      status: inv.status,
      paymentStatus: inv.paymentStatus,
    }));
  }

  /**
   * Get top products by quantity sold
   * Uses invoice items aggregation for optimal performance
   */
  async getTopProducts(limit: number = 10, dateRange?: DateRange): Promise<TopProductData[]> {
    const where: Prisma.InvoiceItemWhereInput = {};

    if (dateRange?.startDate || dateRange?.endDate) {
      where.invoice = {
        invoiceDate: {} as Prisma.DateTimeFilter,
      };
      if (dateRange.startDate) {
        (where.invoice.invoiceDate as Prisma.DateTimeFilter).gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        (where.invoice.invoiceDate as Prisma.DateTimeFilter).lte = dateRange.endDate;
      }
      // Only include non-cancelled invoices
      where.invoice.status = { not: 'CANCELLED' };
    } else {
      where.invoice = {
        status: { not: 'CANCELLED' },
      };
    }

    const topProducts = await prisma.invoiceItem.groupBy({
      by: ['productId', 'sku', 'productName', 'gstRate'],
      where,
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    return topProducts.map((item) => ({
      productId: item.productId ?? '',
      sku: item.sku,
      productName: item.productName,
      totalQuantitySold: Number(item._sum.quantity ?? 0),
      totalRevenue: Number(item._sum.lineTotal ?? 0),
      gstRate: item.gstRate,
    }));
  }

  /**
   * Get low stock products
   * Returns products where currentStock <= minimumStock
   */
  async getLowStockProducts(): Promise<LowStockProductData[]> {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        currentStock: { lte: prisma.product.fields.minStock },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minStock: true,
        unit: true,
        category: {
          select: { name: true },
        },
        brand: {
          select: { name: true },
        },
      },
      orderBy: {
        currentStock: 'asc',
      },
    });

    return products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      currentStock: Number(p.currentStock),
      minStock: Number(p.minStock),
      unit: p.unit,
      categoryName: p.category?.name,
      brandName: p.brand?.name,
    }));
  }

  /**
   * Get customer overview statistics
   * Uses aggregations for optimal performance
   */
  async getCustomerOverview(): Promise<CustomerOverviewData> {
    const [
      totalCustomers,
      businessCustomers,
      individualCustomers,
      activeCustomers,
      inactiveCustomers,
      outstandingBalanceAgg,
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null, customerType: 'BUSINESS' } }),
      prisma.customer.count({ where: { deletedAt: null, customerType: 'INDIVIDUAL' } }),
      prisma.customer.count({ where: { deletedAt: null, isActive: true } }),
      prisma.customer.count({ where: { deletedAt: null, isActive: false } }),
      prisma.customer.aggregate({
        where: { deletedAt: null },
        _sum: { currentBalance: true },
      }),
    ]);

    return {
      totalCustomers,
      businessCustomers,
      individualCustomers,
      activeCustomers,
      inactiveCustomers,
      outstandingBalance: Number(outstandingBalanceAgg._sum.currentBalance ?? 0),
    };
  }

  /**
   * Get revenue trend data for charts
   * Returns aggregated data grouped by interval (daily, weekly, monthly)
   */
  async getRevenueTrend(params: RevenueTrendParams): Promise<RevenueTrendDataPoint[]> {
    const { interval, startDate, endDate } = params;
    const now = new Date();

    // Default date range: last 12 months if not specified
    const defaultEndDate = endDate ?? now;
    const defaultStartDate = startDate ?? new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // For PostgreSQL, we use raw query with date_trunc for efficient grouping
    const intervalFormat = interval === 'daily' ? 'day' : interval === 'weekly' ? 'week' : 'month';

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        date_trunc($1, "invoiceDate") as period,
        COALESCE(SUM("grandTotal"), 0) as revenue,
        COUNT(*) as invoice_count,
        COALESCE(SUM("totalGstAmount"), 0) as gst_amount
      FROM "invoices"
      WHERE "invoiceDate" >= $2
        AND "invoiceDate" <= $3
        AND "status" != 'CANCELLED'
      GROUP BY date_trunc($1, "invoiceDate")
      ORDER BY period ASC
    `, intervalFormat, defaultStartDate, defaultEndDate);

    const trendData: RevenueTrendDataPoint[] = [];
    for (const row of results) {
      const periodDate = new Date(row.period);
      const periodStr = periodDate.toISOString().split('T')[0] as string;
      trendData.push({
        period: periodStr,
        revenue: Number(row.revenue),
        invoiceCount: Number(row.invoice_count),
        gstAmount: Number(row.gst_amount),
      });
    }
    return trendData;
  }
}

export const dashboardRepository = new DashboardRepositoryImpl();