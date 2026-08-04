import { prisma } from '@config/database';
import type { Invoice, InvoiceItem, InvoiceStatus, Prisma, InvoiceSequence, Customer, Product } from '@prisma/client';

export interface InvoiceFilters {
  search?: string;
  customerId?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface InvoiceWithRelations extends Invoice {
  customer: Customer;
  items: (InvoiceItem & { product: Product | null })[];
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  customerId: string;
  subtotal: Prisma.Decimal;
  taxableAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  transportCharges: Prisma.Decimal;
  otherCharges: Prisma.Decimal;
  cgstAmount: Prisma.Decimal;
  sgstAmount: Prisma.Decimal;
  igstAmount: Prisma.Decimal;
  totalGstAmount: Prisma.Decimal;
  roundOff: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  status: InvoiceStatus;
  notes?: string | null;
  terms?: string | null;
  createdBy?: string | null;
}

export interface CreateInvoiceItemData {
  invoiceId: string;
  productId?: string | null;
  sku: string;
  productName: string;
  hsnCode: string;
  unit: Product['unit'];
  gstRate: Product['gstRate'];
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  discount: Prisma.Decimal;
  taxableAmount: Prisma.Decimal;
  cgstAmount: Prisma.Decimal;
  sgstAmount: Prisma.Decimal;
  igstAmount: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

export interface InvoiceRepository {
  findAll(filters: InvoiceFilters): Promise<{ data: InvoiceWithRelations[]; total: number }>;
  findById(id: string): Promise<InvoiceWithRelations | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  create(data: CreateInvoiceData, items: CreateInvoiceItemData[]): Promise<InvoiceWithRelations>;
  update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice>;
  updateStatus(id: string, status: InvoiceStatus, updatedBy?: string): Promise<Invoice>;
  softDelete(id: string): Promise<Invoice>;
  existsById(id: string): Promise<boolean>;
  getNextInvoiceNumber(prefix: string): Promise<string>;
  incrementInvoiceSequence(year: number, prefix: string): Promise<InvoiceSequence>;
  getInvoiceSequence(year: number): Promise<InvoiceSequence | null>;
  getStatistics(): Promise<{
    total: number;
    draft: number;
    generated: number;
    cancelled: number;
    totalAmount: number;
    totalGstAmount: number;
    thisMonth: number;
    thisMonthAmount: number;
  }>;
  getInvoiceWithItems(id: string): Promise<InvoiceWithRelations | null>;
  cancelInvoice(id: string, updatedBy?: string): Promise<InvoiceWithRelations>;
  duplicateInvoice(id: string, createdBy: string): Promise<InvoiceWithRelations>;
}

export class InvoiceRepositoryImpl implements InvoiceRepository {
  async findAll(filters: InvoiceFilters): Promise<{ data: InvoiceWithRelations[]; total: number }> {
    const { search, customerId, status, startDate, endDate, page, limit, sort = 'createdAt', order = 'desc' } = filters;

    const where: Prisma.InvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = startDate;
      }
      if (endDate) {
        where.invoiceDate.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<InvoiceWithRelations | null> {
    return prisma.invoice.findFirst({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return prisma.invoice.findFirst({
      where: { invoiceNumber },
    });
  }

  async create(data: CreateInvoiceData, items: CreateInvoiceItemData[]): Promise<InvoiceWithRelations> {
    return prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
        data,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create invoice items
      if (items.length > 0) {
        await tx.invoiceItem.createMany({
          data: items,
        });
      }

      // Fetch the complete invoice with items
      const createdInvoice = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return createdInvoice!;
    });
  }

  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateStatus(id: string, status: InvoiceStatus, updatedBy?: string): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        status,
        updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const invoice = await prisma.invoice.findFirst({
      where: { id },
      select: { id: true },
    });
    return !!invoice;
  }

  async getNextInvoiceNumber(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await this.getInvoiceSequence(year);

    let nextNumber = 1;
    if (sequence) {
      nextNumber = sequence.current + 1;
    }

    return `${prefix}-${year}-${nextNumber.toString().padStart(6, '0')}`;
  }

  async incrementInvoiceSequence(year: number, prefix: string): Promise<InvoiceSequence> {
    return prisma.invoiceSequence.upsert({
      where: { year },
      create: {
        year,
        prefix,
        current: 1,
      },
      update: {
        current: { increment: 1 },
      },
    });
  }

