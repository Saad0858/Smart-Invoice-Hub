import type { Request, Response } from 'express';
import { storageService } from '@services/storage/storage.service';
import { sendSuccess, sendError } from '@utils/response';
import { HTTP_STATUS } from '@constants/index';
import { ApiError } from '@utils/api-error';
import { requireAdmin } from '@middlewares/role.middleware';

export class StorageController {
  /**
   * Upload an image file
   * POST /api/v1/storage/upload/image
   */
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file as Express.Multer.File | undefined;

      if (!file) {
        sendError(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      // Get folder from query or default to products
      const folder = (req.query.folder as 'company' | 'products' | 'signatures') || 'products';

      const result = await storageService.uploadImage({ file, folder });

      sendSuccess(res, result, 'File uploaded successfully', HTTP_STATUS.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to upload image', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * Upload a signature file
   * POST /api/v1/storage/upload/signature
   */
  async uploadSignature(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file as Express.Multer.File | undefined;

      if (!file) {
        sendError(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const result = await storageService.uploadSignature({ file, folder: 'signatures' });

      sendSuccess(res, result, 'Signature uploaded successfully', HTTP_STATUS.CREATED, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to upload signature', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * Delete a file by path
   * DELETE /api/v1/storage/:path
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.params;

      if (!path) {
        sendError(res, 'Path parameter is required', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      await storageService.deleteFile(path);

      sendSuccess(res, null, 'File deleted successfully', HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to delete file', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * Get public URL for a file
   * GET /api/v1/storage/url/:path
   */
  async getFileUrl(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.params;

      if (!path) {
        sendError(res, 'Path parameter is required', HTTP_STATUS.BAD_REQUEST, [], req.requestId);
        return;
      }

      const url = await storageService.getFileUrl(path);

      sendSuccess(res, { url }, 'File URL retrieved successfully', HTTP_STATUS.OK, req.requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.message, error.statusCode, error.errors as any[], req.requestId);
      } else {
        sendError(res, 'Failed to get file URL', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
      }
    }
  }

  /**
   * Get storage configuration info
   * GET /api/v1/storage/config
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = storageService.getConfig();
      const limits = storageService.getUploadLimits();
      const folders = storageService.getAllowedFolders();

      sendSuccess(
        res,
        {
          provider: storageService.getProviderName(),
          bucket: config.bucketName,
          baseUrl: config.baseUrl,
          folders,
          limits,
        },
        'Storage configuration retrieved successfully',
        HTTP_STATUS.OK,
        req.requestId
      );
    } catch (error) {
      sendError(res, 'Failed to get storage config', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], req.requestId);
    }
  }

  /**
   * Middleware to require admin for upload endpoints
   */
  static requireAdminForUpload = requireAdmin;
}

export const storageController = new StorageController();