import { env } from '@config/env';
import { FileValidator, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from './file-validator';
import { FileNameGenerator, STORAGE_FOLDERS, type StorageFolder } from './file-name-generator';
import { ImageOptimizerFactory, type ImageOptimizationOptions } from './image-optimizer';
import type { UploadResult } from '@interfaces/storage.provider';

export interface StorageConfig {
  provider: 'local' | 'supabase';
  bucketName: string;
  baseUrl: string;
  localPath: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export class StorageHelper {
  private static config: StorageConfig = {
    provider: (env.STORAGE_PROVIDER as 'local' | 'supabase') || 'local',
    bucketName: env.STORAGE_BUCKET_NAME || 'smart-invoice-hub',
    baseUrl: env.STORAGE_BASE_URL || '',
    localPath: env.STORAGE_LOCAL_PATH || './uploads',
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };

  static getConfig(): StorageConfig {
    return { ...this.config };
  }

  static setConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static getProvider(): 'local' | 'supabase' {
    return this.config.provider;
  }

  static getBucketName(): string {
    return this.config.bucketName;
  }

  static getBaseUrl(): string {
    return this.config.baseUrl;
  }

  static getLocalPath(): string {
    return this.config.localPath;
  }

  static validateAndPrepareUpload(
    file: Express.Multer.File,
    folder: string
  ): { folder: StorageFolder; generated: ReturnType<typeof FileNameGenerator.generate>; validation: ReturnType<typeof FileValidator.validate> } {
    // Validate file
    const validation = FileValidator.validate(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Sanitize and validate folder
    const storageFolder = FileNameGenerator.sanitizeFolder(folder);

    // Generate file name
    const generated = FileNameGenerator.generate(storageFolder, file.originalname, file.mimetype);

    return { folder: storageFolder, generated, validation };
  }

  static async optimizeImageIfNeeded(
    file: Express.Multer.File,
    options?: ImageOptimizationOptions
  ): Promise<Express.Multer.File> {
    const optimizer = ImageOptimizerFactory.getOptimizer();

    // Only optimize raster images, not SVG
    if (file.mimetype === 'image/svg+xml') {
      return file;
    }

    try {
      const optimized = await optimizer.optimize(file.buffer, file.mimetype, options);

      // Only use optimized if it's actually smaller
      if (optimized.size < file.size) {
        return {
          ...file,
          buffer: optimized.buffer,
          size: optimized.size,
          mimetype: optimized.mimeType,
        };
      }
    } catch (error) {
      // If optimization fails, use original file
      console.warn('Image optimization failed, using original:', error);
    }

    return file;
  }

  static buildPublicUrl(path: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${baseUrl}/${cleanPath}`;
  }

  static buildLocalUrl(path: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${baseUrl}/uploads/${cleanPath}`;
  }

  static getUploadLimits() {
    return {
      fileSize: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      allowedExtensions: ALLOWED_EXTENSIONS,
    };
  }

  static getAllowedFolders(): StorageFolder[] {
    return Object.values(STORAGE_FOLDERS);
  }

  static isValidFolder(folder: string): folder is StorageFolder {
    return FileNameGenerator.isValidFolder(folder);
  }

  static createUploadResult(
    generated: ReturnType<typeof FileNameGenerator.generate>,
    file: Express.Multer.File,
    provider: string,
    url: string
  ): UploadResult {
    return {
      fileName: generated.fileName,
      originalName: file.originalname,
      folder: generated.folder,
      path: generated.path,
      url,
      mimeType: file.mimetype,
      size: file.size,
      provider,
    };
  }

  static preventDirectoryTraversal(path: string): string {
    // Remove any directory traversal attempts
    const cleaned = path
      .replace(/\.\./g, '')
      .replace(/\/\//g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

    // Ensure path doesn't start with folder traversal
    if (cleaned.startsWith('..') || cleaned.includes('..')) {
      throw new Error('Invalid path: directory traversal detected');
    }

    return cleaned;
  }

  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}