import { invoiceRepository } from '@repositories/invoice.repository';
import { customerRepository } from '@repositories/customer.repository';
import { productRepository } from '@repositories/product.repository';
import { companySettingsRepository } from '@repositories/company-settings.repository';
import { InvoiceCalculationService } from './invoice-calculation.service';
import type { Invoice, InvoiceStatus, Customer, CompanySettings, Prisma } from '@prisma/client';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export interface InvoiceItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateInvoiceInput {
  customerId: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  discountAmount?: number;
  transportCharges?: number;
  otherCharges?: number;
  notes?: string;
  terms?: string;
  items: InvoiceItemInput[];
  createdBy?: string;
}

export interface UpdateInvoiceInput {
  dueDate?: Date | null;
  discountAmount?: number;
  transportCharges?: number;
  otherCharges?: number;
  notes?: string | null;
  terms?: string | null;
  status?: InvoiceStatus;
  updatedBy?: string;
}

export interface InvoiceService {
  getAll(
    page: number,
    limit: number,
    search?: string,
    customerId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{
    data: Invoice[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }>;
  getById(id: string): Promise<Invoice | null>;
  create(input: CreateInvoiceInput): Promise<Invoice>;
  update(id: string, input: UpdateInvoiceInput): Promise<Invoice>;
  cancel(id: string, updatedBy?: string): Promise<Invoice>;
  duplicate(id: string, createdBy: string): Promise<Invoice>;
  getNextInvoiceNumber(): Promise<string>;
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
}

export class InvoiceServiceImpl implements InvoiceService {
  /**
   * Validate and enrich invoice items with product snapshots
   * Also validates stock availability
   */
  private async validateAndEnrichItems(
    items: InvoiceItemInput[]
  ): Promise<Array<{
    productId: string;
    sku: string;
    productName: string;
    hsnCode: string;
    unit: Prisma.EnumProductUnitFilter['equals'];
    gstRate: Prisma.EnumGSTRateFilter['equals'];
    quantity: number;
    unitPrice: number;
    discount: number;
  }>> {
    const enrichedItems = [];

    for (const item of items) {
      // Validate product exists
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw ApiError.notFound(`Product with ID ${item.productId} not found`);
      }

      // Validate product is active
      if (!product.isActive) {
        throw ApiError.badRequest(`Product ${product.name} (${product.sku}) is not active`);
      }

      // Validate quantity > 0
      if (item.quantity <= 0) {
        throw ApiError.badRequest(`Quantity must be greater than 0 for product ${product.name}`);
      }

      // Validate stock availability
      const currentStock = Number(product.currentStock);
      if (currentStock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for product ${product.name} (${product.sku}). Available: ${currentStock}, Requested: ${item.quantity}`
        );
      }

      // Validate unit price >= 0
      if (item.unitPrice < 0) {
        throw ApiError.badRequest(`Unit price must be greater than or equal to 0 for product ${product.name}`);
      }

      // Validate discount >= 0
      const discount = item.discount || 0;
      if (discount < 0) {
        throw ApiError.badRequest(`Discount must be greater than or equal to 0 for product ${product.name}`);
      }

      // Validate discount doesn't exceed line amount
      const lineAmount = item.quantity * item.unitPrice;
      if (discount > lineAmount) {
        throw ApiError.badRequest(
          `Discount cannot exceed line amount for product ${product.name} (max: ${lineAmount})`
        );
      }

      enrichedItems.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        hsnCode: product.hsnCode,
        unit: product.unit,
        gstRate: product.gstRate,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
      });
    }

    return enrichedItems;
  }

  /**
   * Reduce stock for all items in the invoice
   */
  private async reduceStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      await productRepository.update(item.productId, {
        currentStock: { decrement: item.quantity },
      } as Prisma.ProductUpdateInput);
    }
  }

  /**
   * Validate customer exists and is active
   */
  private async validateCustomer(customerId: string): Promise<Customer> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
    if (!customer.isActive) {
      throw ApiError.badRequest('Customer is not active');
    }
    return customer;
  }

  /**
   * Get company settings for GST calculation
   */
  private async getCompanySettings(): Promise<CompanySettings> {
    const settings = await companySettingsRepository.find();
    if (!settings) {
      throw ApiError.notFound('Company settings not found. Please configure company settings first.');
    }
    if (!settings.stateCode) {
      throw ApiError.badRequest('Company state code is not configured. Please update company settings.');
    }
    return settings;
  }

  /**
   * Convert number to Prisma.Decimal
   */
  private toDecimal(value: number): Prisma.Decimal {
    return value as unknown as Prisma.Decimal;
  }

  async getAll(
    page: number,
    limit: number,
    search?: string,
    customerId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{
    data: Invoice[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }> {
    const { data, total } = await invoiceRepository.findAll({
      page,
      limit,
      search,
      customerId,
      status: status as InvoiceStatus | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
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

  async getById(id: string): Promise<Invoice | null> {
    return invoiceRepository.findById(id);
  }

  async create(input: CreateInvoiceInput): Promise<Invoice> {
    logger.info('Creating new invoice', {
      customerId: input.customerId,
      itemCount: input.items.length,
      invoiceDate: input.invoiceDate,
      createdBy: input.createdBy,
    });

    // Validate customer
    const customer = await this.validateCustomer(input.customerId);

    // Get company settings
    const companySettings = await this.getCompanySettings();

    // Validate and enrich items with product snapshots
    const enrichedItems = await this.validateAndEnrichItems(input.items);

    // Prepare company GST details
    const companyGst = {
      stateCode: companySettings.stateCode!,
    };

    // Prepare customer GST details
    const customerGst = {
      stateCode: customer.stateCode || '',
      gstNumber: customer.gstNumber || undefined,
    };

    // Validate customer has state code for inter-state determination
    if (!customerGst.stateCode) {
      throw ApiError.badRequest('Customer state code is required for GST calculation');
    }

    // Calculate invoice using InvoiceCalculationService
    const calculationInput = enrichedItems.map(item => ({
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      hsnCode: item.hsnCode,
      unit: item.unit!,
      gstRate: item.gstRate!,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
    }));

    const calculation = InvoiceCalculationService.calculateInvoice(
      calculationInput,
      companyGst,
      customerGst,
      input.transportCharges || 0,
      input.otherCharges || 0
    );

    // Validate calculation correctness
    if (!InvoiceCalculationService.validateCalculation(calculation)) {
      throw ApiError.internal('Invoice calculation validation failed');
    }

    // Get next invoice number
    const invoiceNumber = await invoiceRepository.getNextInvoiceNumber(companySettings.invoicePrefix);

    // Create invoice with items in transaction
    const invoiceData: {
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
    } = {
      invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate || null,
      customerId: input.customerId,
      subtotal: this.toDecimal(calculation.totals.subtotal),
      taxableAmount: this.toDecimal(calculation.totals.taxableAmount),
      discountAmount: this.toDecimal(input.discountAmount || 0),
      transportCharges: this.toDecimal(input.transportCharges || 0),
      otherCharges: this.toDecimal(input.otherCharges || 0),
      cgstAmount: this.toDecimal(calculation.totals.cgstAmount),
      sgstAmount: this.toDecimal(calculation.totals.sgstAmount),
      igstAmount: this.toDecimal(calculation.totals.igstAmount),
      totalGstAmount: this.toDecimal(calculation.totals.totalGstAmount),
      roundOff: this.toDecimal(calculation.totals.roundOff),
      grandTotal: this.toDecimal(calculation.totals.grandTotal),
      status: 'DRAFT',
      notes: input.notes || null,
      terms: input.terms || null,
      createdBy: input.createdBy || null,
    };

    const itemsData = calculation.items.map((item) => ({
      invoiceId: '', // Will be set in repository
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      hsnCode: item.hsnCode,
      unit: item.unit,
      gstRate: item.gstRate,
      quantity: this.toDecimal(item.quantity),
      unitPrice: this.toDecimal(item.unitPrice),
      discount: this.toDecimal(item.discount ?? 0),
      taxableAmount: this.toDecimal(item.taxableAmount),
      cgstAmount: this.toDecimal(item.cgstAmount),
      sgstAmount: this.toDecimal(item.sgstAmount),
      igstAmount: this.toDecimal(item.igstAmount),
      lineTotal: this.toDecimal(item.lineTotal),
    }));

    // Create invoice and increment sequence
    const invoice = await invoiceRepository.create(invoiceData, itemsData as any);

    // Increment invoice sequence
    const year = new Date().getFullYear();
    await invoiceRepository.incrementInvoiceSequence(year, companySettings.invoicePrefix);

    // Reduce stock for all items
    await this.reduceStock(
      enrichedItems.map(item => ({ productId: item.productId, quantity: item.quantity }))
    );

    // Log activity
    logger.info('Invoice created successfully', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      grandTotal: invoice.grandTotal,
      status: invoice.status,
      createdBy: input.createdBy,
    });

    return invoice;
  }

  async update(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
    logger.info('Updating invoice', { invoiceId: id, updatedBy: input.updatedBy });

    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    // Only allow updating DRAFT invoices
    if (invoice.status !== 'DRAFT') {
      throw ApiError.badRequest('Only DRAFT invoices can be updated');
    }

    // If discountAmount, transportCharges, or otherCharges are being updated,
    // we need to recalculate totals
    const needsRecalculation =
      input.discountAmount !== undefined ||
      input.transportCharges !== undefined ||
      input.otherCharges !== undefined;

    let updateData: Prisma.InvoiceUpdateInput = {
      dueDate: input.dueDate,
      notes: input.notes,
      terms: input.terms,
      status: input.status,
      updatedBy: input.updatedBy,
    };

    if (needsRecalculation) {
      // Get company settings for recalculation
      const companySettings = await this.getCompanySettings();

      // Prepare company GST details
      const companyGst = {
        stateCode: companySettings.stateCode!,
      };

      // Prepare customer GST details
      const customerGst = {
        stateCode: invoice.customer.stateCode || '',
        gstNumber: invoice.customer.gstNumber || undefined,
      };

      // Recalculate with new values
      const calculation = InvoiceCalculationService.calculateInvoice(
        invoice.items.map(item => ({
          productId: item.productId || undefined,
          sku: item.sku,
          productName: item.productName,
          hsnCode: item.hsnCode,
          unit: item.unit!,
          gstRate: item.gstRate!,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
        })),
        companyGst,
        customerGst,
        input.transportCharges ?? Number(invoice.transportCharges),
        input.otherCharges ?? Number(invoice.otherCharges)
      );

      if (!InvoiceCalculationService.validateCalculation(calculation)) {
        throw ApiError.internal('Invoice calculation validation failed');
      }

      updateData = {
        ...updateData,
        discountAmount: this.toDecimal(input.discountAmount ?? Number(invoice.discountAmount)),
        transportCharges: this.toDecimal(input.transportCharges ?? Number(invoice.transportCharges)),
        otherCharges: this.toDecimal(input.otherCharges ?? Number(invoice.otherCharges)),
        cgstAmount: this.toDecimal(calculation.totals.cgstAmount),
        sgstAmount: this.toDecimal(calculation.totals.sgstAmount),
        igstAmount: this.toDecimal(calculation.totals.igstAmount),
        totalGstAmount: this.toDecimal(calculation.totals.totalGstAmount),
        roundOff: this.toDecimal(calculation.totals.roundOff),
        grandTotal: this.toDecimal(calculation.totals.grandTotal),
        taxableAmount: this.toDecimal(calculation.totals.taxableAmount),
        subtotal: this.toDecimal(calculation.totals.subtotal),
      };
    }

    const updatedInvoice = await invoiceRepository.update(id, updateData);

    logger.info('Invoice updated successfully', {
      invoiceId: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      updatedBy: input.updatedBy,
    });

    return updatedInvoice;
  }

  async cancel(id: string, updatedBy?: string): Promise<Invoice> {
    logger.info('Cancelling invoice', { invoiceId: id, updatedBy });

    const invoice = await invoiceRepository.cancelInvoice(id, updatedBy);

    logger.info('Invoice cancelled successfully', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      updatedBy,
    });

    return invoice;
  }

  async duplicate(id: string, createdBy: string): Promise<Invoice> {
    logger.info('Duplicating invoice', { invoiceId: id, createdBy });

    const invoice = await invoiceRepository.duplicateInvoice(id, createdBy);

    logger.info('Invoice duplicated successfully', {
      originalInvoiceId: id,
      newInvoiceId: invoice.id,
      newInvoiceNumber: invoice.invoiceNumber,
      createdBy,
    });

    return invoice;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const companySettings = await this.getCompanySettings();
    return invoiceRepository.getNextInvoiceNumber(companySettings.invoicePrefix);
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
    return invoiceRepository.getStatistics();
  }
}

export const invoiceService = new InvoiceServiceImpl();