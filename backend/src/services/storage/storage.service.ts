import { LocalStorageProvider } from './local-storage.provider';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import { StorageProvider, UploadResult } from '@interfaces/storage.provider';
import { StorageHelper } from '@utils/storage-helper';
import { env } from '@config/env';
import { ApiError } from '@utils/api-error';

export interface UploadImageInput {
  file: Express.Multer.File;
  folder: 'company' | 'products' | 'signatures';
}

export interface UploadSignatureInput {
  file: Express.Multer.File;
  folder: 'signatures';
}

export class StorageService {
  private provider: StorageProvider;

  constructor() {
    this.provider = this.createProvider();
  }

  private createProvider(): StorageProvider {
    const providerType = env.STORAGE_PROVIDER || 'local';

    switch (providerType) {
      case 'supabase':
        return new SupabaseStorageProvider();
      case 'local':
      default:
        return new LocalStorageProvider();
    }
  }

  /**
   * Get the active storage provider
   */
  getProvider(): StorageProvider {
    return this.provider;
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return env.STORAGE_PROVIDER || 'local';
  }

  /**
   * Upload an image file
   */
  async uploadImage(input: UploadImageInput): Promise<UploadResult> {
    const { file, folder } = input;

    // Additional folder validation
    if (!StorageHelper.isValidFolder(folder)) {
      throw ApiError.badRequest(`Invalid folder: ${folder}. Allowed folders: company, products, signatures`);
    }

    // Optimize image if needed (optional)
    const optimizedFile = await StorageHelper.optimizeImageIfNeeded(file, {
      quality: 85,
      format: 'webp',
      withoutEnlargement: true,
    });

    return this.provider.upload(optimizedFile, folder);
  }

  /**
   * Upload a signature file
   */
  async uploadSignature(input: UploadSignatureInput): Promise<UploadResult> {
    const { file, folder } = input;

    if (folder !== 'signatures') {
      throw ApiError.badRequest('Signatures can only be uploaded to the signatures folder');
    }

    // Signatures are typically smaller, less optimization needed
    const optimizedFile = await StorageHelper.optimizeImageIfNeeded(file, {
      quality: 90,
      format: 'webp',
      withoutEnlargement: true,
    });

    return this.provider.upload(optimizedFile, folder);
  }

  /**
   * Delete a file by path
   */
  async deleteFile(path: string): Promise<void> {
    const cleanPath = StorageHelper.preventDirectoryTraversal(path);
    await this.provider.delete(cleanPath);
  }

  /**
   * Get public URL for a file
   */
  async getFileUrl(path: string): Promise<string> {
    const cleanPath = StorageHelper.preventDirectoryTraversal(path);
    return this.provider.getUrl(cleanPath);
  }

  /**
   * Get bucket name
   */
  getBucketName(): string {
    return this.provider.getBucketName();
  }

  /**
   * Get storage configuration info
   */
  getConfig() {
    return StorageHelper.getConfig();
  }

  /**
   * Get upload limits and allowed types
   */
  getUploadLimits() {
    return StorageHelper.getUploadLimits();
  }

  /**
   * Get allowed folders
   */
  getAllowedFolders() {
    return StorageHelper.getAllowedFolders();
  }
}

export const storageService = new StorageService();