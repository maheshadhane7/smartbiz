import { Customer, CustomerIntelligence, Invoice, RiskCategory } from '../types';

/**
 * Computes RFM scores, Risk Category, and AI recommendations for each customer
 */
export function computeCustomerIntelligence(
  customer: Partial<Customer>,
  invoices: Invoice[]
): CustomerIntelligence {
  const customerInvoices = invoices.filter(inv => inv.customerId === customer.id && inv.status !== 'CANCELLED');
  const now = new Date();

  // 1. Recency
  let recencyDays = 999;
  if (customerInvoices.length > 0) {
    const dates = customerInvoices.map(inv => new Date(inv.createdAt).getTime());
    const latestDate = Math.max(...dates);
    recencyDays = Math.floor((now.getTime() - latestDate) / (1000 * 60 * 60 * 24));
  } else if (customer.lastPurchaseDate) {
    recencyDays = Math.floor((now.getTime() - new Date(customer.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  // 2. Frequency & Monetary
  const frequencyOrders = customerInvoices.length || customer.totalOrders || 0;
  const monetaryTotal = customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0) || customer.totalPurchases || 0;

  // 3. Payment Delay Calculation
  let totalDelayDays = 0;
  let delayedInvoicesCount = 0;
  let hasOverdueCredit = false;

  for (const inv of customerInvoices) {
    if (inv.dueDate && inv.status !== 'PAID') {
      const due = new Date(inv.dueDate);
      if (now > due) {
        hasOverdueCredit = true;
        const delay = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        totalDelayDays += delay;
        delayedInvoicesCount++;
      }
    }
  }

  const paymentDelayAvgDays = delayedInvoicesCount > 0 ? Math.round(totalDelayDays / delayedInvoicesCount) : 0;

  // 4. RFM Score (1 - 100)
  const rScore = Math.max(1, 35 - Math.min(30, Math.floor(recencyDays / 3)));
  const fScore = Math.min(35, frequencyOrders * 4);
  const mScore = Math.min(30, Math.floor(monetaryTotal / 10000));
  const rfmScore = Math.min(100, Math.max(10, rScore + fScore + mScore));

  // 5. Classification
  let riskCategory: RiskCategory = 'REGULAR';
  let churnProbability = 15;
  let delayProbability = 10;
  let recommendation = 'Maintain regular engagement with standard loyalty discounts.';
  const insights: string[] = [];

  const outstanding = customer.outstandingBalance || 0;
  const creditLimit = customer.creditLimit || 50000;

  if (hasOverdueCredit || paymentDelayAvgDays > 14 || (outstanding > creditLimit * 0.75)) {
    riskCategory = 'HIGH_PAYMENT_RISK';
    delayProbability = Math.min(95, 45 + paymentDelayAvgDays * 3);
    churnProbability = 40;
    recommendation = 'Trigger automated AI Voice reminder and temporarily pause further credit line approvals.';
    insights.push(`Average payment delay is ${paymentDelayAvgDays} days past invoice due date.`);
    insights.push(`Credit utilization is at ${Math.round((outstanding / creditLimit) * 100)}% of max credit limit.`);
  } else if (monetaryTotal >= 150000 || frequencyOrders >= 12) {
    riskCategory = 'HIGH_VALUE';
    churnProbability = recencyDays > 30 ? 45 : 8;
    delayProbability = 5;
    recommendation = 'VIP Customer. Offer personalized volume rebates and dedicated priority billing.';
    insights.push(`Top 5% revenue contributor with ₹${monetaryTotal.toLocaleString('en-IN')} total lifetime value.`);
  } else if (recencyDays > 45) {
    riskCategory = 'INACTIVE';
    churnProbability = 82;
    delayProbability = 20;
    recommendation = 'Customer at risk of churn. Send re-engagement WhatsApp offer with 10% coupon.';
    insights.push(`No purchases recorded in the last ${recencyDays} days.`);
  } else if (frequencyOrders <= 2) {
    riskCategory = 'NEW';
    churnProbability = 30;
    delayProbability = 12;
    recommendation = 'New customer onboarding. Send welcome message and catalog brochure.';
    insights.push('First-time buyer. High potential for upsell into annual contracts.');
  }

  return {
    rfmScore,
    recencyDays,
    frequencyOrders,
    monetaryTotal,
    paymentDelayAvgDays,
    riskCategory,
    churnProbability,
    delayProbability,
    recommendation,
    insights,
  };
}