  async getInvoiceSequence(year: number): Promise<InvoiceSequence | null> {
    return prisma.invoiceSequence.findUnique({
      where: { year },
    });
  }

  async getStatistics(): Promise<{
    total: number;
    draft: number;
    generated: number;
    cancelled: number;
    totalAmount: number;
    totalGstAmount: number;
    thisMonth: number;
    thisMonthAmount: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      total,
      draft,
      generated,
      cancelled,
      totalAmountAgg,
      totalGstAmountAgg,
      thisMonth,
      thisMonthAmountAgg,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'DRAFT' } }),
      prisma.invoice.count({ where: { status: 'GENERATED' } }),
      prisma.invoice.count({ where: { status: 'CANCELLED' } }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
      }),
      prisma.invoice.aggregate({
        _sum: { totalGstAmount: true },
      }),
      prisma.invoice.count({
        where: {
          invoiceDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { grandTotal: true },
      }),
    ]);

    return {
      total,
      draft,
      generated,
      cancelled,
      totalAmount: Number(totalAmountAgg._sum.grandTotal ?? 0),
      totalGstAmount: Number(totalGstAmountAgg._sum.totalGstAmount ?? 0),
      thisMonth,
      thisMonthAmount: Number(thisMonthAmountAgg._sum.grandTotal ?? 0),
    };
  }

  async getInvoiceWithItems(id: string): Promise<InvoiceWithRelations | null> {
    return this.findById(id);
  }

  async cancelInvoice(id: string, updatedBy?: string): Promise<InvoiceWithRelations> {
    return prisma.$transaction(async (tx) => {
      // Get invoice with items to restore stock
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Invoice is already cancelled');
      }

      // Restore stock for each item
      for (const item of invoice.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { increment: Number(item.quantity) },
            },
          });
        }
      }

      // Update invoice status to CANCELLED
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedBy,
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return updatedInvoice;
    });
  }

  async duplicateInvoice(id: string, createdBy: string): Promise<InvoiceWithRelations> {
    return prisma.$transaction(async (tx) => {
      // Get original invoice with items
      const originalInvoice = await tx.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
        },
      });

      if (!originalInvoice) {
        throw new Error('Invoice not found');
      }

      // Get company settings for next invoice number
      const companySettings = await tx.companySettings.findFirst();
      if (!companySettings) {
        throw new Error('Company settings not found');
      }

      // Get next invoice number
      const year = new Date().getFullYear();
      const sequence = await tx.invoiceSequence.upsert({
        where: { year },
        create: {
          year,
          prefix: companySettings.invoicePrefix,
          current: 1,
        },
        update: {
          current: { increment: 1 },
        },
      });

      const invoiceNumber = `${companySettings.invoicePrefix}-${year}-${sequence.current.toString().padStart(6, '0')}`;

      // Create new invoice with DRAFT status
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate: new Date(), // Use current date for duplicate
          dueDate: originalInvoice.dueDate,
          customerId: originalInvoice.customerId,
          subtotal: originalInvoice.subtotal,
          taxableAmount: originalInvoice.taxableAmount,
          discountAmount: originalInvoice.discountAmount,
          transportCharges: originalInvoice.transportCharges,
          otherCharges: originalInvoice.otherCharges,
          cgstAmount: originalInvoice.cgstAmount,
          sgstAmount: originalInvoice.sgstAmount,
          igstAmount: originalInvoice.igstAmount,
          totalGstAmount: originalInvoice.totalGstAmount,
          roundOff: originalInvoice.roundOff,
          grandTotal: originalInvoice.grandTotal,
          status: 'DRAFT',
          notes: originalInvoice.notes,
          terms: originalInvoice.terms,
          createdBy,
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create invoice items (snapshots from original)
      const itemsData = originalInvoice.items.map(item => ({
        invoiceId: newInvoice.id,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        hsnCode: item.hsnCode,
        unit: item.unit,
        gstRate: item.gstRate,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxableAmount: item.taxableAmount,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        igstAmount: item.igstAmount,
        lineTotal: item.lineTotal,
      }));

      if (itemsData.length > 0) {
        await tx.invoiceItem.createMany({
          data: itemsData,
        });
      }

      // Fetch complete invoice with items
      const createdInvoice = await tx.invoice.findUnique({
        where: { id: newInvoice.id },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return createdInvoice!;
    });
  }
}

export const invoiceRepository = new InvoiceRepositoryImpl();