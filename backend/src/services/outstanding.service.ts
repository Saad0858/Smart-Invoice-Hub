import { outstandingRepository } from '@repositories/outstanding.repository';
import { logger } from '@utils/logger';

export interface OutstandingService {
  getOutstandingInvoices(
    page: number,
    limit: number,
    customerId?: string,
    paymentStatus?: string,
    startDate?: string,
    endDate?: string,
    dueDateStart?: string,
    dueDateEnd?: string,
    minAmount?: number,
    maxAmount?: number,
    onlyOverdue?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }>;
  getOutstandingByCustomer(customerId: string): Promise<any[]>;
  getSummary(): Promise<any>;
  getAgingReport(customerId?: string): Promise<any[]>;
  getOverdueInvoices(daysOverdue?: number): Promise<any[]>;
  getCollectionEfficiency(): Promise<any>;
}

export class OutstandingServiceImpl implements OutstandingService {
  async getOutstandingInvoices(
    page: number,
    limit: number,
    customerId?: string,
    paymentStatus?: string,
    startDate?: string,
    endDate?: string,
    dueDateStart?: string,
    dueDateEnd?: string,
    minAmount?: number,
    maxAmount?: number,
    onlyOverdue?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }> {
    logger.info('Fetching outstanding invoices', {
      page,
      limit,
      customerId,
      paymentStatus,
      startDate,
      endDate,
      onlyOverdue,
    });

    const { data, total } = await outstandingRepository.findAll({
      page,
      limit,
      customerId,
      paymentStatus: paymentStatus as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      dueDateStart: dueDateStart ? new Date(dueDateStart) : undefined,
      dueDateEnd: dueDateEnd ? new Date(dueDateEnd) : undefined,
      minAmount,
      maxAmount,
      onlyOverdue,
      sort,
      order: order || 'asc',
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

  async getOutstandingByCustomer(customerId: string): Promise<any[]> {
    logger.info('Fetching outstanding by customer', { customerId });
    return outstandingRepository.getOutstandingByCustomer(customerId);
  }

  async getSummary(): Promise<any> {
    logger.info('Fetching outstanding summary');
    return outstandingRepository.getSummary();
  }

  async getAgingReport(customerId?: string): Promise<any[]> {
    logger.info('Fetching aging report', { customerId });
    return outstandingRepository.getAgingReport(customerId);
  }

  async getOverdueInvoices(daysOverdue: number = 0): Promise<any[]> {
    logger.info('Fetching overdue invoices', { daysOverdue });
    return outstandingRepository.getOverdueInvoices(daysOverdue);
  }

  async getCollectionEfficiency(): Promise<any> {
    logger.info('Fetching collection efficiency');
    return outstandingRepository.getCollectionEfficiency();
  }
}

export const outstandingService = new OutstandingServiceImpl();