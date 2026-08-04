import type { Request, Response } from 'express';
import { authService } from '@services/auth.service';
import { sendSuccess, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      sendSuccess(res, result, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Login failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const user = await authService.getProfile(userId);

      if (!user) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, user, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to get profile', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    sendSuccess(res, null, 'Logged out successfully', HTTP_STATUS.OK, req.requestId);
  }
}

export const authController = new AuthController();