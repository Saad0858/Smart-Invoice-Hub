import { Router } from 'express';
import { brandController } from '@controllers/brand.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody, validateParams, validateQuery } from '@middlewares/validation.middleware';
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdParamSchema,
  brandQuerySchema,
} from '@validators/brand.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/brands - List all brands (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(brandQuerySchema),
  asyncHandler(brandController.list.bind(brandController))
);

// GET /api/v1/brands/:id - Get brand by ID (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/:id',
  authMiddleware,
  requireSales,
  validateParams(brandIdParamSchema),
  asyncHandler(brandController.getById.bind(brandController))
);

// POST /api/v1/brands - Create brand (ADMIN only)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(createBrandSchema),
  asyncHandler(brandController.create.bind(brandController))
);

// PUT /api/v1/brands/:id - Update brand (ADMIN only)
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(brandIdParamSchema),
  validateBody(updateBrandSchema),
  asyncHandler(brandController.update.bind(brandController))
);

// DELETE /api/v1/brands/:id - Delete brand (ADMIN only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(brandIdParamSchema),
  asyncHandler(brandController.delete.bind(brandController))
);

export default router;