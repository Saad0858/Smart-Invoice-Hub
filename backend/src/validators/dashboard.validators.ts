import { z } from 'zod';

const PERIOD_ENUM = ['today', 'week', 'month', 'year', 'custom'] as const;
const INTERVAL_ENUM = ['daily', 'weekly', 'monthly'] as const;

const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  'Invalid date format (use YYYY-MM-DD)'
);

export const dashboardSummaryQuerySchema = z.object({
  query: z.object({}).optional(),
});

export const salesOverviewQuerySchema = z.object({
  query: z.object({
    period: z.enum(PERIOD_ENUM).default('month'),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  }).refine(
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
  ).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate must be before endDate',
      path: ['endDate'],
    }
  ),
});

export const recentInvoicesQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const topProductsQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate must be before endDate',
      path: ['endDate'],
    }
  ),
});

export const lowStockQuerySchema = z.object({
  query: z.object({}).optional(),
});

export const customerOverviewQuerySchema = z.object({
  query: z.object({}).optional(),
});

export const revenueTrendQuerySchema = z.object({
  query: z.object({
    interval: z.enum(INTERVAL_ENUM).default('monthly'),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate must be before endDate',
      path: ['endDate'],
    }
  ),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>['query'];
export type SalesOverviewQuery = z.infer<typeof salesOverviewQuerySchema>['query'];
export type RecentInvoicesQuery = z.infer<typeof recentInvoicesQuerySchema>['query'];
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>['query'];
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>['query'];
export type CustomerOverviewQuery = z.infer<typeof customerOverviewQuerySchema>['query'];
export type RevenueTrendQuery = z.infer<typeof revenueTrendQuerySchema>['query'];