import { Router } from 'express';
import { paymentController } from '@controllers/payment.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody, validateParams, validateQuery } from '@middlewares/validation.middleware';
import {
  createPaymentSchema,
  updatePaymentSchema,
  cancelPaymentSchema,
  paymentIdParamSchema,
  paymentQuerySchema,
  invoicePaymentsParamSchema,
  customerPaymentsParamSchema,
} from '@validators/payment.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAccountant, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/payments - List all payments (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(paymentQuerySchema),
  asyncHandler(paymentController.list.bind(paymentController))
);

// GET /api/v1/payments/statistics - Get payment statistics (ADMIN, ACCOUNTANT)
router.get(
  '/statistics',
  authMiddleware,
  requireAccountant,
  asyncHandler(paymentController.getStatistics.bind(paymentController))
);

// GET /api/v1/payments/method-distribution - Get payment method distribution (ADMIN, ACCOUNTANT)
router.get(
  '/method-distribution',
  authMiddleware,
  requireAccountant,
  asyncHandler(paymentController.getPaymentMethodDistribution.bind(paymentController))
);

// GET /api/v1/payments/collection-trend - Get collection trend (ADMIN, ACCOUNTANT)
router.get(
  '/collection-trend',
  authMiddleware,
  requireAccountant,
  asyncHandler(paymentController.getCollectionTrend.bind(paymentController))
);

// GET /api/v1/payments/invoice/:invoiceId - Payment history for invoice (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/invoice/:invoiceId',
  authMiddleware,
  requireSales,
  validateParams(invoicePaymentsParamSchema),
  asyncHandler(paymentController.getByInvoice.bind(paymentController))
);

// GET /api/v1/payments/customer/:customerId - Customer payment history (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/customer/:customerId',
  authMiddleware,
  requireSales,
  validateParams(customerPaymentsParamSchema),
  asyncHandler(paymentController.getByCustomer.bind(paymentController))
);

// GET /api/v1/payments/:id - Get payment by ID (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/:id',
  authMiddleware,
  requireSales,
  validateParams(paymentIdParamSchema),
  asyncHandler(paymentController.getById.bind(paymentController))
);

// POST /api/v1/payments - Record Payment (ADMIN, ACCOUNTANT, SALES)
router.post(
  '/',
  authMiddleware,
  requireSales,
  validateBody(createPaymentSchema),
  asyncHandler(paymentController.create.bind(paymentController))
);

// PUT /api/v1/payments/:id - Update Payment (ADMIN, ACCOUNTANT)
router.put(
  '/:id',
  authMiddleware,
  requireAccountant,
  validateParams(paymentIdParamSchema),
  validateBody(updatePaymentSchema),
  asyncHandler(paymentController.update.bind(paymentController))
);

// POST /api/v1/payments/:id/cancel - Cancel Payment (ADMIN, ACCOUNTANT)
router.post(
  '/:id/cancel',
  authMiddleware,
  requireAccountant,
  validateParams(paymentIdParamSchema),
  validateBody(cancelPaymentSchema),
  asyncHandler(paymentController.cancel.bind(paymentController))
);

export default router;