import { v4 as uuidv4 } from 'uuid';

export const STORAGE_FOLDERS = {
  COMPANY: 'company',
  PRODUCTS: 'products',
  SIGNATURES: 'signatures',
} as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS];

export interface GeneratedFileName {
  fileName: string;
  folder: string;
  path: string;
  extension: string;
}

export class FileNameGenerator {
  static generate(folder: StorageFolder, _originalName: string, mimeType: string): GeneratedFileName {
    const extension = this.getExtensionFromMimeType(mimeType);
    const uuid = uuidv4().replace(/-/g, '').substring(0, 8);
    const timestamp = Date.now();
    const fileName = `${uuid}_${timestamp}${extension}`;
    const path = `${folder}/${fileName}`;

    return {
      fileName,
      folder,
      path,
      extension,
    };
  }

  static generateForImage(folder: StorageFolder, originalName: string, mimeType: string): GeneratedFileName {
    // For images, we might want to convert to webp for optimization
    // But keep original extension for now as per requirements
    return this.generate(folder, originalName, mimeType);
  }

  static generateForSignature(folder: StorageFolder, originalName: string, mimeType: string): GeneratedFileName {
    return this.generate(folder, originalName, mimeType);
  }

  private static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return mimeToExt[mimeType] || '.bin';
  }

  static parsePath(path: string): { folder: string; fileName: string } | null {
    const parts = path.split('/');
    if (parts.length < 2) {
      return null;
    }
    const folder = parts[0] ?? '';
    const fileName = parts.slice(1).join('/');
    return { folder, fileName };
  }

  static isValidFolder(folder: string): folder is StorageFolder {
    return Object.values(STORAGE_FOLDERS).includes(folder as StorageFolder);
  }

  static sanitizeFolder(folder: string): StorageFolder {
    const normalized = folder.toLowerCase().trim();
    if (this.isValidFolder(normalized)) {
      return normalized;
    }
    // Default to products folder if invalid
    return STORAGE_FOLDERS.PRODUCTS;
  }
}