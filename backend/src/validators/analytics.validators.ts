import { z } from 'zod';

const PERIOD_ENUM = ['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const;
const INTERVAL_ENUM = ['daily', 'weekly', 'monthly'] as const;
const INVOICE_STATUS_ENUM = ['DRAFT', 'GENERATED', 'CANCELLED'] as const;
const PAYMENT_STATUS_ENUM = ['PENDING', 'PARTIAL', 'PAID'] as const;
const SORT_ENUM = ['invoiceDate', 'invoiceNumber', 'grandTotal', 'createdAt', 'customerId'] as const;

const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  'Invalid date format (use YYYY-MM-DD)'
);

// Reusable date range fields
const dateRangeFields = {
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
};

// Reusable date range refinement
const dateRangeRefinement = (data: { startDate?: string; endDate?: string }) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
};

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(5000).default(20),
  sort: z.enum(SORT_ENUM).default('invoiceDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
};

// ============================================
// INVOICE HISTORY VALIDATORS
// ============================================

export const invoiceHistoryQuerySchema = z.object({
  query: z.object({
    ...paginationFields,
    search: z.string().optional(),
    customerId: z.string().uuid().optional(),
    status: z.enum(INVOICE_STATUS_ENUM).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_ENUM).optional(),
    createdBy: z.string().uuid().optional(),
    ...dateRangeFields,
  }).refine(dateRangeRefinement, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  }),
});

export const invoiceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID format'),
  }),
});

export const invoiceSearchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(2, 'Search query must be at least 2 characters'),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

export const invoiceExportQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    customerId: z.string().uuid().optional(),
    status: z.enum(INVOICE_STATUS_ENUM).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_ENUM).optional(),
    createdBy: z.string().uuid().optional(),
    ...dateRangeFields,
  }).refine(dateRangeRefinement, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  }),
});

// ============================================
// REPORTS VALIDATORS
// ============================================

const reportPeriodFields = {
  period: z.enum(PERIOD_ENUM).default('monthly'),
  ...dateRangeFields,
};

const reportPeriodSchema = z.object({
  query: z.object(reportPeriodFields).refine(
    (data) => {
      if (data.period === 'custom') {
        return data.startDate && data.endDate;
      }
      return true;
    },
    {
      message: 'Custom period requires startDate and endDate',
      path: ['period'],
    }
  ).refine(dateRangeRefinement, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  }),
});

export const salesReportQuerySchema = reportPeriodSchema;
export const productReportQuerySchema = reportPeriodSchema;
export const customerReportQuerySchema = reportPeriodSchema;
export const gstReportQuerySchema = reportPeriodSchema;

// ============================================
// BUSINESS ANALYTICS VALIDATORS
// ============================================

export const topCustomersQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    ...dateRangeFields,
  }).refine(dateRangeRefinement, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  }),
});

export const topProductsQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    ...dateRangeFields,
  }).refine(dateRangeRefinement, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  }),
});

export const revenueTrendQuerySchema = z.object({
  query: z.object({
    interval: z.enum(INTERVAL_ENUM).default('monthly'),
    ...dateRangeFields,
  }).refine(dateRangeRefinement, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  }),
});

export const lowStockQuerySchema = z.object({
  query: z.object({}).optional(),
});

export const slowMovingQuerySchema = z.object({
  query: z.object({
    daysThreshold: z.coerce.number().int().min(1).default(90),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const monthlyComparisonQuerySchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(60).default(12),
  }),
});

// ============================================
// GLOBAL SEARCH VALIDATORS
// ============================================

export const globalSearchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(2, 'Search query must be at least 2 characters'),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type InvoiceHistoryQuery = z.infer<typeof invoiceHistoryQuerySchema>['query'];
export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>['params'];
export type InvoiceSearchQuery = z.infer<typeof invoiceSearchQuerySchema>['query'];
export type InvoiceExportQuery = z.infer<typeof invoiceExportQuerySchema>['query'];

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>['query'];
export type ProductReportQuery = z.infer<typeof productReportQuerySchema>['query'];
export type CustomerReportQuery = z.infer<typeof customerReportQuerySchema>['query'];
export type GSTReportQuery = z.infer<typeof gstReportQuerySchema>['query'];

export type TopCustomersQuery = z.infer<typeof topCustomersQuerySchema>['query'];
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>['query'];
export type RevenueTrendQuery = z.infer<typeof revenueTrendQuerySchema>['query'];
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>['query'];
export type SlowMovingQuery = z.infer<typeof slowMovingQuerySchema>['query'];
export type MonthlyComparisonQuery = z.infer<typeof monthlyComparisonQuerySchema>['query'];

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>['query'];