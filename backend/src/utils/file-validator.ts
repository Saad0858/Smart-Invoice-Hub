import { ApiError } from '@utils/api-error';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export interface FileValidationResult {
  isValid: boolean;
  mimeType: string;
  extension: string;
  error?: string;
}

export class FileValidator {
  private static readonly MIME_TO_EXTENSION: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };

  private static readonly EXTENSION_TO_MIME: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  static validate(file: Express.Multer.File): FileValidationResult {
    if (!file) {
      return {
        isValid: false,
        mimeType: '',
        extension: '',
        error: 'No file provided',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        mimeType: file.mimetype,
        extension: this.getExtensionFromMime(file.mimetype),
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
      };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as AllowedMimeType)) {
      return {
        isValid: false,
        mimeType: file.mimetype,
        extension: this.getExtensionFromMime(file.mimetype),
        error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      };
    }

    // Validate extension matches MIME type
    const expectedExtension = this.MIME_TO_EXTENSION[file.mimetype];
    const actualExtension = this.getExtensionFromFilename(file.originalname).toLowerCase();

    if (expectedExtension && actualExtension !== expectedExtension) {
      return {
        isValid: false,
        mimeType: file.mimetype,
        extension: actualExtension,
        error: `File extension does not match MIME type. Expected ${expectedExtension}, got ${actualExtension}`,
      };
    }

    return {
      isValid: true,
      mimeType: file.mimetype,
      extension: expectedExtension || actualExtension,
    };
  }

  static validateOrThrow(file: Express.Multer.File): void {
    const result = this.validate(file);
    if (!result.isValid) {
      throw ApiError.badRequest(result.error || 'File validation failed');
    }
  }

  static getExtensionFromMime(mimeType: string): string {
    return this.MIME_TO_EXTENSION[mimeType] || '';
  }

  static getMimeFromExtension(extension: string): string {
    return this.EXTENSION_TO_MIME[extension.toLowerCase()] || '';
  }

  static getExtensionFromFilename(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex).toLowerCase();
  }

  static isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
  }

  static isAllowedExtension(extension: string): boolean {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase() as AllowedExtension);
  }
}