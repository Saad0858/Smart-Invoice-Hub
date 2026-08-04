import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    description: z.string().optional(),
  }),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const brandIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid brand ID format'),
  }),
});

export const brandQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>['body'];
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>['body'];
export type BrandIdParam = z.infer<typeof brandIdParamSchema>['params'];
export type BrandQuery = z.infer<typeof brandQuerySchema>['query'];