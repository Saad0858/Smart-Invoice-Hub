import { customerRepository } from '@repositories/customer.repository';
import type { Customer, CustomerType } from '@prisma/client';
import { ApiError } from '@utils/api-error';

export interface CreateCustomerInput {
  companyName: string;
  contactPerson?: string;
  gstNumber?: string;
  panNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  postalCode?: string;
  customerType?: CustomerType;
  creditLimit?: number;
  openingBalance?: number;
  createdBy?: string;
}

export interface UpdateCustomerInput {
  companyName?: string;
  contactPerson?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  country?: string | null;
  postalCode?: string | null;
  customerType?: CustomerType;
  creditLimit?: number;
  openingBalance?: number;
  isActive?: boolean;
  updatedBy?: string;
}

export interface CustomerService {
  getAll(
    page: number,
    limit: number,
    search?: string,
    customerType?: string,
    state?: string,
    isActive?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Customer[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>;
  getById(id: string): Promise<Customer | null>;
  create(input: CreateCustomerInput): Promise<Customer>;
  update(id: string, input: UpdateCustomerInput): Promise<Customer>;
  delete(id: string): Promise<void>;
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    business: number;
    individual: number;
    totalCreditLimit: number;
    totalOpeningBalance: number;
    totalCurrentBalance: number;
  }>;
}

export class CustomerServiceImpl implements CustomerService {
  async getAll(
    page: number,
    limit: number,
    search?: string,
    customerType?: string,
    state?: string,
    isActive?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Customer[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
    const { data, total } = await customerRepository.findAll({
      page,
      limit,
      search,
      customerType: customerType as CustomerType | undefined,
      state,
      isActive,
      sort,
      order: order || 'desc',
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string): Promise<Customer | null> {
    return customerRepository.findById(id);
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    // Auto-generate unique customer code
    const customerCode = await customerRepository.generateCustomerCode();

    // Validate GST number uniqueness if provided
    if (input.gstNumber) {
      const existingGst = await customerRepository.findByGstNumber(input.gstNumber);
      if (existingGst) {
        throw ApiError.conflict('Customer with this GST number already exists');
      }
    }

    // Validate credit limit >= 0
    if (input.creditLimit !== undefined && input.creditLimit < 0) {
      throw ApiError.badRequest('Credit limit must be greater than or equal to 0');
    }

    // Validate opening balance >= 0
    if (input.openingBalance !== undefined && input.openingBalance < 0) {
      throw ApiError.badRequest('Opening balance must be greater than or equal to 0');
    }

    return customerRepository.create({
      customerCode,
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      gstNumber: input.gstNumber,
      panNumber: input.panNumber,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      state: input.state,
      stateCode: input.stateCode,
      country: input.country || 'India',
      postalCode: input.postalCode,
      customerType: input.customerType || 'BUSINESS',
      creditLimit: input.creditLimit || 0,
      openingBalance: input.openingBalance || 0,
      currentBalance: input.openingBalance || 0,
      createdBy: input.createdBy,
    });
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const customer = await customerRepository.findById(id);

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Validate customerCode uniqueness if changed (note: customerCode is not in update input as it's unique and shouldn't change)

    // Validate GST number uniqueness if changed
    if (input.gstNumber !== undefined && input.gstNumber !== null && input.gstNumber !== customer.gstNumber) {
      const existingGst = await customerRepository.findByGstNumber(input.gstNumber, id);
      if (existingGst) {
        throw ApiError.conflict('Customer with this GST number already exists');
      }
    }

    // Validate credit limit >= 0 if provided
    if (input.creditLimit !== undefined && input.creditLimit < 0) {
      throw ApiError.badRequest('Credit limit must be greater than or equal to 0');
    }

    // Validate opening balance >= 0 if provided
    if (input.openingBalance !== undefined && input.openingBalance < 0) {
      throw ApiError.badRequest('Opening balance must be greater than or equal to 0');
    }

    // Prepare update data, handling nullable fields
    const updateData: Record<string, unknown> = {};

    if (input.companyName !== undefined) updateData.companyName = input.companyName;
    if (input.contactPerson !== undefined) updateData.contactPerson = input.contactPerson;
    if (input.gstNumber !== undefined) updateData.gstNumber = input.gstNumber;
    if (input.panNumber !== undefined) updateData.panNumber = input.panNumber;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.stateCode !== undefined) updateData.stateCode = input.stateCode;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.postalCode !== undefined) updateData.postalCode = input.postalCode;
    if (input.customerType !== undefined) updateData.customerType = input.customerType;
    if (input.creditLimit !== undefined) updateData.creditLimit = input.creditLimit;
    if (input.openingBalance !== undefined) updateData.openingBalance = input.openingBalance;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.updatedBy !== undefined) updateData.updatedBy = input.updatedBy;

    return customerRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    const customer = await customerRepository.findById(id);

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Check if customer has associated invoices
    const hasInvoices = await customerRepository.hasInvoices(id);
    if (hasInvoices) {
      throw ApiError.conflict('Cannot delete customer with associated invoices');
    }

    await customerRepository.softDelete(id);
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    business: number;
    individual: number;
    totalCreditLimit: number;
    totalOpeningBalance: number;
    totalCurrentBalance: number;
  }> {
    return customerRepository.getStatistics();
  }
}

export const customerService = new CustomerServiceImpl();