import { Router } from 'express';
import { categoryController } from '@controllers/category.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody, validateParams, validateQuery } from '@middlewares/validation.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema,
} from '@validators/category.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin, requireSales } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/categories - List all categories (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/',
  authMiddleware,
  requireSales,
  validateQuery(categoryQuerySchema),
  asyncHandler(categoryController.list.bind(categoryController))
);

// GET /api/v1/categories/:id - Get category by ID (ADMIN, ACCOUNTANT, SALES)
router.get(
  '/:id',
  authMiddleware,
  requireSales,
  validateParams(categoryIdParamSchema),
  asyncHandler(categoryController.getById.bind(categoryController))
);

// POST /api/v1/categories - Create category (ADMIN only)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(createCategorySchema),
  asyncHandler(categoryController.create.bind(categoryController))
);

// PUT /api/v1/categories/:id - Update category (ADMIN only)
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(categoryIdParamSchema),
  validateBody(updateCategorySchema),
  asyncHandler(categoryController.update.bind(categoryController))
);

// DELETE /api/v1/categories/:id - Delete category (ADMIN only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(categoryIdParamSchema),
  asyncHandler(categoryController.delete.bind(categoryController))
);

export default router;