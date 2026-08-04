import { z } from 'zod';

export const updateCompanySettingsSchema = z.object({
  body: z.object({
    companyName: z.string().max(200).optional(),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional(),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format').optional(),
    cinNumber: z.string().max(50).optional(),
    phone: z.string().regex(/^[\+]?[()]?[0-9]{1,3}[)]?[-\s\.]?[()]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{4,10}$/, 'Invalid phone number format').optional(),
    email: z.string().email('Invalid email format').optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    stateCode: z.string().regex(/^[0-9]{2}$/, 'Invalid state code format (must be 2 digits)').optional(),
    postalCode: z.string().max(10).optional(),
    country: z.string().max(100).optional(),
    logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
    bankName: z.string().max(200).optional(),
    branch: z.string().max(200).optional(),
    accountHolder: z.string().max(200).optional(),
    accountNumber: z.string().max(50).optional(),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional(),
    upiId: z.string().regex(/^[a-zA-Z0-9.\-]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI ID format').optional(),
    digitalSignature: z.string().optional(),
    invoicePrefix: z.string().max(10).optional(),
    invoiceSuffix: z.string().max(10).optional(),
    nextInvoiceNumber: z.number().int().min(1).optional(),
    invoiceFooter: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex)').optional(),
  }),
});

export const uploadLogoSchema = z.object({
  body: z.object({
    logoUrl: z.string().url('Invalid logo URL'),
  }),
});

export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>['body'];
export type UploadLogoInput = z.infer<typeof uploadLogoSchema>['body'];