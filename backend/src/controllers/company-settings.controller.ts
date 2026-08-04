import type { Request, Response } from 'express';
import { companySettingsService } from '@services/company-settings.service';
import { sendSuccess, sendError } from '@utils/response';
import { HTTP_STATUS, MESSAGES } from '@constants/index';
import { ApiError } from '@utils/api-error';

export class CompanySettingsController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await companySettingsService.getSettings();

      if (!settings) {
        sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, [], req.requestId);
        return;
      }

      sendSuccess(res, settings, MESSAGES.SUCCESS, HTTP_STATUS.OK, req.requestId);
    } catch {
      sendError(res, 'Failed to get company settings', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      const settings = await companySettingsService.updateSettings(req.body, userId);
      sendSuccess(res, settings, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to update company settings', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, [], req.requestId);
        return;
      }

      // The file is uploaded via multer or similar, URL is in req.body.logoUrl
      // or we can expect the URL to be passed in body
      const { logoUrl } = req.body;

      if (!logoUrl) {
        sendError(res, 'Logo URL is required', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const settings = await companySettingsService.updateLogo(logoUrl, userId);
      sendSuccess(res, settings, MESSAGES.UPDATED, HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to upload logo', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }
}

export const companySettingsController = new CompanySettingsController();