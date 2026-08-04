import { z } from 'zod';

export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.unknown(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.unknown()),
  timestamp: z.string(),
  path: z.string(),
  requestId: z.string().optional(),
});

export const paginationResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});
