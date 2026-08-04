import { Router } from 'express';
import { dashboardController } from '@controllers/dashboard.controller';
import { asyncHandler } from '@utils/api-error';
import { validateQuery } from '@middlewares/validation.middleware';
import {
  dashboardSummaryQuerySchema,
  salesOverviewQuerySchema,
  recentInvoicesQuerySchema,
  topProductsQuerySchema,
  lowStockQuerySchema,
  customerOverviewQuerySchema,
  revenueTrendQuerySchema,
} from '@validators/dashboard.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireDashboardAccess } from '@middlewares/role.middleware';

const router = Router();

// All dashboard routes require authentication and dashboard access (ADMIN, ACCOUNTANT, SALES)

// GET /api/v1/dashboard/summary - Dashboard summary
router.get(
  '/summary',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(dashboardSummaryQuerySchema),
  asyncHandler(dashboardController.getSummary.bind(dashboardController))
);

// GET /api/v1/dashboard/sales-overview - Sales overview
router.get(
  '/sales-overview',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(salesOverviewQuerySchema),
  asyncHandler(dashboardController.getSalesOverview.bind(dashboardController))
);

// GET /api/v1/dashboard/recent-invoices - Recent invoices
router.get(
  '/recent-invoices',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(recentInvoicesQuerySchema),
  asyncHandler(dashboardController.getRecentInvoices.bind(dashboardController))
);

// GET /api/v1/dashboard/top-products - Top products
router.get(
  '/top-products',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(topProductsQuerySchema),
  asyncHandler(dashboardController.getTopProducts.bind(dashboardController))
);

// GET /api/v1/dashboard/low-stock - Low stock products
router.get(
  '/low-stock',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(lowStockQuerySchema),
  asyncHandler(dashboardController.getLowStock.bind(dashboardController))
);

// GET /api/v1/dashboard/customer-overview - Customer overview
router.get(
  '/customer-overview',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(customerOverviewQuerySchema),
  asyncHandler(dashboardController.getCustomerOverview.bind(dashboardController))
);

// GET /api/v1/dashboard/revenue-trend - Revenue trend
router.get(
  '/revenue-trend',
  authMiddleware,
  requireDashboardAccess,
  validateQuery(revenueTrendQuerySchema),
  asyncHandler(dashboardController.getRevenueTrend.bind(dashboardController))
);

export default router;