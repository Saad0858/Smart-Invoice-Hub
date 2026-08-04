export interface UploadResult {
  fileName: string;
  originalName: string;
  folder: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  provider: string;
}

export interface StorageProvider {
  upload(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
  getBucketName(): string;
}