import { z } from 'zod';

export const uploadImageSchema = z.object({
  query: z.object({
    folder: z
      .enum(['company', 'products', 'signatures'])
      .optional()
      .default('products')
      .describe('Target folder for the upload'),
  }),
});

export const uploadSignatureSchema = z.object({
  query: z.object({}).optional(),
});

export const deleteFileSchema = z.object({
  params: z.object({
    path: z.string().min(1, 'Path is required').describe('File path to delete'),
  }),
});

export const getFileUrlSchema = z.object({
  params: z.object({
    path: z.string().min(1, 'Path is required').describe('File path to get URL for'),
  }),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>['query'];
export type UploadSignatureInput = z.infer<typeof uploadSignatureSchema>['query'];
export type DeleteFileInput = z.infer<typeof deleteFileSchema>['params'];
export type GetFileUrlInput = z.infer<typeof getFileUrlSchema>['params'];