import { AIAnomalyAlert, Invoice, Product, SalesReturn, StockMovement } from '../types';
import { generateId } from '../utils';

/**
 * Scans invoices, returns, stock movements, and products for business anomalies and fraud risks
 */
export function detectBusinessAnomalies(
  invoices: Invoice[],
  stockMovements: StockMovement[],
  returns: SalesReturn[],
  products: Product[]
): AIAnomalyAlert[] {
  const alerts: AIAnomalyAlert[] = [];

  // 1. Scan for excessive discounts (> 20% or > ₹5,000)
  for (const inv of invoices) {
    if (inv.status === 'CANCELLED') continue;
    const discountPercent = inv.subtotal > 0 ? (inv.discountTotal / inv.subtotal) * 100 : 0;
    if (discountPercent > 20 || inv.discountTotal > 5000) {
      alerts.push({
        id: generateId('alert_disc'),
        type: 'EXCESSIVE_DISCOUNT',
        severity: discountPercent > 35 ? 'CRITICAL' : 'HIGH',
        title: `Unusual Discount of ${discountPercent.toFixed(1)}% on ${inv.invoiceNumber}`,
        description: `Invoice ${inv.invoiceNumber} for ${inv.customerName} contains ₹${inv.discountTotal.toLocaleString('en-IN')} discount (${discountPercent.toFixed(1)}%), which exceeds the 15% standard threshold.`,
        referenceId: inv.id,
        amount: inv.discountTotal,
        detectedAt: inv.createdAt,
        status: 'ACTIVE',
      });
    }
  }

  // 2. Scan for duplicate invoices (same customer, same grand total created on same date)
  const invoiceSeenMap = new Map<string, Invoice>();
  for (const inv of invoices) {
    if (inv.status === 'CANCELLED') continue;
    const dateKey = inv.createdAt.slice(0, 10);
    const key = `${inv.customerId}_${inv.grandTotal}_${dateKey}`;
    if (invoiceSeenMap.has(key)) {
      const original = invoiceSeenMap.get(key)!;
      alerts.push({
        id: generateId('alert_dup'),
        type: 'DUPLICATE_INVOICE',
        severity: 'HIGH',
        title: `Potential Duplicate Invoice Detected: ${inv.invoiceNumber}`,
        description: `Invoice ${inv.invoiceNumber} matches ${original.invoiceNumber} for customer ${inv.customerName} with identical grand total of ₹${inv.grandTotal.toLocaleString('en-IN')} on ${dateKey}.`,
        referenceId: inv.id,
        amount: inv.grandTotal,
        detectedAt: inv.createdAt,
        status: 'ACTIVE',
      });
    } else {
      invoiceSeenMap.set(key, inv);
    }
  }

  // 3. Scan for large stock shrinkage / damage adjustments
  for (const mv of stockMovements) {
    if (mv.type === 'DAMAGE' && Math.abs(mv.quantity) >= 15) {
      alerts.push({
        id: generateId('alert_stock'),
        type: 'STOCK_SHRINKAGE',
        severity: 'MEDIUM',
        title: `Large Damaged Stock Write-off: ${mv.productName}`,
        description: `${Math.abs(mv.quantity)} units of "${mv.productName}" were written off as damaged/lost by ${mv.createdBy}. Reason: ${mv.reason || 'Unspecified'}.`,
        referenceId: mv.id,
        detectedAt: mv.createdAt,
        status: 'ACTIVE',
      });
    }
  }

  // 4. Scan for abnormally high sales returns (> ₹10,000)
  for (const ret of returns) {
    if (ret.totalRefundAmount > 10000) {
      alerts.push({
        id: generateId('alert_ret'),
        type: 'UNUSUAL_REFUND',
        severity: 'HIGH',
        title: `High Refund Recorded: ₹${ret.totalRefundAmount.toLocaleString('en-IN')}`,
        description: `Sales return ${ret.returnNumber} for invoice ${ret.invoiceNumber} issued a high cash/credit refund of ₹${ret.totalRefundAmount.toLocaleString('en-IN')}.`,
        referenceId: ret.id,
        amount: ret.totalRefundAmount,
        detectedAt: ret.createdAt,
        status: 'ACTIVE',
      });
    }
  }

  return alerts;
}
