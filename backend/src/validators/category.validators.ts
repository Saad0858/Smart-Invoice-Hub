import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    description: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID format'),
  }),
});

export const categoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>['params'];
export type CategoryQuery = z.infer<typeof categoryQuerySchema>['query'];