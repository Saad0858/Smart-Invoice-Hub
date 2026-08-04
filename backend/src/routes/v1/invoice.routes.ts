import { Router } from 'express';
import { invoiceController } from '@controllers/invoice.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody, validateParams, validateQuery } from '@middlewares/validation.middleware';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceIdParamSchema,
  invoiceQuerySchema,
  duplicateInvoiceSchema,
} from '@validators/invoice.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAccountant, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/invoices - List all invoices (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(invoiceQuerySchema),
  asyncHandler(invoiceController.list.bind(invoiceController))
);

// GET /api/v1/invoices/statistics - Get invoice statistics (ADMIN, ACCOUNTANT)
router.get(
  '/statistics',
  authMiddleware,
  requireAccountant,
  asyncHandler(invoiceController.getStatistics.bind(invoiceController))
);

// GET /api/v1/invoices/next-number - Get next invoice number (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/next-number',
  authMiddleware,
  requireSales,
  asyncHandler(invoiceController.getNextNumber.bind(invoiceController))
);

// GET /api/v1/invoices/:id - Get invoice by ID (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/:id',
  authMiddleware,
  requireSales,
  validateParams(invoiceIdParamSchema),
  asyncHandler(invoiceController.getById.bind(invoiceController))
);

// POST /api/v1/invoices - Create invoice (ADMIN, ACCOUNTANT, SALES)
router.post(
  '/',
  authMiddleware,
  requireSales,
  validateBody(createInvoiceSchema),
  asyncHandler(invoiceController.create.bind(invoiceController))
);

// PUT /api/v1/invoices/:id - Update invoice (ADMIN, ACCOUNTANT) - only DRAFT invoices
router.put(
  '/:id',
  authMiddleware,
  requireAccountant,
  validateParams(invoiceIdParamSchema),
  validateBody(updateInvoiceSchema),
  asyncHandler(invoiceController.update.bind(invoiceController))
);

// POST /api/v1/invoices/:id/cancel - Cancel invoice (ADMIN, ACCOUNTANT)
router.post(
  '/:id/cancel',
  authMiddleware,
  requireAccountant,
  validateParams(invoiceIdParamSchema),
  asyncHandler(invoiceController.cancel.bind(invoiceController))
);

// POST /api/v1/invoices/:id/duplicate - Duplicate invoice (ADMIN, ACCOUNTANT)
router.post(
  '/:id/duplicate',
  authMiddleware,
  requireAccountant,
  validateParams(duplicateInvoiceSchema),
  asyncHandler(invoiceController.duplicate.bind(invoiceController))
);

export default router;