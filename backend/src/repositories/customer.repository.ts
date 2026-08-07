import { prisma } from '@config/database';
import type { Customer, Prisma, CustomerType } from '@prisma/client';

export interface CustomerFilters {
  search?: string;
  customerType?: CustomerType;
  state?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface CustomerRepository {
  findAll(filters: CustomerFilters): Promise<{ data: Customer[]; total: number }>;
  findById(id: string): Promise<Customer | null>;
  findByCustomerCode(customerCode: string, excludeId?: string): Promise<Customer | null>;
  findByGstNumber(gstNumber: string, excludeId?: string): Promise<Customer | null>;
  create(data: Prisma.CustomerCreateInput): Promise<Customer>;
  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer>;
  softDelete(id: string): Promise<Customer>;
  existsById(id: string): Promise<boolean>;
  hasInvoices(customerId: string): Promise<boolean>;
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
  generateCustomerCode(): Promise<string>;
}

export class CustomerRepositoryImpl implements CustomerRepository {
  async findAll(filters: CustomerFilters): Promise<{ data: Customer[]; total: number }> {
    const { search, customerType, state, isActive, page, limit, sort = 'createdAt', order = 'desc' } = filters;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { customerCode: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { panNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (state) {
      where.state = { equals: state, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCustomerCode(customerCode: string, excludeId?: string): Promise<Customer | null> {
    return prisma.customer.findFirst({
      where: {
        customerCode: { equals: customerCode, mode: 'insensitive' },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async findByGstNumber(gstNumber: string, excludeId?: string): Promise<Customer | null> {
    if (!gstNumber) return null;
    return prisma.customer.findFirst({
      where: {
        gstNumber: { equals: gstNumber, mode: 'insensitive' },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return prisma.customer.create({ data });
  }

  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return !!customer;
  }

  async hasInvoices(customerId: string): Promise<boolean> {
    const count = await prisma.invoice.count({
      where: { customerId },
    });
    return count > 0;
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
    const [
      total,
      active,
      inactive,
      business,
      individual,
      creditLimitAggregate,
      openingBalanceAggregate,
      currentBalanceAggregate,
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null, isActive: true } }),
      prisma.customer.count({ where: { deletedAt: null, isActive: false } }),
      prisma.customer.count({ where: { deletedAt: null, customerType: 'BUSINESS' } }),
      prisma.customer.count({ where: { deletedAt: null, customerType: 'INDIVIDUAL' } }),
      prisma.customer.aggregate({
        where: { deletedAt: null },
        _sum: { creditLimit: true },
      }),
      prisma.customer.aggregate({
        where: { deletedAt: null },
        _sum: { openingBalance: true },
      }),
      prisma.customer.aggregate({
        where: { deletedAt: null },
        _sum: { currentBalance: true },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      business,
      individual,
      totalCreditLimit: Number(creditLimitAggregate._sum.creditLimit || 0),
      totalOpeningBalance: Number(openingBalanceAggregate._sum.openingBalance || 0),
      totalCurrentBalance: Number(currentBalanceAggregate._sum.currentBalance || 0),
    };
  }

  async generateCustomerCode(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `CUST${year}`;
    
    // Find the latest customer code for this year (including soft-deleted to avoid conflicts)
    const latestCustomer = await prisma.customer.findFirst({
      where: {
        customerCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        customerCode: 'desc',
      },
      select: {
        customerCode: true,
      },
    });

    let sequence = 1;
    if (latestCustomer) {
      const lastSequence = parseInt(latestCustomer.customerCode.slice(prefix.length), 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // Ensure the generated code is unique (handle race conditions and soft-deleted records)
    let customerCode = `${prefix}${sequence.toString().padStart(4, '0')}`;
    while (await prisma.customer.findUnique({ where: { customerCode } })) {
      sequence++;
      customerCode = `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    return customerCode;
  }
}

export const customerRepository = new CustomerRepositoryImpl();