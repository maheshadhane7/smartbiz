import { GSTSlab, Invoice, InvoiceItem, PurchaseOrder } from '../types';

export interface TaxCalculationResult {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Calculates tax breakdown for an invoice item based on inter-state flag
 */
export function calculateItemTax(
  unitPrice: number,
  quantity: number,
  discountPercent: number = 0,
  gstRate: GSTSlab = 18,
  isInterState: boolean = false
): TaxCalculationResult {
  const grossAmount = unitPrice * quantity;
  const discountAmount = (grossAmount * discountPercent) / 100;
  const taxableAmount = Number((grossAmount - discountAmount).toFixed(2));

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = Number(((taxableAmount * igstRate) / 100).toFixed(2));
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Number(((taxableAmount * cgstRate) / 100).toFixed(2));
    sgstAmount = Number(((taxableAmount * sgstRate) / 100).toFixed(2));
  }

  const totalTax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
  const totalAmount = Number((taxableAmount + totalTax).toFixed(2));

  return {
    taxableAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    totalAmount,
  };
}

export interface GSTR1Data {
  b2bInvoices: {
    gstin: string;
    customerName: string;
    invoiceNumber: string;
    date: string;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
  }[];
  b2cInvoices: {
    invoiceNumber: string;
    date: string;
    customerName: string;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
  }[];
  hsnSummary: {
    hsnCode: string;
    description: string;
    totalQuantity: number;
    unit: string;
    totalTaxable: number;
    totalTax: number;
  }[];
  totals: {
    totalTaxable: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    totalInvoiceValue: number;
  };
}

/**
 * Compiles GSTR-1 return data from invoices
 */
export function generateGSTR1(invoices: Invoice[]): GSTR1Data {
  const b2bInvoices: GSTR1Data['b2bInvoices'] = [];
  const b2cInvoices: GSTR1Data['b2cInvoices'] = [];
  const hsnMap = new Map<string, {
    hsnCode: string;
    description: string;
    totalQuantity: number;
    unit: string;
    totalTaxable: number;
    totalTax: number;
  }>();

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalInvoiceValue = 0;

  for (const inv of invoices) {
    if (inv.status === 'CANCELLED') continue;

    totalTaxable += inv.taxableTotal;
    totalCgst += inv.cgstTotal;
    totalSgst += inv.sgstTotal;
    totalIgst += inv.igstTotal;
    totalInvoiceValue += inv.grandTotal;

    if (inv.customerGstin && inv.customerGstin.trim().length >= 15) {
      b2bInvoices.push({
        gstin: inv.customerGstin,
        customerName: inv.customerName,
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        taxableValue: inv.taxableTotal,
        igst: inv.igstTotal,
        cgst: inv.cgstTotal,
        sgst: inv.sgstTotal,
        total: inv.grandTotal,
      });
    } else {
      b2cInvoices.push({
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        customerName: inv.customerName,
        taxableValue: inv.taxableTotal,
        igst: inv.igstTotal,
        cgst: inv.cgstTotal,
        sgst: inv.sgstTotal,
        total: inv.grandTotal,
      });
    }

    for (const item of inv.items) {
      const existing = hsnMap.get(item.hsnCode);
      const itemTax = item.cgstAmount + item.sgstAmount + item.igstAmount;
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalTaxable += item.taxableAmount;
        existing.totalTax += itemTax;
      } else {
        hsnMap.set(item.hsnCode, {
          hsnCode: item.hsnCode,
          description: item.productName,
          totalQuantity: item.quantity,
          unit: item.unit,
          totalTaxable: item.taxableAmount,
          totalTax: itemTax,
        });
      }
    }
  }

  return {
    b2bInvoices,
    b2cInvoices,
    hsnSummary: Array.from(hsnMap.values()),
    totals: {
      totalTaxable: Number(totalTaxable.toFixed(2)),
      totalCgst: Number(totalCgst.toFixed(2)),
      totalSgst: Number(totalSgst.toFixed(2)),
      totalIgst: Number(totalIgst.toFixed(2)),
      totalTax: Number((totalCgst + totalSgst + totalIgst).toFixed(2)),
      totalInvoiceValue: Number(totalInvoiceValue.toFixed(2)),
    },
  };
}

export interface GSTR3BData {
  outwardTaxableSupplies: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
  };
  eligibleITC: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
  };
  netTaxPayable: {
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
  };
}

/**
 * Calculates GSTR-3B monthly tax summary by offsetting Outward Output GST against Eligible ITC from Purchases
 */
export function generateGSTR3B(invoices: Invoice[], purchases: PurchaseOrder[]): GSTR3BData {
  let outTaxable = 0;
  let outCgst = 0;
  let outSgst = 0;
  let outIgst = 0;

  for (const inv of invoices) {
    if (inv.status !== 'CANCELLED') {
      outTaxable += inv.taxableTotal;
      outCgst += inv.cgstTotal;
      outSgst += inv.sgstTotal;
      outIgst += inv.igstTotal;
    }
  }

  let inTaxable = 0;
  let inCgst = 0;
  let inSgst = 0;
  let inIgst = 0;

  for (const po of purchases) {
    if (po.status === 'RECEIVED') {
      inTaxable += po.taxableTotal;
      // standard split for purchase ITC
      inCgst += po.gstTotal / 2;
      inSgst += po.gstTotal / 2;
    }
  }

  const netCgst = Math.max(0, outCgst - inCgst);
  const netSgst = Math.max(0, outSgst - inSgst);
  const netIgst = Math.max(0, outIgst - inIgst);

  return {
    outwardTaxableSupplies: {
      taxableValue: Number(outTaxable.toFixed(2)),
      igst: Number(outIgst.toFixed(2)),
      cgst: Number(outCgst.toFixed(2)),
      sgst: Number(outSgst.toFixed(2)),
    },
    eligibleITC: {
      taxableValue: Number(inTaxable.toFixed(2)),
      igst: Number(inIgst.toFixed(2)),
      cgst: Number(inCgst.toFixed(2)),
      sgst: Number(inSgst.toFixed(2)),
    },
    netTaxPayable: {
      igst: Number(netIgst.toFixed(2)),
      cgst: Number(netCgst.toFixed(2)),
      sgst: Number(netSgst.toFixed(2)),
      total: Number((netCgst + netSgst + netIgst).toFixed(2)),
    },
  };
}
