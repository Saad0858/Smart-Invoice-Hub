import { Router } from 'express';
import { analyticsController } from '@controllers/analytics.controller';
import { asyncHandler } from '@utils/api-error';
import { validateQuery, validateParams } from '@middlewares/validation.middleware';
import {
  invoiceHistoryQuerySchema,
  invoiceIdParamSchema,
  invoiceSearchQuerySchema,
  invoiceExportQuerySchema,
  salesReportQuerySchema,
  productReportQuerySchema,
  customerReportQuerySchema,
  gstReportQuerySchema,
  topCustomersQuerySchema,
  topProductsQuerySchema,
  revenueTrendQuerySchema,
  lowStockQuerySchema,
  slowMovingQuerySchema,
  monthlyComparisonQuerySchema,
  globalSearchQuerySchema,
  // AR Analytics validators
  collectionTrendQuerySchema,
  monthlyCollectionQuerySchema,
  dailyCollectionQuerySchema,
  topPayingCustomersQuerySchema,
  outstandingAgingQuerySchema,
  paymentMethodAnalyticsQuerySchema,
  collectionForecastQuerySchema,
} from '@validators/analytics.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireDashboardAccess } from '@middlewares/role.middleware';

const router = Router();

// All analytics routes require authentication and dashboard access (ADMIN, ACCOUNTANT, SALES)
// Apply middleware to all routes
router.use(authMiddleware);
router.use(requireDashboardAccess);

// ============================================
// INVOICE HISTORY
// ============================================

// GET /analytics/invoices/history - List invoices with filters and pagination
router.get(
  '/invoices/history',
  validateQuery(invoiceHistoryQuerySchema),
  asyncHandler(analyticsController.getInvoiceHistory.bind(analyticsController))
);

// GET /analytics/invoices/history/:id - Get single invoice by ID
router.get(
  '/invoices/history/:id',
  validateParams(invoiceIdParamSchema),
  asyncHandler(analyticsController.getInvoiceById.bind(analyticsController))
);

// GET /analytics/invoices/search - Quick search for invoices
router.get(
  '/invoices/search',
  validateQuery(invoiceSearchQuerySchema),
  asyncHandler(analyticsController.searchInvoices.bind(analyticsController))
);

// GET /analytics/invoices/export - Export invoices to CSV
router.get(
  '/invoices/export',
  validateQuery(invoiceExportQuerySchema),
  asyncHandler(analyticsController.exportInvoices.bind(analyticsController))
);

// ============================================
// REPORTS
// ============================================

// GET /analytics/reports/sales - Sales Report
router.get(
  '/reports/sales',
  validateQuery(salesReportQuerySchema),
  asyncHandler(analyticsController.getSalesReport.bind(analyticsController))
);

// GET /analytics/reports/products - Product Report
router.get(
  '/reports/products',
  validateQuery(productReportQuerySchema),
  asyncHandler(analyticsController.getProductReport.bind(analyticsController))
);

// GET /analytics/reports/customers - Customer Report
router.get(
  '/reports/customers',
  validateQuery(customerReportQuerySchema),
  asyncHandler(analyticsController.getCustomerReport.bind(analyticsController))
);

// GET /analytics/reports/gst - GST Report
router.get(
  '/reports/gst',
  validateQuery(gstReportQuerySchema),
  asyncHandler(analyticsController.getGSTReport.bind(analyticsController))
);

// ============================================
// BUSINESS ANALYTICS
// ============================================

// GET /analytics/top-customers - Top customers by revenue
router.get(
  '/top-customers',
  validateQuery(topCustomersQuerySchema),
  asyncHandler(analyticsController.getTopCustomers.bind(analyticsController))
);

// GET /analytics/top-products - Top products by quantity sold
router.get(
  '/top-products',
  validateQuery(topProductsQuerySchema),
  asyncHandler(analyticsController.getTopProducts.bind(analyticsController))
);

// GET /analytics/revenue-trend - Revenue trend for charts
router.get(
  '/revenue-trend',
  validateQuery(revenueTrendQuerySchema),
  asyncHandler(analyticsController.getRevenueTrend.bind(analyticsController))
);

// GET /analytics/low-stock - Low stock products
router.get(
  '/low-stock',
  validateQuery(lowStockQuerySchema),
  asyncHandler(analyticsController.getLowStockProducts.bind(analyticsController))
);

// GET /analytics/slow-moving - Slow moving products
router.get(
  '/slow-moving',
  validateQuery(slowMovingQuerySchema),
  asyncHandler(analyticsController.getSlowMovingProducts.bind(analyticsController))
);

// GET /analytics/monthly-comparison - Monthly comparison
router.get(
  '/monthly-comparison',
  validateQuery(monthlyComparisonQuerySchema),
  asyncHandler(analyticsController.getMonthlyComparison.bind(analyticsController))
);

// ============================================
// AR ANALYTICS
// ============================================

// GET /analytics/ar/collection-trend - Collection trend over time
router.get(
  '/ar/collection-trend',
  validateQuery(collectionTrendQuerySchema),
  asyncHandler(analyticsController.getCollectionTrend.bind(analyticsController))
);

// GET /analytics/ar/monthly-collection - Monthly collection summary
router.get(
  '/ar/monthly-collection',
  validateQuery(monthlyCollectionQuerySchema),
  asyncHandler(analyticsController.getMonthlyCollection.bind(analyticsController))
);

// GET /analytics/ar/daily-collection - Daily collection summary
router.get(
  '/ar/daily-collection',
  validateQuery(dailyCollectionQuerySchema),
  asyncHandler(analyticsController.getDailyCollection.bind(analyticsController))
);

// GET /analytics/ar/top-paying-customers - Top paying customers
router.get(
  '/ar/top-paying-customers',
  validateQuery(topPayingCustomersQuerySchema),
  asyncHandler(analyticsController.getTopPayingCustomers.bind(analyticsController))
);

// GET /analytics/ar/outstanding-aging - Outstanding aging report
router.get(
  '/ar/outstanding-aging',
  validateQuery(outstandingAgingQuerySchema),
  asyncHandler(analyticsController.getOutstandingAging.bind(analyticsController))
);

// GET /analytics/ar/payment-method-analytics - Payment method distribution analytics
router.get(
  '/ar/payment-method-analytics',
  validateQuery(paymentMethodAnalyticsQuerySchema),
  asyncHandler(analyticsController.getPaymentMethodAnalytics.bind(analyticsController))
);

// GET /analytics/ar/collection-forecast - Collection forecast
router.get(
  '/ar/collection-forecast',
  validateQuery(collectionForecastQuerySchema),
  asyncHandler(analyticsController.getCollectionForecast.bind(analyticsController))
);

// ============================================
// GLOBAL SEARCH
// ============================================

// GET /analytics/search - Global search across all entities
router.get(
  '/search',
  validateQuery(globalSearchQuerySchema),
  asyncHandler(analyticsController.globalSearch.bind(analyticsController))
);

export default router;