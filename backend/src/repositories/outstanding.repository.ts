import { prisma } from '@config/database';
import type { PaymentStatus, Prisma } from '@prisma/client';

export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  creditDays: number;
  customerId: string;
  customerCode: string;
  customerName: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  daysOverdue: number;
  isOverdue: boolean;
}

export interface OutstandingFilters {
  customerId?: string;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  dueDateStart?: Date;
  dueDateEnd?: Date;
  minAmount?: number;
  maxAmount?: number;
  onlyOverdue?: boolean;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface OutstandingSummary {
  totalOutstanding: number;
  totalOverdue: number;
  totalInvoices: number;
  overdueInvoices: number;
  byStatus: Record<PaymentStatus, { count: number; amount: number }>;
  aging: {
    '0-30': { count: number; amount: number };
    '31-60': { count: number; amount: number };
    '61-90': { count: number; amount: number };
    '90+': { count: number; amount: number };
  };
  topCustomers: Array<{
    customerId: string;
    customerCode: string;
    companyName: string;
    outstandingAmount: number;
    invoiceCount: number;
  }>;
}

export interface OutstandingRepository {
  findAll(filters: OutstandingFilters): Promise<{ data: OutstandingInvoice[]; total: number }>;
  getOutstandingByCustomer(customerId: string): Promise<OutstandingInvoice[]>;
  getSummary(): Promise<OutstandingSummary>;
  getAgingReport(customerId?: string): Promise<{
    customerId: string;
    customerCode: string;
    companyName: string;
    totalOutstanding: number;
    aging: {
      '0-30': number;
      '31-60': number;
      '61-90': number;
      '90+': number;
    };
  }[]>;
  getOverdueInvoices(daysOverdue?: number): Promise<OutstandingInvoice[]>;
  getCollectionEfficiency(): Promise<{
    totalInvoiced: number;
    totalCollected: number;
    collectionRate: number;
    averageCollectionDays: number;
  }>;
}

export class OutstandingRepositoryImpl implements OutstandingRepository {
  async findAll(filters: OutstandingFilters): Promise<{ data: OutstandingInvoice[]; total: number }> {
    const { customerId, paymentStatus, startDate, endDate, dueDateStart, dueDateEnd, minAmount, maxAmount, onlyOverdue, page, limit, sort = 'dueDate', order = 'asc' } = filters;

    const now = new Date();

    const where: Prisma.InvoiceWhereInput = {
      status: { not: 'CANCELLED' },
      balanceAmount: { gt: 0 }, // Only outstanding invoices
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startDate;
      if (endDate) where.invoiceDate.lte = endDate;
    }

    if (dueDateStart || dueDateEnd) {
      where.dueDate = {};
      if (dueDateStart) where.dueDate.gte = dueDateStart;
      if (dueDateEnd) where.dueDate.lte = dueDateEnd;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.balanceAmount = {};
      if (minAmount !== undefined) where.balanceAmount.gte = minAmount;
      if (maxAmount !== undefined) where.balanceAmount.lte = maxAmount;
    }

    if (onlyOverdue) {
      where.dueDate = { lt: now };
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const outstandingData: OutstandingInvoice[] = data.map(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const daysOverdue = dueDate && dueDate < now
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate,
        creditDays: inv.creditDays,
        customerId: inv.customerId,
        customerCode: inv.customer.customerCode,
        customerName: inv.customer.companyName,
        grandTotal: Number(inv.grandTotal),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        paymentStatus: inv.paymentStatus,
        daysOverdue,
        isOverdue: daysOverdue > 0,
      };
    });

    return { data: outstandingData, total };
  }

