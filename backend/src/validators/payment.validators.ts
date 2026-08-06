import { z } from 'zod';

const PAYMENT_METHOD_ENUM = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'] as const;
const PAYMENT_STATUS_ENUM = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

export const createPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid('Invalid invoice ID format'),
    paymentDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid payment date format (use YYYY-MM-DD)'
    ),
    amount: z.number().positive('Amount must be greater than 0'),
    paymentMethod: z.enum(PAYMENT_METHOD_ENUM),
    referenceNumber: z.string().max(100, 'Reference number must be at most 100 characters').optional().nullable(),
    remarks: z.string().max(2000, 'Remarks must be at most 2000 characters').optional().nullable(),
    receivedBy: z.string().max(100, 'Received by must be at most 100 characters').optional().nullable(),
  }).refine(
    (data) => {
      // Validate reference number for certain payment methods
      const methodsRequiringRef = ['UPI', 'BANK_TRANSFER', 'CHEQUE'];
      if (methodsRequiringRef.includes(data.paymentMethod) && (!data.referenceNumber || data.referenceNumber.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Reference number is required for UPI, BANK_TRANSFER, and CHEQUE payments',
      path: ['referenceNumber'],
    }
  ),
});

export const updatePaymentSchema = z.object({
  body: z.object({
    paymentDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid payment date format (use YYYY-MM-DD)'
    ).optional(),
    amount: z.number().positive('Amount must be greater than 0').optional(),
    paymentMethod: z.enum(PAYMENT_METHOD_ENUM).optional(),
    referenceNumber: z.string().max(100, 'Reference number must be at most 100 characters').optional().nullable(),
    remarks: z.string().max(2000, 'Remarks must be at most 2000 characters').optional().nullable(),
    receivedBy: z.string().max(100, 'Received by must be at most 100 characters').optional().nullable(),
  }).refine(
    (data) => {
      // Validate reference number for certain payment methods if paymentMethod is provided
      if (data.paymentMethod) {
        const methodsRequiringRef = ['UPI', 'BANK_TRANSFER', 'CHEQUE'];
        if (methodsRequiringRef.includes(data.paymentMethod) && (!data.referenceNumber || data.referenceNumber.trim() === '')) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Reference number is required for UPI, BANK_TRANSFER, and CHEQUE payments',
      path: ['referenceNumber'],
    }
  ),
});

export const cancelPaymentSchema = z.object({
  body: z.object({
    cancelledReason: z.string().min(1, 'Cancellation reason is required').max(500, 'Reason must be at most 500 characters'),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment ID format'),
  }),
});

export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    invoiceId: z.string().uuid('Invalid invoice ID format').optional(),
    customerId: z.string().uuid('Invalid customer ID format').optional(),
    paymentMethod: z.enum(PAYMENT_METHOD_ENUM).optional(),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid start date format (use YYYY-MM-DD)'
    ).optional(),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid end date format (use YYYY-MM-DD)'
    ).optional(),
    isCancelled: z.coerce.boolean().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const invoicePaymentsParamSchema = z.object({
  params: z.object({
    invoiceId: z.string().uuid('Invalid invoice ID format'),
  }),
});

export const customerPaymentsParamSchema = z.object({
  params: z.object({
    customerId: z.string().uuid('Invalid customer ID format'),
  }),
});

export const ledgerQuerySchema = z.object({
  query: z.object({
    customerId: z.string().uuid('Invalid customer ID format'),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid start date format (use YYYY-MM-DD)'
    ).optional(),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid end date format (use YYYY-MM-DD)'
    ).optional(),
    includeOpeningBalance: z.coerce.boolean().default(true),
  }),
});

export const statementQuerySchema = z.object({
  query: z.object({
    customerId: z.string().uuid('Invalid customer ID format'),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid start date format (use YYYY-MM-DD)'
    ).optional(),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid end date format (use YYYY-MM-DD)'
    ).optional(),
  }),
});

export const outstandingQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    customerId: z.string().uuid('Invalid customer ID format').optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_ENUM).optional(),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid start date format (use YYYY-MM-DD)'
    ).optional(),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid end date format (use YYYY-MM-DD)'
    ).optional(),
    dueDateStart: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid due date start format (use YYYY-MM-DD)'
    ).optional(),
    dueDateEnd: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid due date end format (use YYYY-MM-DD)'
    ).optional(),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    onlyOverdue: z.coerce.boolean().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const agingQuerySchema = z.object({
  query: z.object({
    customerId: z.string().uuid('Invalid customer ID format').optional(),
  }),
});

export const overdueQuerySchema = z.object({
  query: z.object({
    daysOverdue: z.coerce.number().int().min(0).default(0),
  }),
});

// Re-export customerIdParamSchema from customer.validators
export { customerIdParamSchema } from './customer.validators';
export type { CustomerIdParam } from './customer.validators';

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>['body'];
export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>['body'];
export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>['params'];
export type PaymentQuery = z.infer<typeof paymentQuerySchema>['query'];
export type InvoicePaymentsParam = z.infer<typeof invoicePaymentsParamSchema>['params'];
export type CustomerPaymentsParam = z.infer<typeof customerPaymentsParamSchema>['params'];
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>['query'];
export type StatementQuery = z.infer<typeof statementQuerySchema>['query'];
export type OutstandingQuery = z.infer<typeof outstandingQuerySchema>['query'];
export type AgingQuery = z.infer<typeof agingQuerySchema>['query'];
export type OverdueQuery = z.infer<typeof overdueQuerySchema>['query'];
// export type CustomerIdParam = z.infer<typeof customerIdParamSchema>['params']; // Re-exported from customer.validators