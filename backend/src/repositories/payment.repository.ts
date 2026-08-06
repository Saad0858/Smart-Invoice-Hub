import { prisma } from '@config/database';
import type { Payment, PaymentMethod, Prisma, Customer, Invoice } from '@prisma/client';

export interface PaymentFilters {
  search?: string;
  invoiceId?: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  isCancelled?: boolean;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface PaymentWithRelations extends Payment {
  invoice: Pick<Invoice, 'id' | 'invoiceNumber' | 'grandTotal' | 'balanceAmount' | 'paymentStatus'>;
  customer: Pick<Customer, 'id' | 'customerCode' | 'companyName'>;
}

export interface CreatePaymentData {
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  paymentDate: Date;
  amount: Prisma.Decimal;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  remarks?: string | null;
  receivedBy?: string | null;
  createdBy?: string | null;
}

export interface PaymentRepository {
  findAll(filters: PaymentFilters): Promise<{ data: PaymentWithRelations[]; total: number }>;
  findById(id: string): Promise<PaymentWithRelations | null>;
  findByPaymentNumber(paymentNumber: string): Promise<Payment | null>;
  findByInvoiceId(invoiceId: string): Promise<PaymentWithRelations[]>;
  findByCustomerId(customerId: string): Promise<PaymentWithRelations[]>;
  create(data: CreatePaymentData): Promise<PaymentWithRelations>;
  update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment>;
  cancel(id: string, cancelledReason: string, updatedBy?: string): Promise<Payment>;
  existsById(id: string): Promise<boolean>;
  getNextPaymentNumber(): Promise<string>;
  getStatistics(): Promise<{
    total: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, { count: number; amount: number }>;
    todayCollection: number;
    thisMonthCollection: number;
    thisYearCollection: number;
  }>;
  getPaymentMethodDistribution(startDate?: Date, endDate?: Date): Promise<Array<{ method: PaymentMethod; count: number; amount: number }>>;
  getCollectionTrend(interval: 'daily' | 'weekly' | 'monthly', startDate?: Date, endDate?: Date): Promise<Array<{ period: string; amount: number; count: number }>>;
}

export class PaymentRepositoryImpl implements PaymentRepository {
  async findAll(filters: PaymentFilters): Promise<{ data: PaymentWithRelations[]; total: number }> {
    const { search, invoiceId, customerId, paymentMethod, startDate, endDate, isCancelled, page, limit, sort = 'createdAt', order = 'desc' } = filters;

    const where: Prisma.PaymentWhereInput = {};

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (isCancelled !== undefined) {
      where.isCancelled = isCancelled;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = startDate;
      }
      if (endDate) {
        where.paymentDate.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              grandTotal: true,
              balanceAmount: true,
              paymentStatus: true,
            },
          },
          customer: {
            select: {
              id: true,
              customerCode: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<PaymentWithRelations | null> {
    return prisma.payment.findFirst({
      where: { id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
          },
        },
      },
    });
  }

  async findByPaymentNumber(paymentNumber: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { paymentNumber },
    });
  }

  async findByInvoiceId(invoiceId: string): Promise<PaymentWithRelations[]> {
    return prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'asc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
          },
        },
      },
    });
  }

  async findByCustomerId(customerId: string): Promise<PaymentWithRelations[]> {
    return prisma.payment.findMany({
      where: { customerId },
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
          },
        },
      },
    });
  }

  async create(data: CreatePaymentData): Promise<PaymentWithRelations> {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              grandTotal: true,
              balanceAmount: true,
              paymentStatus: true,
            },
          },
          customer: {
            select: {
              id: true,
              customerCode: true,
              companyName: true,
            },
          },
        },
      });

      return payment;
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
          },
        },
      },
    });
  }

  async cancel(id: string, cancelledReason: string, updatedBy?: string): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledReason,
        updatedBy,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
          },
        },
      },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const payment = await prisma.payment.findFirst({
      where: { id },
      select: { id: true },
    });
    return !!payment;
  }

  async getNextPaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}`;

    const lastPayment = await prisma.payment.findFirst({
      where: {
        paymentNumber: { startsWith: prefix },
      },
      orderBy: { paymentNumber: 'desc' },
      select: { paymentNumber: true },
    });

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(lastPayment.paymentNumber.split('-').pop() || '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
  }

  async getStatistics(): Promise<{
    total: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, { count: number; amount: number }>;
    todayCollection: number;
    thisMonthCollection: number;
    thisYearCollection: number;
  }> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const [
      totalStats,
      todayStats,
      monthStats,
      yearStats,
      methodStats,
    ] = await Promise.all([
      // Total payments and amount (non-cancelled)
      prisma.payment.aggregate({
        where: { isCancelled: false },
        _sum: { amount: true },
        _count: true,
      }),
      // Today's collection
      prisma.payment.aggregate({
        where: {
          isCancelled: false,
          paymentDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
      // This month collection
      prisma.payment.aggregate({
        where: {
          isCancelled: false,
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // This year collection
      prisma.payment.aggregate({
        where: {
          isCancelled: false,
          paymentDate: { gte: startOfYear, lte: endOfYear },
        },
        _sum: { amount: true },
      }),
      // By payment method
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { isCancelled: false },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const byMethod: Record<PaymentMethod, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      BANK_TRANSFER: { count: 0, amount: 0 },
      CHEQUE: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      OTHER: { count: 0, amount: 0 },
    };

    for (const item of methodStats) {
      if (item.paymentMethod in byMethod) {
        byMethod[item.paymentMethod as PaymentMethod] = {
          count: item._count,
          amount: Number(item._sum.amount ?? 0),
        };
      }
    }

    return {
      total: totalStats._count,
      totalAmount: Number(totalStats._sum.amount ?? 0),
      byMethod,
      todayCollection: Number(todayStats._sum.amount ?? 0),
      thisMonthCollection: Number(monthStats._sum.amount ?? 0),
      thisYearCollection: Number(yearStats._sum.amount ?? 0),
    };
  }

  async getPaymentMethodDistribution(startDate?: Date, endDate?: Date): Promise<Array<{ method: PaymentMethod; count: number; amount: number }>> {
    const where: Prisma.PaymentWhereInput = { isCancelled: false };

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = startDate;
      if (endDate) where.paymentDate.lte = endDate;
    }

    const methodStats = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return methodStats.map(item => ({
      method: item.paymentMethod,
      count: item._count,
      amount: Number(item._sum.amount ?? 0),
    }));
  }

  async getCollectionTrend(interval: 'daily' | 'weekly' | 'monthly', startDate?: Date, endDate?: Date): Promise<Array<{ period: string; amount: number; count: number }>> {
    const now = new Date();
    const defaultEndDate = endDate ?? now;
    const defaultStartDate = startDate ?? new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const intervalFormat = interval === 'daily' ? 'day' : interval === 'weekly' ? 'week' : 'month';

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        date_trunc($1, "paymentDate") as period,
        COALESCE(SUM("amount"), 0) as amount,
        COUNT(*) as count
      FROM "payments"
      WHERE "paymentDate" >= $2
        AND "paymentDate" <= $3
        AND "isCancelled" = false
      GROUP BY date_trunc($1, "paymentDate")
      ORDER BY period ASC
    `, intervalFormat, defaultStartDate, defaultEndDate);

    return results.map((row): { period: string; amount: number; count: number } => {
      const period = row.period != null ? String(new Date(row.period).toISOString().split('T')[0]) : '';
      return {
        period,
        amount: Number(row.amount),
        count: Number(row.count),
      };
    });
  }
}

export const paymentRepository = new PaymentRepositoryImpl();