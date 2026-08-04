import { Router } from 'express';
import { companySettingsController } from '@controllers/company-settings.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody } from '@middlewares/validation.middleware';
import { updateCompanySettingsSchema, uploadLogoSchema } from '@validators/company-settings.validators';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin, requireAccountant } from '@middlewares/role.middleware';

const router = Router();

// GET /api/v1/company - Get company settings (ADMIN, ACCOUNTANT)
router.get(
  '/',
  authMiddleware,
  requireAccountant,
  asyncHandler(companySettingsController.getSettings.bind(companySettingsController))
);

// PUT /api/v1/company - Update company settings (ADMIN only)
router.put(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(updateCompanySettingsSchema),
  asyncHandler(companySettingsController.updateSettings.bind(companySettingsController))
);

// POST /api/v1/company/logo - Upload company logo (ADMIN only)
router.post(
  '/logo',
  authMiddleware,
  requireAdmin,
  validateBody(uploadLogoSchema),
  asyncHandler(companySettingsController.uploadLogo.bind(companySettingsController))
);

export default router;