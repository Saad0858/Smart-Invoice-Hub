import { Router } from 'express';
import { productController } from '@controllers/product.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody, validateParams, validateQuery } from '@middlewares/validation.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productQuerySchema,
} from '@validators/product.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/products - List all products (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(productQuerySchema),
  asyncHandler(productController.list.bind(productController))
);

// GET /api/v1/products/:id - Get product by ID (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/:id',
  authMiddleware,
  requireSales,
  validateParams(productIdParamSchema),
  asyncHandler(productController.getById.bind(productController))
);

// POST /api/v1/products - Create product (ADMIN only)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(createProductSchema),
  asyncHandler(productController.create.bind(productController))
);

// PUT /api/v1/products/:id - Update product (ADMIN only)
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(productIdParamSchema),
  validateBody(updateProductSchema),
  asyncHandler(productController.update.bind(productController))
);

// DELETE /api/v1/products/:id - Delete product (ADMIN only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(productIdParamSchema),
  asyncHandler(productController.delete.bind(productController))
);

export default router;