import { ledgerRepository } from '@repositories/ledger.repository';
import { logger } from '@utils/logger';

export interface LedgerService {
  getCustomerLedger(
    customerId: string,
    startDate?: string,
    endDate?: string,
    includeOpeningBalance?: boolean
  ): Promise<{
    customer: any;
    entries: any[];
    summary: any;
  }>;
  getCustomerStatement(
    customerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    customer: any;
    entries: any[];
    summary: any;
  }>;
  getOutstandingAging(customerId?: string): Promise<any[]>;
}

export class LedgerServiceImpl implements LedgerService {
  async getCustomerLedger(
    customerId: string,
    startDate?: string,
    endDate?: string,
    includeOpeningBalance: boolean = true
  ): Promise<{
    customer: any;
    entries: any[];
    summary: any;
  }> {
    logger.info('Fetching customer ledger', { customerId, startDate, endDate, includeOpeningBalance });

    const ledger = await ledgerRepository.getCustomerLedger({
      customerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeOpeningBalance,
    });

    logger.info('Customer ledger fetched successfully', {
      customerId,
      entryCount: ledger.entries.length,
      closingBalance: ledger.summary.closingBalance,
    });

    return ledger;
  }

  async getCustomerStatement(
    customerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    customer: any;
    entries: any[];
    summary: any;
  }> {
    logger.info('Generating customer statement', { customerId, startDate, endDate });

    const statement = await ledgerRepository.getCustomerStatement(
      customerId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    logger.info('Customer statement generated successfully', {
      customerId,
      entryCount: statement.entries.length,
    });

    return statement;
  }

  async getOutstandingAging(customerId?: string): Promise<any[]> {
    logger.info('Fetching outstanding aging report', { customerId });

    const aging = await ledgerRepository.getOutstandingAging(customerId);

    logger.info('Outstanding aging report fetched successfully', {
      customerCount: aging.length,
    });

    return aging;
  }
}

export const ledgerService = new LedgerServiceImpl();