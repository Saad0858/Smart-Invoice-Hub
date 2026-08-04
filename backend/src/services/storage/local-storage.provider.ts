import { promises as fs } from 'fs';
import path from 'path';
import { StorageProvider, UploadResult } from '@interfaces/storage.provider';
import { env } from '@config/env';
import { StorageHelper } from '@utils/storage-helper';

export class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;
  private readonly baseUrl: string;
  private readonly bucketName: string;

  constructor() {
    this.basePath = env.STORAGE_LOCAL_PATH || './uploads';
    this.baseUrl = env.STORAGE_BASE_URL || `http://localhost:${env.PORT}`;
    this.bucketName = 'local';
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }

    // Create folder directories
    const folders = ['company', 'products', 'signatures'];
    for (const folder of folders) {
      const folderPath = path.join(this.basePath, folder);
      try {
        await fs.access(folderPath);
      } catch {
        await fs.mkdir(folderPath, { recursive: true });
      }
    }
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    const { generated } = StorageHelper.validateAndPrepareUpload(file, folder);

    const filePath = path.join(this.basePath, generated.path);
    const directory = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Write file
    await fs.writeFile(filePath, file.buffer);

    // Generate URL
    const url = `${this.baseUrl}/uploads/${generated.path}`;

    return StorageHelper.createUploadResult(generated, file, 'local', url);
  }

  async delete(filePath: string): Promise<void> {
    const cleanPath = StorageHelper.preventDirectoryTraversal(filePath);
    const fullPath = path.join(this.basePath, cleanPath);

    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
    } catch (error) {
      // File doesn't exist, that's fine for idempotent delete
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getUrl(filePath: string): Promise<string> {
    const cleanPath = StorageHelper.preventDirectoryTraversal(filePath);
    return `${this.baseUrl}/uploads/${cleanPath}`;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Get full local file path for a stored file
   */
  getLocalPath(storedPath: string): string {
    const cleanPath = StorageHelper.preventDirectoryTraversal(storedPath);
    return path.join(this.basePath, cleanPath);
  }

  /**
   * Check if file exists
   */
  async exists(storedPath: string): Promise<boolean> {
    const cleanPath = StorageHelper.preventDirectoryTraversal(storedPath);
    const filePath = path.join(this.basePath, cleanPath);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getStats(storedPath: string): Promise<{ size: number; modified: Date } | null> {
    const cleanPath = StorageHelper.preventDirectoryTraversal(storedPath);
    const filePath = path.join(this.basePath, cleanPath);
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
      };
    } catch {
      return null;
    }
  }
}