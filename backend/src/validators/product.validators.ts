import { z } from 'zod';

// GST Rate enum from Prisma schema
const GSTRateEnum = ['ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTY_EIGHT'] as const;

// Product Unit enum from Prisma schema
const ProductUnitEnum = ['PCS', 'KG', 'GRAM', 'LTR', 'ML', 'BOX', 'BAG', 'ROLL', 'MTR', 'SQFT', 'TON'] as const;

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be at most 50 characters'),
    barcode: z.string().max(50, 'Barcode must be at most 50 characters').optional(),
    name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
    description: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    brandId: z.string().uuid('Invalid brand ID format').optional(),
    hsnCode: z.string().min(1, 'HSN code is required').max(20, 'HSN code must be at most 20 characters'),
    gstRate: z.enum(GSTRateEnum),
    unit: z.enum(ProductUnitEnum),
    sellingPrice: z.number().positive('Selling price must be greater than 0'),
    openingStock: z.number().min(0, 'Opening stock must be greater than or equal to 0').default(0).optional(),
    minStock: z.number().min(0, 'Minimum stock must be greater than or equal to 0').default(0).optional(),
    imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
    searchKeywords: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be at most 50 characters').optional(),
    barcode: z.string().max(50, 'Barcode must be at most 50 characters').optional().nullable(),
    name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters').optional(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid('Invalid category ID format').optional().nullable(),
    brandId: z.string().uuid('Invalid brand ID format').optional().nullable(),
    hsnCode: z.string().min(1, 'HSN code is required').max(20, 'HSN code must be at most 20 characters').optional(),
    gstRate: z.enum(GSTRateEnum).optional(),
    unit: z.enum(ProductUnitEnum).optional(),
    sellingPrice: z.number().positive('Selling price must be greater than 0').optional(),
    minStock: z.number().min(0, 'Minimum stock must be greater than or equal to 0').optional(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
    searchKeywords: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    brandId: z.string().uuid('Invalid brand ID format').optional(),
    gstRate: z.enum(GSTRateEnum).optional(),
    isActive: z.coerce.boolean().optional(),
    lowStock: z.coerce.boolean().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductIdParam = z.infer<typeof productIdParamSchema>['params'];
export type ProductQuery = z.infer<typeof productQuerySchema>['query'];