import { prisma } from '@config/database';
import type { Prisma, GSTRate, InvoiceStatus, PaymentStatus, ProductUnit } from '@prisma/client';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface InvoiceHistoryFilters extends DateRange {
  search?: string;
  customerId?: string;
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  createdBy?: string;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface ReportParams extends DateRange {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
}

export interface InvoiceWithRelations {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  customerId: string;
  subtotal: Prisma.Decimal;
  taxableAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  transportCharges: Prisma.Decimal;
  otherCharges: Prisma.Decimal;
  cgstAmount: Prisma.Decimal;
  sgstAmount: Prisma.Decimal;
  igstAmount: Prisma.Decimal;
  totalGstAmount: Prisma.Decimal;
  roundOff: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  terms: string | null;
  pdfUrl: string | null;
  pdfGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  customer: {
    id: string;
    customerCode: string;
    companyName: string;
    contactPerson: string | null;
    gstNumber: string | null;
    phone: string | null;
    email: string | null;
  };
  items: Array<{
    id: string;
    productId: string | null;
    sku: string;
    productName: string;
    hsnCode: string;
    unit: ProductUnit;
    gstRate: GSTRate;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    discount: Prisma.Decimal;
    taxableAmount: Prisma.Decimal;
    cgstAmount: Prisma.Decimal;
    sgstAmount: Prisma.Decimal;
    igstAmount: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }>;
}

export interface SalesReportData {
  period: string;
  totalSales: number;
  totalInvoices: number;
  totalGstAmount: number;
  averageOrderValue: number;
  invoiceStatusBreakdown: Record<InvoiceStatus, number>;
  paymentStatusBreakdown: Record<PaymentStatus, number>;
}

export interface ProductReportData {
  productId: string;
  sku: string;
  productName: string;
  categoryName: string | null;
  brandName: string | null;
  hsnCode: string;
  gstRate: GSTRate;
  unit: ProductUnit;
  totalQuantitySold: number;
  totalRevenue: number;
  totalGstAmount: number;
  averageSellingPrice: number;
  invoiceCount: number;
}

export interface CustomerReportData {
  customerId: string;
  customerCode: string;
  companyName: string;
  contactPerson: string | null;
  gstNumber: string | null;
  state: string | null;
  customerType: string;
  totalInvoices: number;
  totalPurchases: number;
  totalGstPaid: number;
  averageOrderValue: number;
  outstandingBalance: number;
  lastInvoiceDate: Date | null;
}

export interface GSTReportData {
  gstRate: GSTRate;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  invoiceCount: number;
}

export interface TopCustomerData {
  customerId: string;
  customerCode: string;
  companyName: string;
  totalPurchases: number;
  totalInvoices: number;
  averageOrderValue: number;
  outstandingBalance: number;
}

export interface TopProductData {
  productId: string;
  sku: string;
  productName: string;
  categoryName: string | null;
  brandName: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  invoiceCount: number;
}

export interface RevenueTrendDataPoint {
  period: string;
  revenue: number;
  invoiceCount: number;
  gstAmount: number;
}

export interface MonthlyComparisonData {
  month: string;
  year: number;
  revenue: number;
  invoiceCount: number;
  gstAmount: number;
  growthRate: number;
}

export interface SlowMovingProductData {
  productId: string;
  sku: string;
  productName: string;
  categoryName: string | null;
  brandName: string | null;
  currentStock: number;
  minStock: number;
  lastSaleDate: Date | null;
  daysSinceLastSale: number | null;
  totalQuantitySold: number;
}

export interface LowStockData {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: ProductUnit;
  categoryName: string | null;
  brandName: string | null;
}

export interface SearchResultItem {
  id: string;
  type: 'product' | 'customer' | 'invoice' | 'category' | 'brand';
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface SearchResults {
  products: SearchResultItem[];
  customers: SearchResultItem[];
  invoices: SearchResultItem[];
  categories: SearchResultItem[];
  brands: SearchResultItem[];
}

export interface AnalyticsRepository {
  // Invoice History
  findInvoicesHistory(filters: InvoiceHistoryFilters): Promise<{ data: InvoiceWithRelations[]; total: number }>;
  findInvoiceById(id: string): Promise<InvoiceWithRelations | null>;
  searchInvoices(search: string, limit?: number): Promise<InvoiceWithRelations[]>;

  // Reports
  getSalesReport(params: ReportParams): Promise<SalesReportData>;
  getProductReport(params: ReportParams): Promise<ProductReportData[]>;
  getCustomerReport(params: ReportParams): Promise<CustomerReportData[]>;
  getGSTReport(params: ReportParams): Promise<GSTReportData[]>;

  // Business Analytics
  getTopCustomers(limit: number, dateRange?: DateRange): Promise<TopCustomerData[]>;
  getTopProducts(limit: number, dateRange?: DateRange): Promise<TopProductData[]>;
  getRevenueTrend(params: { interval: 'daily' | 'weekly' | 'monthly' } & DateRange): Promise<RevenueTrendDataPoint[]>;
  getLowStockProducts(): Promise<LowStockData[]>;
  getSlowMovingProducts(daysThreshold: number, limit?: number): Promise<SlowMovingProductData[]>;
  getMonthlyComparison(months: number): Promise<MonthlyComparisonData[]>;

  // Global Search
  globalSearch(query: string, limit?: number): Promise<SearchResults>;
}

export class AnalyticsRepositoryImpl implements AnalyticsRepository {
  /**
   * Find invoices with comprehensive filtering for history view
   */
  async findInvoicesHistory(filters: InvoiceHistoryFilters): Promise<{ data: InvoiceWithRelations[]; total: number }> {
    const { search, customerId, status, paymentStatus, createdBy, startDate, endDate, page, limit, sort = 'invoiceDate', order = 'desc' } = filters;

    const where: Prisma.InvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
        { customer: { gstNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = startDate;
      }
      if (endDate) {
        where.invoiceDate.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              companyName: true,
              contactPerson: true,
              gstNumber: true,
              phone: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find single invoice by ID with full relations
   */
  async findInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
    return prisma.invoice.findFirst({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
            contactPerson: true,
            gstNumber: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Search invoices for quick lookup (used in global search)
   */
  async searchInvoices(search: string, limit = 10): Promise<InvoiceWithRelations[]> {
    return prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { customer: { companyName: { contains: search, mode: 'insensitive' } } },
          { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { invoiceDate: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
            contactPerson: true,
            gstNumber: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Build date filter for reports
   */
  private buildDateFilter(params: ReportParams): Prisma.DateTimeFilter {
    const { period, startDate, endDate } = params;
    const now = new Date();

    switch (period) {
      case 'daily': {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return { gte: startOfDay, lte: endOfDay };
      }
      case 'weekly': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { gte: startOfWeek, lte: endOfWeek };
      }
      case 'monthly': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { gte: startOfMonth, lte: endOfMonth };
      }
      case 'yearly': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return { gte: startOfYear, lte: endOfYear };
      }
      case 'custom': {
        if (startDate && endDate) {
          return { gte: startDate, lte: endDate };
        }
        // Default to current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { gte: startOfMonth, lte: endOfMonth };
      }
      default: {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { gte: startOfMonth, lte: endOfMonth };
      }
    }
  }

  /**
   * Sales Report - Comprehensive sales overview
   */
  async getSalesReport(params: ReportParams): Promise<SalesReportData> {
    const dateFilter = this.buildDateFilter(params);

    const where: Prisma.InvoiceWhereInput = {
      invoiceDate: dateFilter,
    };

    const [
      salesAgg,
      invoiceStatusCounts,
      paymentStatusCounts,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { grandTotal: true, totalGstAmount: true },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
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

    const invoiceStatusBreakdown: Record<InvoiceStatus, number> = {
      DRAFT: 0,
      GENERATED: 0,
      CANCELLED: 0,
    };
    for (const item of invoiceStatusCounts) {
      if (item.status in invoiceStatusBreakdown) {
        invoiceStatusBreakdown[item.status as InvoiceStatus] = item._count;
      }
    }

    const paymentStatusBreakdown: Record<PaymentStatus, number> = {
      PENDING: 0,
      PARTIAL: 0,
      PAID: 0,
    };
    for (const item of paymentStatusCounts) {
      if (item.paymentStatus in paymentStatusBreakdown) {
        paymentStatusBreakdown[item.paymentStatus as PaymentStatus] = item._count;
      }
    }

    return {
      period: params.period,
      totalSales,
      totalInvoices,
      totalGstAmount,
      averageOrderValue,
      invoiceStatusBreakdown,
      paymentStatusBreakdown,
    };
  }

  /**
   * Product Report - Product-wise sales performance
   */
  async getProductReport(params: ReportParams): Promise<ProductReportData[]> {
    const dateFilter = this.buildDateFilter(params);

    const where: Prisma.InvoiceItemWhereInput = {
      invoice: {
        invoiceDate: dateFilter,
        status: { not: 'CANCELLED' },
      },
    };

    const productSales = await prisma.invoiceItem.groupBy({
      by: ['productId', 'sku', 'productName', 'hsnCode', 'gstRate', 'unit'],
      where,
      _sum: {
        quantity: true,
        lineTotal: true,
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
      },
      _count: {
        invoiceId: true,
      },
      orderBy: {
        _sum: {
          lineTotal: 'desc',
        },
      },
    });

    // Get category and brand names for products
    const productIds = productSales.map(p => p.productId).filter(Boolean) as string[];
    const productsInfo = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    const productInfoMap = new Map(productsInfo.map(p => [p.id, p]));

    return productSales.map(item => {
      const info = productInfoMap.get(item.productId ?? '');
      const totalQuantity = Number(item._sum.quantity ?? 0);
      const totalRevenue = Number(item._sum.lineTotal ?? 0);
      const totalCgst = Number(item._sum.cgstAmount ?? 0);
      const totalSgst = Number(item._sum.sgstAmount ?? 0);
      const totalIgst = Number(item._sum.igstAmount ?? 0);
      const invoiceCount = item._count.invoiceId;

      return {
        productId: item.productId ?? '',
        sku: item.sku,
        productName: item.productName,
        categoryName: info?.category?.name ?? null,
        brandName: info?.brand?.name ?? null,
        hsnCode: item.hsnCode,
        gstRate: item.gstRate,
        unit: item.unit,
        totalQuantitySold: totalQuantity,
        totalRevenue,
        totalGstAmount: totalCgst + totalSgst + totalIgst,
        averageSellingPrice: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
        invoiceCount,
      };
    });
  }

  /**
   * Customer Report - Customer-wise purchase analysis
   */
  async getCustomerReport(params: ReportParams): Promise<CustomerReportData[]> {
    const dateFilter = this.buildDateFilter(params);

    const where: Prisma.InvoiceWhereInput = {
      invoiceDate: dateFilter,
      status: { not: 'CANCELLED' },
    };

    const customerSales = await prisma.invoice.groupBy({
      by: ['customerId'],
      where,
      _sum: {
        grandTotal: true,
        totalGstAmount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          grandTotal: 'desc',
        },
      },
    });

    const customerIds = customerSales.map(c => c.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        customerCode: true,
        companyName: true,
        contactPerson: true,
        gstNumber: true,
        state: true,
        customerType: true,
        currentBalance: true,
      },
    });

    const customerMap = new Map(customers.map(c => [c.id, c]));

    // Get last invoice date for each customer
    const lastInvoices = await prisma.invoice.findMany({
      where: {
        customerId: { in: customerIds },
        status: { not: 'CANCELLED' },
      },
      select: {
        customerId: true,
        invoiceDate: true,
      },
      orderBy: { invoiceDate: 'desc' },
      distinct: ['customerId'],
    });

    const lastInvoiceMap = new Map(lastInvoices.map(i => [i.customerId, i.invoiceDate]));

    return customerSales.map(item => {
      const customer = customerMap.get(item.customerId);
      return {
        customerId: item.customerId,
        customerCode: customer?.customerCode ?? '',
        companyName: customer?.companyName ?? '',
        contactPerson: customer?.contactPerson ?? null,
        gstNumber: customer?.gstNumber ?? null,
        state: customer?.state ?? null,
        customerType: customer?.customerType ?? 'BUSINESS',
        totalInvoices: item._count,
        totalPurchases: Number(item._sum.grandTotal ?? 0),
        totalGstPaid: Number(item._sum.totalGstAmount ?? 0),
        averageOrderValue: item._count > 0 ? Number(item._sum.grandTotal ?? 0) / item._count : 0,
        outstandingBalance: Number(customer?.currentBalance ?? 0),
        lastInvoiceDate: lastInvoiceMap.get(item.customerId) ?? null,
      };
    });
  }

  /**
   * GST Report - Tax breakdown by GST rate
   */
  async getGSTReport(params: ReportParams): Promise<GSTReportData[]> {
    const dateFilter = this.buildDateFilter(params);

    const where: Prisma.InvoiceItemWhereInput = {
      invoice: {
        invoiceDate: dateFilter,
        status: { not: 'CANCELLED' },
      },
    };

    const gstData = await prisma.invoiceItem.groupBy({
      by: ['gstRate'],
      where,
      _sum: {
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
      },
      _count: true,
    });

    return gstData.map(item => ({
      gstRate: item.gstRate,
      taxableAmount: Number(item._sum.taxableAmount ?? 0),
      cgstAmount: Number(item._sum.cgstAmount ?? 0),
      sgstAmount: Number(item._sum.sgstAmount ?? 0),
      igstAmount: Number(item._sum.igstAmount ?? 0),
      totalGstAmount: Number(item._sum.cgstAmount ?? 0) + Number(item._sum.sgstAmount ?? 0) + Number(item._sum.igstAmount ?? 0),
      invoiceCount: item._count,
    }));
  }

  /**
   * Top Customers by revenue
   */
  async getTopCustomers(limit: number = 10, dateRange?: DateRange): Promise<TopCustomerData[]> {
    const where: Prisma.InvoiceWhereInput = {
      status: { not: 'CANCELLED' },
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      where.invoiceDate = {};
      if (dateRange.startDate) where.invoiceDate.gte = dateRange.startDate;
      if (dateRange.endDate) where.invoiceDate.lte = dateRange.endDate;
    }

    const topCustomers = await prisma.invoice.groupBy({
      by: ['customerId'],
      where,
      _sum: { grandTotal: true },
      _count: true,
      orderBy: { _sum: { grandTotal: 'desc' } },
      take: limit,
    });

    const customerIds = topCustomers.map(c => c.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        customerCode: true,
        companyName: true,
        currentBalance: true,
      },
    });

    const customerMap = new Map(customers.map(c => [c.id, c]));

    return topCustomers.map(item => {
      const customer = customerMap.get(item.customerId);
      return {
        customerId: item.customerId,
        customerCode: customer?.customerCode ?? '',
        companyName: customer?.companyName ?? '',
        totalPurchases: Number(item._sum.grandTotal ?? 0),
        totalInvoices: item._count,
        averageOrderValue: item._count > 0 ? Number(item._sum.grandTotal ?? 0) / item._count : 0,
        outstandingBalance: Number(customer?.currentBalance ?? 0),
      };
    });
  }

  /**
   * Top Products by quantity sold
   */
  async getTopProducts(limit: number = 10, dateRange?: DateRange): Promise<TopProductData[]> {
    const where: Prisma.InvoiceItemWhereInput = {};

    if (dateRange?.startDate || dateRange?.endDate) {
      where.invoice = {
        invoiceDate: {} as Prisma.DateTimeFilter,
        status: { not: 'CANCELLED' },
      };
      if (dateRange.startDate) (where.invoice.invoiceDate as Prisma.DateTimeFilter).gte = dateRange.startDate;
      if (dateRange.endDate) (where.invoice.invoiceDate as Prisma.DateTimeFilter).lte = dateRange.endDate;
    } else {
      where.invoice = { status: { not: 'CANCELLED' } };
    }

    const topProducts = await prisma.invoiceItem.groupBy({
      by: ['productId', 'sku', 'productName'],
      where,
      _sum: { quantity: true, lineTotal: true },
      _count: { invoiceId: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = topProducts.map(p => p.productId).filter(Boolean) as string[];
    const productsInfo = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { name: true } }, brand: { select: { name: true } } },
    });

    const productInfoMap = new Map(productsInfo.map(p => [p.id, p]));

    return topProducts.map(item => {
      const info = productInfoMap.get(item.productId ?? '');
      return {
        productId: item.productId ?? '',
        sku: item.sku,
        productName: item.productName,
        categoryName: info?.category?.name ?? null,
        brandName: info?.brand?.name ?? null,
        totalQuantitySold: Number(item._sum.quantity ?? 0),
        totalRevenue: Number(item._sum.lineTotal ?? 0),
        invoiceCount: item._count.invoiceId,
      };
    });
  }

  /**
   * Revenue Trend for charts
   */
  async getRevenueTrend(params: { interval: 'daily' | 'weekly' | 'monthly' } & DateRange): Promise<RevenueTrendDataPoint[]> {
    const { interval, startDate, endDate } = params;
    const now = new Date();

    const defaultEndDate = endDate ?? now;
    const defaultStartDate = startDate ?? new Date(now.getFullYear(), now.getMonth() - 11, 1);

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

    return results.map(row => {
      const periodDate = new Date(row.period);
      return {
        period: periodDate.toISOString().split('T')[0] as string,
        revenue: Number(row.revenue),
        invoiceCount: Number(row.invoice_count),
        gstAmount: Number(row.gst_amount),
      };
    });
  }

  /**
   * Low Stock Products
   */
  async getLowStockProducts(): Promise<LowStockData[]> {
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
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
      orderBy: { currentStock: 'asc' },
    });

    return products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      currentStock: Number(p.currentStock),
      minStock: Number(p.minStock),
      unit: p.unit,
      categoryName: p.category?.name ?? null,
      brandName: p.brand?.name ?? null,
    }));
  }

  /**
   * Slow Moving Products - Products with no recent sales
   */
  async getSlowMovingProducts(daysThreshold: number = 90, limit: number = 20): Promise<SlowMovingProductData[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Get all active products with their last sale date
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minStock: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        invoiceItems: {
          where: {
            invoice: {
              status: { not: 'CANCELLED' },
            },
          },
          select: {
            invoice: { select: { invoiceDate: true } },
            quantity: true,
          },
          orderBy: { invoice: { invoiceDate: 'desc' } },
          take: 1,
        },
      },
    });

    return products
      .map(p => {
        const lastSale = p.invoiceItems[0];
        const lastSaleDate = lastSale?.invoice.invoiceDate ?? null;
        const daysSinceLastSale = lastSaleDate
          ? Math.floor((Date.now() - new Date(lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        // Calculate total quantity sold
        const totalQuantitySold = p.invoiceItems.reduce((sum, item) => sum + Number(item.quantity), 0);

        return {
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          categoryName: p.category?.name ?? null,
          brandName: p.brand?.name ?? null,
          currentStock: Number(p.currentStock),
          minStock: Number(p.minStock),
          lastSaleDate,
          daysSinceLastSale,
          totalQuantitySold,
        };
      })
      .filter(p => !p.lastSaleDate || p.daysSinceLastSale! >= daysThreshold)
      .sort((a, b) => {
        // Sort by days since last sale (null = never sold, comes first)
        if (!a.daysSinceLastSale && !b.daysSinceLastSale) return 0;
        if (!a.daysSinceLastSale) return -1;
        if (!b.daysSinceLastSale) return 1;
        return b.daysSinceLastSale - a.daysSinceLastSale;
      })
      .slice(0, limit);
  }

  /**
   * Monthly Comparison for year-over-year analysis
   */
  async getMonthlyComparison(months: number = 12): Promise<MonthlyComparisonData[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        EXTRACT(YEAR FROM "invoiceDate") as year,
        EXTRACT(MONTH FROM "invoiceDate") as month,
        COALESCE(SUM("grandTotal"), 0) as revenue,
        COUNT(*) as invoice_count,
        COALESCE(SUM("totalGstAmount"), 0) as gst_amount
      FROM "invoices"
      WHERE "invoiceDate" >= $1
        AND "status" != 'CANCELLED'
      GROUP BY EXTRACT(YEAR FROM "invoiceDate"), EXTRACT(MONTH FROM "invoiceDate")
      ORDER BY year ASC, month ASC
    `, startDate);

    const monthlyData = results.map(row => ({
      month: `${Number(row.year)}-${String(Number(row.month)).padStart(2, '0')}`,
      year: Number(row.year),
      revenue: Number(row.revenue),
      invoiceCount: Number(row.invoice_count),
      gstAmount: Number(row.gst_amount),
      growthRate: 0, // Will be calculated below
    }));

    // Calculate growth rate compared to previous month
    for (let i = 1; i < monthlyData.length; i++) {
      const prev = monthlyData[i - 1];
      const curr = monthlyData[i];
      if (prev && curr && prev.revenue > 0) {
        curr.growthRate = ((curr.revenue - prev.revenue) / prev.revenue) * 100;
      }
    }

    return monthlyData;
  }

  /**
   * Global Search across all entities
   */
  async globalSearch(query: string, limit: number = 10): Promise<SearchResults> {
    const searchTerm = query.trim();
    if (!searchTerm) {
      return { products: [], customers: [], invoices: [], categories: [], brands: [] };
    }

    const [products, customers, invoices, categories, brands] = await Promise.all([
      // Products
      prisma.product.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
            { barcode: { contains: searchTerm, mode: 'insensitive' } },
            { hsnCode: { contains: searchTerm, mode: 'insensitive' } },
            { searchKeywords: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          sku: true,
          name: true,
          hsnCode: true,
          sellingPrice: true,
          currentStock: true,
          unit: true,
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      }),
      // Customers
      prisma.customer.findMany({
        where: {
          deletedAt: null,
          OR: [
            { companyName: { contains: searchTerm, mode: 'insensitive' } },
            { customerCode: { contains: searchTerm, mode: 'insensitive' } },
            { gstNumber: { contains: searchTerm, mode: 'insensitive' } },
            { panNumber: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          customerCode: true,
          companyName: true,
          contactPerson: true,
          gstNumber: true,
          phone: true,
          email: true,
          city: true,
          state: true,
          customerType: true,
        },
      }),
      // Invoices
      prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
            { customer: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
            { customer: { customerCode: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        },
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          grandTotal: true,
          status: true,
          paymentStatus: true,
          customer: { select: { companyName: true, customerCode: true } },
        },
      }),
      // Categories
      prisma.category.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' },
        },
        take: limit,
        select: { id: true, name: true, description: true },
      }),
      // Brands
      prisma.brand.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' },
        },
        take: limit,
        select: { id: true, name: true, description: true },
      }),
    ]);

    return {
      products: products.map(p => ({
        id: p.id,
        type: 'product' as const,
        title: p.name,
        subtitle: p.sku,
        metadata: {
          hsnCode: p.hsnCode,
          sellingPrice: Number(p.sellingPrice),
          currentStock: Number(p.currentStock),
          unit: p.unit,
          category: p.category?.name,
          brand: p.brand?.name,
        },
      })),
      customers: customers.map(c => ({
        id: c.id,
        type: 'customer' as const,
        title: c.companyName,
        subtitle: c.customerCode,
        metadata: {
          contactPerson: c.contactPerson,
          gstNumber: c.gstNumber,
          phone: c.phone,
          email: c.email,
          city: c.city,
          state: c.state,
          customerType: c.customerType,
        },
      })),
      invoices: invoices.map(i => ({
        id: i.id,
        type: 'invoice' as const,
        title: i.invoiceNumber,
        subtitle: i.customer.companyName,
        metadata: {
          invoiceDate: i.invoiceDate,
          grandTotal: Number(i.grandTotal),
          status: i.status,
          paymentStatus: i.paymentStatus,
          customerCode: i.customer.customerCode,
        },
      })),
      categories: categories.map(c => ({
        id: c.id,
        type: 'category' as const,
        title: c.name,
        subtitle: c.description ?? undefined,
        metadata: {},
      })),
      brands: brands.map(b => ({
        id: b.id,
        type: 'brand' as const,
        title: b.name,
        subtitle: b.description ?? undefined,
        metadata: {},
      })),
    };
  }
}

export const analyticsRepository = new AnalyticsRepositoryImpl();