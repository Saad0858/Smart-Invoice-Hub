import { prisma } from '@config/database';
import type { Prisma, Customer } from '@prisma/client';

export interface LedgerEntry {
  date: Date;
  type: 'INVOICE' | 'PAYMENT' | 'OPENING_BALANCE';
  reference: string; // Invoice number or Payment number
  description: string;
  debit: number; // Amount owed (invoice amount)
  credit: number; // Amount paid
  balance: number; // Running balance
  invoiceId?: string;
  paymentId?: string;
}

export interface CustomerLedger {
  customer: Pick<Customer, 'id' | 'customerCode' | 'companyName' | 'contactPerson' | 'phone' | 'email' | 'address' | 'city' | 'state' | 'gstNumber' | 'openingBalance' | 'currentBalance'>;
  entries: LedgerEntry[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    openingBalance: number;
    closingBalance: number;
    outstandingInvoices: number;
    overdueInvoices: number;
  };
}

export interface LedgerFilters {
  customerId: string;
  startDate?: Date;
  endDate?: Date;
  includeOpeningBalance?: boolean;
}

export interface LedgerRepository {
  getCustomerLedger(filters: LedgerFilters): Promise<CustomerLedger>;
  getCustomerStatement(customerId: string, startDate?: Date, endDate?: Date): Promise<{
    customer: Pick<Customer, 'id' | 'customerCode' | 'companyName' | 'contactPerson' | 'phone' | 'email' | 'address' | 'city' | 'state' | 'gstNumber' | 'openingBalance' | 'currentBalance'>;
    entries: LedgerEntry[];
    summary: {
      totalInvoiced: number;
      totalPaid: number;
      openingBalance: number;
      closingBalance: number;
    };
  }>;
  getOutstandingAging(customerId?: string): Promise<{
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
}

export class LedgerRepositoryImpl implements LedgerRepository {
  async getCustomerLedger(filters: LedgerFilters): Promise<CustomerLedger> {
    const { customerId, startDate, endDate, includeOpeningBalance = true } = filters;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        customerCode: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        gstNumber: true,
        openingBalance: true,
        currentBalance: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get invoices for the customer
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
        status: { not: 'CANCELLED' },
        ...(Object.keys(dateFilter).length > 0 ? { invoiceDate: dateFilter } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        grandTotal: true,
        balanceAmount: true,
        paymentStatus: true,
        dueDate: true,
      },
      orderBy: { invoiceDate: 'asc' },
    });

    // Get payments for the customer
    const payments = await prisma.payment.findMany({
      where: {
        customerId,
        isCancelled: false,
        ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {}),
      },
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
        referenceNumber: true,
        invoiceId: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Build ledger entries
    const entries: LedgerEntry[] = [];
    let runningBalance = Number(customer.openingBalance);

    // Add opening balance entry if requested
    if (includeOpeningBalance && Number(customer.openingBalance) !== 0) {
      entries.push({
        date: startDate || new Date('2000-01-01'),
        type: 'OPENING_BALANCE',
        reference: 'Opening Balance',
        description: 'Opening balance carried forward',
        debit: 0,
        credit: 0,
        balance: runningBalance,
      });
    }

    // Combine and sort all transactions by date
    const transactions: Array<{
      date: Date;
      type: 'INVOICE' | 'PAYMENT';
      data: any;
    }> = [];

    for (const inv of invoices) {
      transactions.push({
        date: inv.invoiceDate,
        type: 'INVOICE',
        data: inv,
      });
    }

    for (const pay of payments) {
      transactions.push({
        date: pay.paymentDate,
        type: 'PAYMENT',
        data: pay,
      });
    }

    // Sort by date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Process transactions
    for (const txn of transactions) {
      if (txn.type === 'INVOICE') {
        const inv = txn.data;
        const invoiceAmount = Number(inv.grandTotal);
        runningBalance += invoiceAmount;

        entries.push({
          date: inv.invoiceDate,
          type: 'INVOICE',
          reference: inv.invoiceNumber,
          description: `Invoice ${inv.invoiceNumber} raised`,
          debit: invoiceAmount,
          credit: 0,
          balance: runningBalance,
          invoiceId: inv.id,
        });
      } else {
        const pay = txn.data;
        const paymentAmount = Number(pay.amount);
        runningBalance -= paymentAmount;

        let description = `Payment received via ${pay.paymentMethod}`;
        if (pay.referenceNumber) {
          description += ` (Ref: ${pay.referenceNumber})`;
        }

        entries.push({
          date: pay.paymentDate,
          type: 'PAYMENT',
          reference: pay.paymentNumber,
          description,
          debit: 0,
          credit: paymentAmount,
          balance: runningBalance,
          paymentId: pay.id,
          invoiceId: pay.invoiceId,
        });
      }
    }

    // Calculate summary
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

    // Get outstanding and overdue invoices
    const outstandingInvoices = invoices.filter(inv => Number(inv.balanceAmount) > 0).length;
    const now = new Date();
    const overdueInvoices = invoices.filter(inv =>
      Number(inv.balanceAmount) > 0 && inv.dueDate && new Date(inv.dueDate) < now
    ).length;

    return {
      customer,
      entries,
      summary: {
        totalInvoiced,
        totalPaid,
        openingBalance: Number(customer.openingBalance),
        closingBalance: runningBalance,
        outstandingInvoices,
        overdueInvoices,
      },
    };
  }

  async getCustomerStatement(customerId: string, startDate?: Date, endDate?: Date): Promise<{
    customer: Pick<Customer, 'id' | 'customerCode' | 'companyName' | 'contactPerson' | 'phone' | 'email' | 'address' | 'city' | 'state' | 'gstNumber' | 'openingBalance' | 'currentBalance'>;
    entries: LedgerEntry[];
    summary: {
      totalInvoiced: number;
      totalPaid: number;
      openingBalance: number;
      closingBalance: number;
    };
  }> {
    const ledger = await this.getCustomerLedger({
      customerId,
      startDate,
      endDate,
      includeOpeningBalance: true,
    });

    return {
      customer: ledger.customer,
      entries: ledger.entries,
      summary: {
        totalInvoiced: ledger.summary.totalInvoiced,
        totalPaid: ledger.summary.totalPaid,
        openingBalance: ledger.summary.openingBalance,
        closingBalance: ledger.summary.closingBalance,
      },
    };
  }

  async getOutstandingAging(customerId?: string): Promise<{
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

    // Get customers with outstanding invoices
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    if (customerId) {
      where.id = customerId;
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        customerCode: true,
        companyName: true,
      },
    });

    const result = [];

    for (const customer of customers) {
      // Get outstanding invoices for this customer
      const invoices = await prisma.invoice.findMany({
        where: {
          customerId: customer.id,
          status: { not: 'CANCELLED' },
          balanceAmount: { gt: 0 },
        },
        select: {
          balanceAmount: true,
          dueDate: true,
          invoiceDate: true,
        },
      });

      if (invoices.length === 0) continue;

      let totalOutstanding = 0;
      const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

      for (const inv of invoices) {
        const balance = Number(inv.balanceAmount);
        totalOutstanding += balance;

        // Calculate aging based on due date or invoice date
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

    // Sort by total outstanding descending
    result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return result;
  }
}

export const ledgerRepository = new LedgerRepositoryImpl();