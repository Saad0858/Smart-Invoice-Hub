export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

export interface ImageOptimizer {
  optimize(
    buffer: Buffer,
    mimeType: string,
    options?: ImageOptimizationOptions
  ): Promise<OptimizedImageResult>;

  /**
   * Generate thumbnail from image
   */
  generateThumbnail(
    buffer: Buffer,
    mimeType: string,
    size: number
  ): Promise<OptimizedImageResult>;

  /**
   * Get image metadata without loading full image
   */
  getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }>;
}

/**
 * No-op image optimizer - returns original image unchanged
 * Used when image optimization is not needed or not available
 */
export class NoOpImageOptimizer implements ImageOptimizer {
  async optimize(
    buffer: Buffer,
    mimeType: string,
    _options?: ImageOptimizationOptions
  ): Promise<OptimizedImageResult> {
    const ext = this.getExtensionFromMime(mimeType);
    return {
      buffer,
      mimeType,
      extension: ext,
      width: 0,
      height: 0,
      size: buffer.length,
      originalSize: buffer.length,
      compressionRatio: 1,
    };
  }

  async generateThumbnail(
    buffer: Buffer,
    mimeType: string,
    _size: number
  ): Promise<OptimizedImageResult> {
    const ext = this.getExtensionFromMime(mimeType);
    return {
      buffer,
      mimeType,
      extension: ext,
      width: 0,
      height: 0,
      size: buffer.length,
      originalSize: buffer.length,
      compressionRatio: 1,
    };
  }

  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      size: buffer.length,
    };
  }

  private getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return mimeToExt[mimeType] || '.bin';
  }
}

/**
 * Factory to create image optimizer based on configuration
 */
export class ImageOptimizerFactory {
  private static optimizer: ImageOptimizer = new NoOpImageOptimizer();

  static getOptimizer(): ImageOptimizer {
    return this.optimizer;
  }

  static setOptimizer(optimizer: ImageOptimizer): void {
    this.optimizer = optimizer;
  }
}