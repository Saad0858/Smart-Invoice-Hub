import { Router } from 'express';
import { customerController } from '@controllers/customer.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody, validateParams, validateQuery } from '@middlewares/validation.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  customerQuerySchema,
} from '@validators/customer.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin, requireAccountant, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/customers - List all customers (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(customerQuerySchema),
  asyncHandler(customerController.list.bind(customerController))
);

// GET /api/v1/customers/statistics - Get customer statistics (ADMIN, ACCOUNTANT)
router.get(
  '/statistics',
  authMiddleware,
  requireAccountant,
  asyncHandler(customerController.getStatistics.bind(customerController))
);

// GET /api/v1/customers/:id - Get customer by ID (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/:id',
  authMiddleware,
  requireSales,
  validateParams(customerIdParamSchema),
  asyncHandler(customerController.getById.bind(customerController))
);

// POST /api/v1/customers - Create customer (ADMIN, ACCOUNTANT)
router.post(
  '/',
  authMiddleware,
  requireAccountant,
  validateBody(createCustomerSchema),
  asyncHandler(customerController.create.bind(customerController))
);

// PUT /api/v1/customers/:id - Update customer (ADMIN, ACCOUNTANT)
router.put(
  '/:id',
  authMiddleware,
  requireAccountant,
  validateParams(customerIdParamSchema),
  validateBody(updateCustomerSchema),
  asyncHandler(customerController.update.bind(customerController))
);

// DELETE /api/v1/customers/:id - Delete customer (ADMIN only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(customerIdParamSchema),
  asyncHandler(customerController.delete.bind(customerController))
);

export default router;