import { Router } from 'express';
import { healthController } from '@controllers/health.controller';
import { asyncHandler } from '@utils/api-error';

const router = Router();

router.get('/health', asyncHandler(healthController.getSimpleHealth.bind(healthController)));
router.get('/health/detailed', asyncHandler(healthController.getHealth.bind(healthController)));

export default router;
