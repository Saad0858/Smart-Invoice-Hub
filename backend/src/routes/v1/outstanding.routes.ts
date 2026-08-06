import { Router } from 'express';
import { outstandingController } from '@controllers/outstanding.controller';
import { asyncHandler } from '@utils/api-error';
import { validateQuery, validateParams } from '@middlewares/validation.middleware';
import { outstandingQuerySchema, agingQuerySchema, overdueQuerySchema, customerIdParamSchema } from '@validators/payment.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAccountant, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/outstanding - Outstanding Invoices (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(outstandingQuerySchema),
  asyncHandler(outstandingController.list.bind(outstandingController))
);

// GET /api/v1/outstanding/summary - Outstanding Summary (ADMIN, ACCOUNTANT)
router.get(
  '/summary',
  authMiddleware,
  requireAccountant,
  asyncHandler(outstandingController.getSummary.bind(outstandingController))
);

// GET /api/v1/outstanding/aging - Outstanding Aging Report (ADMIN, ACCOUNTANT)
router.get(
  '/aging',
  authMiddleware,
  requireAccountant,
  validateQuery(agingQuerySchema),
  asyncHandler(outstandingController.getAgingReport.bind(outstandingController))
);

// GET /api/v1/outstanding/overdue - Overdue Invoices (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/overdue',
  authMiddleware,
  requireSales,
  validateQuery(overdueQuerySchema),
  asyncHandler(outstandingController.getOverdueInvoices.bind(outstandingController))
);

// GET /api/v1/outstanding/collection-efficiency - Collection Efficiency (ADMIN, ACCOUNTANT)
router.get(
  '/collection-efficiency',
  authMiddleware,
  requireAccountant,
  asyncHandler(outstandingController.getCollectionEfficiency.bind(outstandingController))
);

// GET /api/v1/outstanding/customer/:customerId - Customer Outstanding (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/customer/:customerId',
  authMiddleware,
  requireSales,
  validateParams(customerIdParamSchema),
  asyncHandler(outstandingController.getByCustomer.bind(outstandingController))
);

export default router;