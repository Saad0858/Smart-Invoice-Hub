import type { Request, Response } from 'express';
import { healthService } from '@services/health.service';
import { sendSuccess, sendError } from '@utils/response';
import { HTTP_STATUS } from '@constants/http';

export class HealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await healthService.getHealth();
      const statusCode =
        health.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

      sendSuccess(res, health, 'Health check completed', statusCode, req.requestId);
    } catch {
      sendError(res, 'Health check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async getSimpleHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await healthService.getSimpleHealth();
      sendSuccess(res, health, health.message, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Health check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }
}

export const healthController = new HealthController();
