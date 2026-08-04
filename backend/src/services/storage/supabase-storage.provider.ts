import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, UploadResult } from '@interfaces/storage.provider';
import { env } from '@config/env';
import { StorageHelper } from '@utils/storage-helper';
import { ApiError } from '@utils/api-error';

export class SupabaseStorageProvider implements StorageProvider {
  private readonly client: SupabaseClient;
  private readonly bucketName: string;
  private readonly baseUrl: string;
  private initialized = false;

  constructor() {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key are required for SupabaseStorageProvider');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.bucketName = env.STORAGE_BUCKET_NAME || 'smart-invoice-hub';
    this.baseUrl = `${supabaseUrl}/storage/v1/object/public/${this.bucketName}`;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if bucket exists, create if not
      const { data: buckets } = await this.client.storage.listBuckets();
      const bucketExists = buckets?.some((b: { name: string }) => b.name === this.bucketName);

      if (!bucketExists) {
        const { error } = await this.client.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/svg+xml',
          ],
        });

        if (error) {
          throw new Error(`Failed to create bucket: ${error.message}`);
        }
      }

      this.initialized = true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize Supabase storage: ${error.message}`);
      }
      throw error;
    }
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    await this.initialize();

    const { generated } = StorageHelper.validateAndPrepareUpload(file, folder);

    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(generated.path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      if (error.message.includes('already exists')) {
        throw ApiError.conflict('File already exists');
      }
      throw ApiError.internal(`Upload failed: ${error.message}`);
    }

    const url = `${this.baseUrl}/${generated.path}`;

    return StorageHelper.createUploadResult(generated, file, 'supabase', url);
  }

  async delete(path: string): Promise<void> {
    await this.initialize();

    const cleanPath = StorageHelper.preventDirectoryTraversal(path);

    const { error } = await this.client.storage.from(this.bucketName).remove([cleanPath]);

    if (error) {
      // Don't throw if file doesn't exist (idempotent delete)
      if (!error.message.includes('not found') && !error.message.includes('404')) {
        throw ApiError.internal(`Delete failed: ${error.message}`);
      }
    }
  }

  async getUrl(path: string): Promise<string> {
    await this.initialize();

    const cleanPath = StorageHelper.preventDirectoryTraversal(path);

    const { data } = this.client.storage.from(this.bucketName).getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      throw ApiError.notFound('File not found');
    }

    return data.publicUrl;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Get signed URL for private files (if needed in future)
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    await this.initialize();

    const cleanPath = StorageHelper.preventDirectoryTraversal(path);

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(cleanPath, expiresIn);

    if (error || !data?.signedUrl) {
      throw ApiError.internal(`Failed to create signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string, limit: number = 100, offset: number = 0): Promise<{
    name: string;
    size: number;
    createdAt: string | null;
    updatedAt: string | null;
  }[]> {
    await this.initialize();

    const cleanFolder = StorageHelper.preventDirectoryTraversal(folder);

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .list(cleanFolder, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw ApiError.internal(`Failed to list files: ${error.message}`);
    }

    return (data || []).map((file: { name: string; metadata: { size?: number } | null; created_at: string | null; updated_at: string | null }) => ({
      name: file.name,
      size: file.metadata?.size || 0,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    }));
  }
}