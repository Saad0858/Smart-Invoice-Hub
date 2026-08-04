import { z } from 'zod';

const CustomerTypeEnum = ['BUSINESS', 'INDIVIDUAL'] as const;

// Indian phone regex: supports +91, 0 prefix, 10-digit mobile, landline with area code
const phoneRegex = /^(\+91[\-\s]?)?[0]?(?:[1-9]\d{9}|[1-9]\d{2}[\-\s]?\d{8})$/;

export const createCustomerSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required').max(200, 'Company name must be at most 200 characters'),
    contactPerson: z.string().max(100, 'Contact person must be at most 100 characters').optional(),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional().or(z.literal('')),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format').optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Invalid phone format (use Indian mobile/landline format)').optional().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().max(100, 'City must be at most 100 characters').optional(),
    state: z.string().max(100, 'State must be at most 100 characters').optional(),
    stateCode: z.string().regex(/^[0-9]{2}$/, 'Invalid state code format (must be 2 digits)').optional().or(z.literal('')),
    country: z.string().max(100, 'Country must be at most 100 characters').default('India').optional(),
    postalCode: z.string().max(10, 'Postal code must be at most 10 characters').optional(),
    customerType: z.enum(CustomerTypeEnum).default('BUSINESS').optional(),
    creditLimit: z.number().min(0, 'Credit limit must be greater than or equal to 0').default(0).optional(),
    openingBalance: z.number().min(0, 'Opening balance must be greater than or equal to 0').default(0).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required').max(200, 'Company name must be at most 200 characters').optional(),
    contactPerson: z.string().max(100, 'Contact person must be at most 100 characters').optional().nullable(),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional().nullable().or(z.literal('')),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format').optional().nullable().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Invalid phone format (use Indian mobile/landline format)').optional().nullable().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
    address: z.string().optional().nullable(),
    city: z.string().max(100, 'City must be at most 100 characters').optional().nullable(),
    state: z.string().max(100, 'State must be at most 100 characters').optional().nullable(),
    stateCode: z.string().regex(/^[0-9]{2}$/, 'Invalid state code format (must be 2 digits)').optional().nullable().or(z.literal('')),
    country: z.string().max(100, 'Country must be at most 100 characters').optional().nullable(),
    postalCode: z.string().max(10, 'Postal code must be at most 10 characters').optional().nullable(),
    customerType: z.enum(CustomerTypeEnum).optional(),
    creditLimit: z.number().min(0, 'Credit limit must be greater than or equal to 0').optional(),
    openingBalance: z.number().min(0, 'Opening balance must be greater than or equal to 0').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format'),
  }),
});

export const customerQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    customerType: z.enum(CustomerTypeEnum).optional(),
    state: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
export type CustomerIdParam = z.infer<typeof customerIdParamSchema>['params'];
export type CustomerQuery = z.infer<typeof customerQuerySchema>['query'];