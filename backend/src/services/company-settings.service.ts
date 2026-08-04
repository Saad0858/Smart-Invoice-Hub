import { companySettingsRepository } from '@repositories/company-settings.repository';
import type { CompanySettings } from '@prisma/client';
import { ApiError } from '@utils/api-error';

export interface UpdateCompanySettingsInput {
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  logoUrl?: string;
  bankName?: string;
  branch?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  digitalSignature?: string;
  invoicePrefix?: string;
  invoiceSuffix?: string;
  nextInvoiceNumber?: number;
  invoiceFooter?: string;
  primaryColor?: string;
}

export interface CompanySettingsService {
  getSettings(): Promise<CompanySettings | null>;
  updateSettings(data: UpdateCompanySettingsInput, updatedBy: string): Promise<CompanySettings>;
  updateLogo(logoUrl: string, updatedBy: string): Promise<CompanySettings>;
}

export class CompanySettingsServiceImpl implements CompanySettingsService {
  async getSettings(): Promise<CompanySettings | null> {
    return companySettingsRepository.find();
  }

  async updateSettings(
    data: UpdateCompanySettingsInput,
    updatedBy: string
  ): Promise<CompanySettings> {
    const settings = await companySettingsRepository.find();

    if (!settings) {
      throw ApiError.notFound('Company settings not found');
    }

    // Validate GST number format if provided
    if (data.gstNumber && data.gstNumber !== settings.gstNumber) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(data.gstNumber)) {
        throw ApiError.badRequest('Invalid GST number format');
      }
    }

    // Validate PAN number format if provided
    if (data.panNumber && data.panNumber !== settings.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(data.panNumber)) {
        throw ApiError.badRequest('Invalid PAN number format');
      }
    }

    // Validate email format if provided
    if (data.email && data.email !== settings.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw ApiError.badRequest('Invalid email format');
      }
    }

    // Validate website URL if provided
    if (data.website && data.website !== settings.website) {
      try {
        new URL(data.website);
      } catch {
        throw ApiError.badRequest('Invalid website URL');
      }
    }

    // Validate IFSC code if provided
    if (data.ifscCode && data.ifscCode !== settings.ifscCode) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(data.ifscCode)) {
        throw ApiError.badRequest('Invalid IFSC code format');
      }
    }

    // Validate UPI ID if provided
    if (data.upiId && data.upiId !== settings.upiId) {
      const upiRegex = /^[a-zA-Z0-9.\-]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(data.upiId)) {
        throw ApiError.badRequest('Invalid UPI ID format');
      }
    }

    // Validate phone number if provided
    if (data.phone && data.phone !== settings.phone) {
      const phoneRegex = /^[\+]?[()]?[0-9]{1,3}[)]?[-\s\.]?[()]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(data.phone)) {
        throw ApiError.badRequest('Invalid phone number format');
      }
    }

    // Validate state code if provided
    if (data.stateCode && data.stateCode !== settings.stateCode) {
      const stateCodeRegex = /^[0-9]{2}$/;
      if (!stateCodeRegex.test(data.stateCode)) {
        throw ApiError.badRequest('Invalid state code format (must be 2 digits)');
      }
    }

    return companySettingsRepository.update({
      ...data,
      updatedBy,
    });
  }

  async updateLogo(logoUrl: string, updatedBy: string): Promise<CompanySettings> {
    return companySettingsRepository.update({
      logoUrl,
      updatedBy,
    });
  }
}

export const companySettingsService = new CompanySettingsServiceImpl();