import { z } from 'zod';

const INVOICE_STATUS_ENUM = ['DRAFT', 'GENERATED', 'CANCELLED'] as const;

export const invoiceItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be greater than or equal to 0'),
  discount: z.number().min(0, 'Discount must be greater than or equal to 0').default(0).optional(),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID format'),
    invoiceDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid invoice date format (use YYYY-MM-DD)'
    ),
    dueDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid due date format (use YYYY-MM-DD)'
    ).optional().nullable(),
    discountAmount: z.number().min(0, 'Discount amount must be greater than or equal to 0').default(0).optional(),
    transportCharges: z.number().min(0, 'Transport charges must be greater than or equal to 0').default(0).optional(),
    otherCharges: z.number().min(0, 'Other charges must be greater than or equal to 0').default(0).optional(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional().nullable(),
    terms: z.string().max(2000, 'Terms must be at most 2000 characters').optional().nullable(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  }).refine(
    (data) => {
      // Validate each item's discount doesn't exceed line amount
      for (const item of data.items) {
        const lineAmount = item.quantity * item.unitPrice;
        const discount = item.discount ?? 0;
        if (discount > lineAmount) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Discount cannot exceed line amount (quantity × unit price) for any item',
      path: ['items'],
    }
  ),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    dueDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid due date format (use YYYY-MM-DD)'
    ).optional().nullable(),
    discountAmount: z.number().min(0, 'Discount amount must be greater than or equal to 0').optional(),
    transportCharges: z.number().min(0, 'Transport charges must be greater than or equal to 0').optional(),
    otherCharges: z.number().min(0, 'Other charges must be greater than or equal to 0').optional(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional().nullable(),
    terms: z.string().max(2000, 'Terms must be at most 2000 characters').optional().nullable(),
    status: z.enum(INVOICE_STATUS_ENUM).optional(),
  }),
});

export const invoiceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID format'),
  }),
});

export const invoiceQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    customerId: z.string().uuid('Invalid customer ID format').optional(),
    status: z.enum(INVOICE_STATUS_ENUM).optional(),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid start date format (use YYYY-MM-DD)'
    ).optional(),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid end date format (use YYYY-MM-DD)'
    ).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const duplicateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID format'),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>['params'];
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>['query'];
export type DuplicateInvoiceParam = z.infer<typeof duplicateInvoiceSchema>['params'];