import { GSTRate, ProductUnit } from '@prisma/client';
import { logger } from '@utils/logger';

/**
 * GST Rate percentage mapping
 */
const GST_RATE_PERCENTAGE: Record<GSTRate, number> = {
  ZERO: 0,
  FIVE: 5,
  TWELVE: 12,
  EIGHTEEN: 18,
  TWENTY_EIGHT: 28,
};

/**
 * Invoice line item input for calculation
 */
export interface InvoiceLineItemInput {
  productId?: string;
  sku: string;
  productName: string;
  hsnCode: string;
  unit: ProductUnit;
  gstRate: GSTRate;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

/**
 * Calculated line item output
 */
export interface CalculatedLineItem extends InvoiceLineItemInput {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

/**
 * Invoice totals calculation result
 */
export interface InvoiceTotals {
  subtotal: number;
  taxableAmount: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  roundOff: number;
  grandTotal: number;
}

/**
 * Complete invoice calculation result
 */
export interface InvoiceCalculationResult {
  items: CalculatedLineItem[];
  totals: InvoiceTotals;
}

/**
 * Company GST details for inter-state determination
 */
export interface CompanyGstDetails {
  stateCode: string;
}

/**
 * Customer GST details for inter-state determination
 */
export interface CustomerGstDetails {
  stateCode: string;
  gstNumber?: string;
}

/**
 * InvoiceCalculationService
 * Handles all financial calculations for invoices including:
 * - Line item calculations (taxable amount, CGST, SGST, IGST, line total)
 * - Invoice totals (subtotal, discount, GST, round-off, grand total)
 * - Inter-state vs intra-state GST determination
 * - Rounding logic
 */
export class InvoiceCalculationService {
  /**
   * Calculate GST percentage from GST rate enum
   */
  private static getGstPercentage(gstRate: GSTRate): number {
    return GST_RATE_PERCENTAGE[gstRate] || 0;
  }

  /**
   * Round to 2 decimal places (Indian currency standard)
   */
  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Determine if transaction is inter-state (IGST) or intra-state (CGST + SGST)
   * Inter-state: Supplier state !== Customer state
   * Intra-state: Supplier state === Customer state
   */
  private static isInterState(companyStateCode: string, customerStateCode: string): boolean {
    return companyStateCode !== customerStateCode;
  }

  /**
   * Calculate line item totals
   * Formula:
   * - taxableAmount = quantity * unitPrice - discount
   * - gstAmount = taxableAmount * gstRate / 100
   * - if inter-state: igstAmount = gstAmount, cgstAmount = 0, sgstAmount = 0
   * - if intra-state: cgstAmount = gstAmount / 2, sgstAmount = gstAmount / 2, igstAmount = 0
   * - lineTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount
   */
  static calculateLineItem(
    item: InvoiceLineItemInput,
    isInterState: boolean
  ): CalculatedLineItem {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const discount = Number(item.discount || 0);
    const gstPercentage = this.getGstPercentage(item.gstRate);

    // Calculate taxable amount (quantity * unitPrice - discount)
    const taxableAmount = this.round(quantity * unitPrice - discount);

    // Calculate GST amount
    const gstAmount = this.round(taxableAmount * gstPercentage / 100);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = gstAmount;
    } else {
      cgstAmount = this.round(gstAmount / 2);
      sgstAmount = this.round(gstAmount / 2);
      // Handle rounding difference (ensure cgst + sgst = gstAmount)
      const diff = this.round(gstAmount - cgstAmount - sgstAmount);
      if (diff !== 0) {
        sgstAmount = this.round(sgstAmount + diff);
      }
    }

    // Line total = taxableAmount + CGST + SGST + IGST
    const lineTotal = this.round(taxableAmount + cgstAmount + sgstAmount + igstAmount);

    logger.debug('Line item calculated', {
      sku: item.sku,
      quantity,
      unitPrice,
      discount,
      taxableAmount,
      gstRate: item.gstRate,
      gstPercentage,
      isInterState,
      cgstAmount,
      sgstAmount,
      igstAmount,
      lineTotal,
    });

    return {
      ...item,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      lineTotal,
    };
  }

