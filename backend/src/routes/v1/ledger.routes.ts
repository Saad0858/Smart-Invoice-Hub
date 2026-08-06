import { Router } from 'express';
import { ledgerController } from '@controllers/ledger.controller';
import { asyncHandler } from '@utils/api-error';
import { validateQuery, validateParams } from '@middlewares/validation.middleware';
import { ledgerQuerySchema, statementQuerySchema, agingQuerySchema, customerIdParamSchema } from '@validators/payment.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAccountant, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/ledger/customer/:customerId - Running Ledger (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/customer/:customerId',
  authMiddleware,
  requireSales,
  validateParams(customerIdParamSchema),
  validateQuery(ledgerQuerySchema),
  asyncHandler(ledgerController.getCustomerLedger.bind(ledgerController))
);

// GET /api/v1/ledger/customer/:customerId/statement - Printable Statement (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/customer/:customerId/statement',
  authMiddleware,
  requireSales,
  validateParams(customerIdParamSchema),
  validateQuery(statementQuerySchema),
  asyncHandler(ledgerController.getCustomerStatement.bind(ledgerController))
);

// GET /api/v1/ledger/aging - Outstanding Aging Report (ADMIN, ACCOUNTANT)
router.get(
  '/aging',
  authMiddleware,
  requireAccountant,
  validateQuery(agingQuerySchema),
  asyncHandler(ledgerController.getOutstandingAging.bind(ledgerController))
);

export default router;