import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format');

export const phoneSchema = z
  .string()
  .regex(
    /^(\+91[\-\s]?)?[0]?(?:[1-9]\d{9}|[1-9]\d{2}[\-\s]?\d{8})$/,
    'Invalid phone format (use Indian mobile/landline format)'
  );

export const dateSchema = z.string().datetime('Invalid date format').optional();

export const booleanSchema = z.coerce.boolean().default(false);