  async getOutstandingByCustomer(customerId: string): Promise<OutstandingInvoice[]> {
    const now = new Date();

    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
        status: { not: 'CANCELLED' },
        balanceAmount: { gt: 0 },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
          },
        },
      },
    });

    return invoices.map(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const daysOverdue = dueDate && dueDate < now
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate,
        creditDays: inv.creditDays,
        customerId: inv.customerId,
        customerCode: inv.customer.customerCode,
        customerName: inv.customer.companyName,
        grandTotal: Number(inv.grandTotal),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        paymentStatus: inv.paymentStatus,
        daysOverdue,
        isOverdue: daysOverdue > 0,
      };
    });
  }

  async getSummary(): Promise<OutstandingSummary> {
    const now = new Date();

    const [
      outstandingAgg,
      overdueAgg,
      statusBreakdown,
      topCustomers,
    ] = await Promise.all([
      // Total outstanding
      prisma.invoice.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
        _count: true,
      }),
      // Total overdue
      prisma.invoice.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
          dueDate: { lt: now },
        },
        _sum: { balanceAmount: true },
        _count: true,
      }),
      // By payment status
      prisma.invoice.groupBy({
        by: ['paymentStatus'],
        where: {
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
        _count: true,
      }),
      // Top customers by outstanding
      prisma.invoice.groupBy({
        by: ['customerId'],
        where: {
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
        _count: true,
        orderBy: { _sum: { balanceAmount: 'desc' } },
        take: 10,
      }),
    ]);

    // Calculate aging
    const agingInvoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' },
        balanceAmount: { gt: 0 },
      },
      select: {
        balanceAmount: true,
        dueDate: true,
        invoiceDate: true,
      },
    });

    const aging = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    for (const inv of agingInvoices) {
      const balance = Number(inv.balanceAmount);
      const referenceDate = inv.dueDate || inv.invoiceDate;
      const daysOverdue = Math.floor((now.getTime() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 30) {
        aging['0-30'].count++;
        aging['0-30'].amount += balance;
      } else if (daysOverdue <= 60) {
        aging['31-60'].count++;
        aging['31-60'].amount += balance;
      } else if (daysOverdue <= 90) {
        aging['61-90'].count++;
        aging['61-90'].amount += balance;
      } else {
        aging['90+'].count++;
        aging['90+'].amount += balance;
      }
    }

    // Build status breakdown
    const byStatus: Record<PaymentStatus, { count: number; amount: number }> = {
      UNPAID: { count: 0, amount: 0 },
      PARTIALLY_PAID: { count: 0, amount: 0 },
      PAID: { count: 0, amount: 0 },
      OVERDUE: { count: 0, amount: 0 },
      CANCELLED: { count: 0, amount: 0 },
    };

    for (const item of statusBreakdown) {
      if (item.paymentStatus in byStatus) {
        byStatus[item.paymentStatus as PaymentStatus] = {
          count: item._count,
          amount: Number(item._sum.balanceAmount ?? 0),
        };
      }
    }

    // Get customer details for top customers
    const customerIds = topCustomers.map(c => c.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, customerCode: true, companyName: true },
    });

    const customerMap = new Map(customers.map(c => [c.id, c]));

    const topCustomersData = topCustomers.map(item => {
      const customer = customerMap.get(item.customerId);
      return {
        customerId: item.customerId,
        customerCode: customer?.customerCode ?? '',
        companyName: customer?.companyName ?? '',
        outstandingAmount: Number(item._sum.balanceAmount ?? 0),
        invoiceCount: item._count,
      };
    });

    return {
      totalOutstanding: Number(outstandingAgg._sum.balanceAmount ?? 0),
      totalOverdue: Number(overdueAgg._sum.balanceAmount ?? 0),
      totalInvoices: outstandingAgg._count,
      overdueInvoices: overdueAgg._count,
      byStatus,
      aging,
      topCustomers: topCustomersData,
    };
  }

  async getAgingReport(customerId?: string): Promise<{
    customerId: string;
    customerCode: string;
    companyName: string;
    totalOutstanding: number;
    aging: {
      '0-30': number;
      '31-60': number;
      '61-90': number;
      '90+': number;
    };
  }[]> {
    const now = new Date();

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    if (customerId) {
      where.id = customerId;
    }

    const customers = await prisma.customer.findMany({
      where,
      select: { id: true, customerCode: true, companyName: true },
    });

    const result = [];

    for (const customer of customers) {
      const invoices = await prisma.invoice.findMany({
        where: {
          customerId: customer.id,
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
        },
        select: { balanceAmount: true, dueDate: true, invoiceDate: true },
      });

      if (invoices.length === 0) continue;

      let totalOutstanding = 0;
      const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

      for (const inv of invoices) {
        const balance = Number(inv.balanceAmount);
        totalOutstanding += balance;

        const referenceDate = inv.dueDate || inv.invoiceDate;
        const daysOverdue = Math.floor((now.getTime() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue <= 30) {
          aging['0-30'] += balance;
        } else if (daysOverdue <= 60) {
          aging['31-60'] += balance;
        } else if (daysOverdue <= 90) {
          aging['61-90'] += balance;
        } else {
          aging['90+'] += balance;
        }
      }

      result.push({
        customerId: customer.id,
        customerCode: customer.customerCode,
        companyName: customer.companyName,
        totalOutstanding,
        aging,
      });
    }

    result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return result;
  }

  async getOverdueInvoices(daysOverdue: number = 0): Promise<OutstandingInvoice[]> {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' },
        balanceAmount: { gt: 0 },
        dueDate: { lt: cutoffDate },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        customer: {
          select: { id: true, customerCode: true, companyName: true },
        },
      },
    });

    return invoices.map(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const daysOverdueCalc = dueDate && dueDate < now
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate,
        creditDays: inv.creditDays,
        customerId: inv.customerId,
        customerCode: inv.customer.customerCode,
        customerName: inv.customer.companyName,
        grandTotal: Number(inv.grandTotal),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        paymentStatus: inv.paymentStatus,
        daysOverdue: daysOverdueCalc,
        isOverdue: daysOverdueCalc > 0,
      };
    });
  }

  async getCollectionEfficiency(): Promise<{
    totalInvoiced: number;
    totalCollected: number;
    collectionRate: number;
    averageCollectionDays: number;
  }> {
    const [
      totalInvoicedAgg,
      totalCollectedAgg,
      collectionDaysAgg,
    ] = await Promise.all([
      // Total invoiced (non-cancelled)
      prisma.invoice.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { grandTotal: true },
      }),
      // Total collected (non-cancelled payments)
      prisma.payment.aggregate({
        where: { isCancelled: false },
        _sum: { amount: true },
      }),
      // Average collection days (for paid invoices)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT AVG(EXTRACT(DAY FROM (p."paymentDate" - i."invoiceDate"))) as avg_days
        FROM "invoices" i
        JOIN "payments" p ON p."invoiceId" = i.id
        WHERE i."status" != 'CANCELLED'
          AND i."paymentStatus" = 'PAID'
          AND p."isCancelled" = false
      `),
    ]);

    const totalInvoiced = Number(totalInvoicedAgg._sum.grandTotal ?? 0);
    const totalCollected = Number(totalCollectedAgg._sum.amount ?? 0);
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
    const averageCollectionDays = collectionDaysAgg[0]?.avg_days ? Number(collectionDaysAgg[0].avg_days) : 0;

    return {
      totalInvoiced,
      totalCollected,
      collectionRate: Math.round(collectionRate * 100) / 100,
      averageCollectionDays: Math.round(averageCollectionDays * 100) / 100,
    };
  }
}

export const outstandingRepository = new OutstandingRepositoryImpl();