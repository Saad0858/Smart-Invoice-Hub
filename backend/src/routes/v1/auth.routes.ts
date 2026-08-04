import { Router } from 'express';
import { authController } from '@controllers/auth.controller';
import { asyncHandler } from '@utils/api-error';
import { validateBody } from '@middlewares/validation.middleware';
import { loginSchema } from '@validators/auth.validators';
import { authMiddleware } from '@middlewares/auth.middleware';

const router = Router();

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(authController.getProfile.bind(authController))
);

router.post(
  '/logout',
  authMiddleware,
  asyncHandler(authController.logout.bind(authController))
);

export default router;