  /**
   * Calculate invoice totals from line items
   * Formula:
   * - subtotal = sum of (quantity * unitPrice) for all items
   * - discountAmount = sum of discount for all items
   * - taxableAmount = sum of taxableAmount for all items
   * - cgstAmount = sum of cgstAmount for all items
   * - sgstAmount = sum of sgstAmount for all items
   * - igstAmount = sum of igstAmount for all items
   * - totalGstAmount = cgstAmount + sgstAmount + igstAmount
   * - grandTotal = taxableAmount + totalGstAmount + transportCharges + otherCharges
   * - roundOff = round(grandTotal) - grandTotal (to nearest rupee)
   * - finalGrandTotal = grandTotal + roundOff
   */
  static calculateTotals(
    items: CalculatedLineItem[],
    transportCharges: number = 0,
    otherCharges: number = 0
  ): InvoiceTotals {
    const subtotal = this.round(items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0));
    const discountAmount = this.round(items.reduce((sum, item) => sum + Number(item.discount || 0), 0));
    const taxableAmount = this.round(items.reduce((sum, item) => sum + Number(item.taxableAmount), 0));
    const cgstAmount = this.round(items.reduce((sum, item) => sum + Number(item.cgstAmount), 0));
    const sgstAmount = this.round(items.reduce((sum, item) => sum + Number(item.sgstAmount), 0));
    const igstAmount = this.round(items.reduce((sum, item) => sum + Number(item.igstAmount), 0));
    const totalGstAmount = this.round(cgstAmount + sgstAmount + igstAmount);

    // Grand total before round-off
    let grandTotal = this.round(taxableAmount + totalGstAmount + transportCharges + otherCharges);

    // Round off to nearest rupee (Indian standard)
    const roundedGrandTotal = Math.round(grandTotal);
    const roundOff = this.round(roundedGrandTotal - grandTotal);
    grandTotal = roundedGrandTotal;

    logger.debug('Invoice totals calculated', {
      itemCount: items.length,
      subtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGstAmount,
      transportCharges,
      otherCharges,
      grandTotal,
      roundOff,
    });

    return {
      subtotal,
      taxableAmount,
      discountAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGstAmount,
      roundOff,
      grandTotal,
    };
  }

  /**
   * Main calculation method - calculates all line items and totals
   */
  static calculateInvoice(
    items: InvoiceLineItemInput[],
    companyGst: CompanyGstDetails,
    customerGst: CustomerGstDetails,
    transportCharges: number = 0,
    otherCharges: number = 0
  ): InvoiceCalculationResult {
    // Determine if inter-state transaction
    const isInterState = this.isInterState(companyGst.stateCode, customerGst.stateCode);

    logger.info('Starting invoice calculation', {
      itemCount: items.length,
      companyStateCode: companyGst.stateCode,
      customerStateCode: customerGst.stateCode,
      isInterState,
      transportCharges,
      otherCharges,
    });

    // Calculate each line item
    const calculatedItems = items.map(item => this.calculateLineItem(item, isInterState));

    // Calculate totals
    const totals = this.calculateTotals(calculatedItems, transportCharges, otherCharges);

    return {
      items: calculatedItems,
      totals,
    };
  }

  /**
   * Validate GST calculation correctness
   * Useful for testing and verification
   */
  static validateCalculation(result: InvoiceCalculationResult): boolean {
    const { items, totals } = result;

    // Verify line totals
    for (const item of items) {
      const expectedLineTotal = this.round(
        Number(item.taxableAmount) + Number(item.cgstAmount) + Number(item.sgstAmount) + Number(item.igstAmount)
      );
      if (Math.abs(Number(item.lineTotal) - expectedLineTotal) > 0.01) {
        logger.error('Line total validation failed', { item, expectedLineTotal });
        return false;
      }
    }

    // Verify totals consistency
    const calculatedTaxable = this.round(items.reduce((sum, item) => sum + Number(item.taxableAmount), 0));
    const calculatedCgst = this.round(items.reduce((sum, item) => sum + Number(item.cgstAmount), 0));
    const calculatedSgst = this.round(items.reduce((sum, item) => sum + Number(item.sgstAmount), 0));
    const calculatedIgst = this.round(items.reduce((sum, item) => sum + Number(item.igstAmount), 0));

    if (Math.abs(Number(totals.taxableAmount) - calculatedTaxable) > 0.01) {
      logger.error('Taxable amount mismatch', { expected: calculatedTaxable, actual: totals.taxableAmount });
      return false;
    }

    if (Math.abs(Number(totals.cgstAmount) - calculatedCgst) > 0.01) {
      logger.error('CGST amount mismatch', { expected: calculatedCgst, actual: totals.cgstAmount });
      return false;
    }

    if (Math.abs(Number(totals.sgstAmount) - calculatedSgst) > 0.01) {
      logger.error('SGST amount mismatch', { expected: calculatedSgst, actual: totals.sgstAmount });
      return false;
    }

    if (Math.abs(Number(totals.igstAmount) - calculatedIgst) > 0.01) {
      logger.error('IGST amount mismatch', { expected: calculatedIgst, actual: totals.igstAmount });
      return false;
    }

    return true;
  }
}

export const invoiceCalculationService = new InvoiceCalculationService();