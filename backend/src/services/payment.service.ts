import { paymentRepository } from '@repositories/payment.repository';
import { invoiceRepository } from '@repositories/invoice.repository';
import { customerRepository } from '@repositories/customer.repository';
import type { Payment, PaymentMethod, PaymentStatus, Prisma, Invoice } from '@prisma/client';
import { ApiError } from '@utils/api-error';
import { logger } from '@utils/logger';

export interface RecordPaymentInput {
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  remarks?: string | null;
  receivedBy?: string;
  createdBy?: string;
}

export interface UpdatePaymentInput {
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  remarks?: string | null;
  receivedBy?: string | null;
  updatedBy?: string;
}

export interface CancelPaymentInput {
  cancelledReason: string;
  updatedBy?: string;
}

export interface PaymentService {
  getAll(
    page: number,
    limit: number,
    search?: string,
    invoiceId?: string,
    customerId?: string,
    paymentMethod?: string,
    startDate?: string,
    endDate?: string,
    isCancelled?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{
    data: Payment[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }>;
  getById(id: string): Promise<Payment | null>;
  getByInvoiceId(invoiceId: string): Promise<Payment[]>;
  getByCustomerId(customerId: string): Promise<Payment[]>;
  recordPayment(input: RecordPaymentInput): Promise<Payment>;
  updatePayment(id: string, input: UpdatePaymentInput): Promise<Payment>;
  cancelPayment(id: string, input: CancelPaymentInput): Promise<Payment>;
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

export class PaymentServiceImpl implements PaymentService {
  private toDecimal(value: number): Prisma.Decimal {
    return value as unknown as Prisma.Decimal;
  }

  /**
   * Validate that reference number is provided for certain payment methods
   */
  private validateReferenceNumber(paymentMethod: PaymentMethod, referenceNumber?: string | null): void {
    const methodsRequiringReference: PaymentMethod[] = ['UPI', 'BANK_TRANSFER', 'CHEQUE'];
    if (methodsRequiringReference.includes(paymentMethod) && (!referenceNumber || referenceNumber.trim() === '')) {
      throw ApiError.badRequest(`Reference number is required for ${paymentMethod} payments`);
    }
  }

  /**
   * Update invoice payment status and amounts
   */
  private async updateInvoicePaymentStatus(invoiceId: string, paymentAmount: number, isCancellation: boolean = false): Promise<void> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    const currentPaidAmount = Number(invoice.paidAmount);
    const grandTotal = Number(invoice.grandTotal);
    const newPaidAmount = isCancellation
      ? Math.max(0, currentPaidAmount - paymentAmount)
      : currentPaidAmount + paymentAmount;
    const newBalanceAmount = Math.max(0, grandTotal - newPaidAmount);

    let newPaymentStatus: PaymentStatus;
    if (newBalanceAmount === 0) {
      newPaymentStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'PARTIALLY_PAID';
    } else {
      newPaymentStatus = 'UNPAID';
    }

    // Check for overdue
    const now = new Date();
    if (newBalanceAmount > 0 && invoice.dueDate && new Date(invoice.dueDate) < now) {
      newPaymentStatus = 'OVERDUE';
    }

    const newPaymentCount = isCancellation
      ? Math.max(0, invoice.paymentCount - 1)
      : invoice.paymentCount + 1;

    await invoiceRepository.update(invoiceId, {
      paidAmount: this.toDecimal(newPaidAmount),
      balanceAmount: this.toDecimal(newBalanceAmount),
      paymentStatus: newPaymentStatus,
      lastPaymentDate: isCancellation ? null : new Date(),
      paymentCount: newPaymentCount,
    });
  }

  /**
   * Validate invoice for payment
   */
  private async validateInvoiceForPayment(invoiceId: string, paymentAmount: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot record payment on a cancelled invoice');
    }

    const balanceAmount = Number(invoice.balanceAmount);
    if (paymentAmount > balanceAmount) {
      throw ApiError.badRequest(`Payment amount (${paymentAmount}) cannot exceed outstanding balance (${balanceAmount})`);
    }

    if (paymentAmount <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than zero');
    }

    return invoice;
  }

  async getAll(
    page: number,
    limit: number,
    search?: string,
    invoiceId?: string,
    customerId?: string,
    paymentMethod?: string,
    startDate?: string,
    endDate?: string,
    isCancelled?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{
    data: Payment[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }> {
    const { data, total } = await paymentRepository.findAll({
      page,
      limit,
      search,
      invoiceId,
      customerId,
      paymentMethod: paymentMethod as PaymentMethod | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isCancelled,
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

  async getById(id: string): Promise<Payment | null> {
    return paymentRepository.findById(id);
  }

  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return paymentRepository.findByInvoiceId(invoiceId);
  }

  async getByCustomerId(customerId: string): Promise<Payment[]> {
    return paymentRepository.findByCustomerId(customerId);
  }

  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    logger.info('Recording payment', {
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      createdBy: input.createdBy,
    });

    // Validate invoice
    const invoice = await this.validateInvoiceForPayment(input.invoiceId, input.amount);

    // Validate customer matches invoice
    if (invoice.customerId !== input.invoiceId) {
      // We'll validate customer exists separately
    }

    // Validate customer exists
    const customer = await customerRepository.findById(invoice.customerId);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Validate reference number for certain payment methods
    this.validateReferenceNumber(input.paymentMethod, input.referenceNumber);

    // Validate payment date is not in future
    if (input.paymentDate > new Date()) {
      throw ApiError.badRequest('Payment date cannot be in the future');
    }

    // Get next payment number
    const paymentNumber = await paymentRepository.getNextPaymentNumber();

    // Create payment in transaction
    const payment = await paymentRepository.create({
      paymentNumber,
      invoiceId: input.invoiceId,
      customerId: invoice.customerId,
      paymentDate: input.paymentDate,
      amount: this.toDecimal(input.amount),
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || null,
      remarks: input.remarks || null,
      receivedBy: input.receivedBy || null,
      createdBy: input.createdBy || null,
    });

    // Update invoice payment status
    await this.updateInvoicePaymentStatus(input.invoiceId, input.amount);

    logger.info('Payment recorded successfully', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      createdBy: input.createdBy,
    });

    return payment;
  }

  async updatePayment(id: string, input: UpdatePaymentInput): Promise<Payment> {
    logger.info('Updating payment', { paymentId: id, updatedBy: input.updatedBy });

    const existingPayment = await paymentRepository.findById(id);
    if (!existingPayment) {
      throw ApiError.notFound('Payment not found');
    }

    if (existingPayment.isCancelled) {
      throw ApiError.badRequest('Cannot update a cancelled payment');
    }

    // Validate invoice
    const invoice = await invoiceRepository.findById(existingPayment.invoiceId);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot update payment on a cancelled invoice');
    }

    // Validate reference number if payment method is changing
    const newPaymentMethod = input.paymentMethod || existingPayment.paymentMethod;
    const newReferenceNumber = input.referenceNumber !== undefined ? input.referenceNumber : existingPayment.referenceNumber;
    this.validateReferenceNumber(newPaymentMethod, newReferenceNumber);

    // Validate amount if changing
    if (input.amount !== undefined) {
      if (input.amount <= 0) {
        throw ApiError.badRequest('Payment amount must be greater than zero');
      }

      const balanceAmount = Number(invoice.balanceAmount);
      const currentPaymentAmount = Number(existingPayment.amount);
      const newBalanceIfUpdated = balanceAmount + currentPaymentAmount; // Add back current payment to get available balance

      if (input.amount > newBalanceIfUpdated) {
        throw ApiError.badRequest(`Payment amount (${input.amount}) cannot exceed available balance (${newBalanceIfUpdated})`);
      }
    }

    // Prepare update data
    const updateData: Prisma.PaymentUpdateInput = {};
    if (input.paymentDate) updateData.paymentDate = input.paymentDate;
    if (input.amount !== undefined) updateData.amount = this.toDecimal(input.amount);
    if (input.paymentMethod) updateData.paymentMethod = input.paymentMethod;
    if (input.referenceNumber !== undefined) updateData.referenceNumber = input.referenceNumber;
    if (input.remarks !== undefined) updateData.remarks = input.remarks;
    if (input.receivedBy !== undefined) updateData.receivedBy = input.receivedBy;
    if (input.updatedBy) updateData.updatedBy = input.updatedBy;

    // If amount changed, we need to adjust invoice
    if (input.amount !== undefined && input.amount !== Number(existingPayment.amount)) {
      const amountDiff = input.amount - Number(existingPayment.amount);
      await this.updateInvoicePaymentStatus(existingPayment.invoiceId, amountDiff);
    }

    const updatedPayment = await paymentRepository.update(id, updateData);

    logger.info('Payment updated successfully', {
      paymentId: updatedPayment.id,
      paymentNumber: updatedPayment.paymentNumber,
      updatedBy: input.updatedBy,
    });

    return updatedPayment;
  }

  async cancelPayment(id: string, input: CancelPaymentInput): Promise<Payment> {
    logger.info('Cancelling payment', { paymentId: id, cancelledReason: input.cancelledReason, updatedBy: input.updatedBy });

    const existingPayment = await paymentRepository.findById(id);
    if (!existingPayment) {
      throw ApiError.notFound('Payment not found');
    }

    if (existingPayment.isCancelled) {
      throw ApiError.badRequest('Payment is already cancelled');
    }

    // Validate invoice
    const invoice = await invoiceRepository.findById(existingPayment.invoiceId);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    // Cancel payment
    const cancelledPayment = await paymentRepository.cancel(id, input.cancelledReason, input.updatedBy);

    // Reverse invoice payment status
    await this.updateInvoicePaymentStatus(existingPayment.invoiceId, Number(existingPayment.amount), true);

    logger.info('Payment cancelled successfully', {
      paymentId: cancelledPayment.id,
      paymentNumber: cancelledPayment.paymentNumber,
      cancelledReason: input.cancelledReason,
      updatedBy: input.updatedBy,
    });

    return cancelledPayment;
  }

  async getStatistics(): Promise<{
    total: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, { count: number; amount: number }>;
    todayCollection: number;
    thisMonthCollection: number;
    thisYearCollection: number;
  }> {
    return paymentRepository.getStatistics();
  }

  async getPaymentMethodDistribution(startDate?: Date, endDate?: Date): Promise<Array<{ method: PaymentMethod; count: number; amount: number }>> {
    return paymentRepository.getPaymentMethodDistribution(startDate, endDate);
  }

  async getCollectionTrend(interval: 'daily' | 'weekly' | 'monthly', startDate?: Date, endDate?: Date): Promise<Array<{ period: string; amount: number; count: number }>> {
    return paymentRepository.getCollectionTrend(interval, startDate, endDate);
  }
}

export const paymentService = new PaymentServiceImpl();