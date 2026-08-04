import { Router } from 'express';
import { storageController } from '@controllers/storage.controller';
import { asyncHandler } from '@utils/api-error';
import { validateQuery, validateParams } from '@middlewares/validation.middleware';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/role.middleware';
import { uploadImageSchema, uploadSignatureSchema, deleteFileSchema, getFileUrlSchema } from '@validators/storage.validators';
import multer from 'multer';
import { FileValidator, MAX_FILE_SIZE } from '@utils/file-validator';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const validation = FileValidator.validate(file);
    if (validation.isValid) {
      cb(null, true);
    } else {
      cb(new Error(validation.error || 'Invalid file type'));
    }
  },
});

// All storage routes require authentication
router.use(authMiddleware);

// POST /api/v1/storage/upload/image
router.post(
  '/upload/image',
  requireAdmin,
  upload.single('file'),
  validateQuery(uploadImageSchema),
  asyncHandler(storageController.uploadImage.bind(storageController))
);

// POST /api/v1/storage/upload/signature
router.post(
  '/upload/signature',
  requireAdmin,
  upload.single('file'),
  validateQuery(uploadSignatureSchema),
  asyncHandler(storageController.uploadSignature.bind(storageController))
);

// DELETE /api/v1/storage/:path
router.delete(
  '/:path',
  requireAdmin,
  validateParams(deleteFileSchema),
  asyncHandler(storageController.deleteFile.bind(storageController))
);

// GET /api/v1/storage/url/:path
router.get(
  '/url/:path',
  validateParams(getFileUrlSchema),
  asyncHandler(storageController.getFileUrl.bind(storageController))
);

// GET /api/v1/storage/config
router.get(
  '/config',
  asyncHandler(storageController.getConfig.bind(storageController))
);

export default router;