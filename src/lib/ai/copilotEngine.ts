import { Customer, Expense, Invoice, Product, PurchaseOrder } from '../types';
import { formatINR } from '../utils';
import { generateInventoryPredictions, generateSalesForecast } from './forecastEngine';
import { generateGSTR3B } from '../gst/gstCalculator';

export interface CopilotResponse {
  answer: string;
  structuredData?: {
    type: 'TABLE' | 'KPI_METRICS' | 'PRODUCT_LIST' | 'CUSTOMER_LIST' | 'CHART';
    title: string;
    columns?: string[];
    rows?: any[];
    chartData?: any[];
  };
  actions?: {
    label: string;
    href: string;
    actionType?: string;
  }[];
}

export function processCopilotQuery(
  query: string,
  data: {
    invoices: Invoice[];
    products: Product[];
    customers: Customer[];
    expenses: Expense[];
    purchases: PurchaseOrder[];
  }
): CopilotResponse {
  const q = query.toLowerCase().trim();
  const { invoices, products, customers, expenses, purchases } = data;

  // 1. Sales this month / Revenue queries
  if (q.includes('sales') || q.includes('revenue') || q.includes('turnover')) {
    const validInvoices = invoices.filter(i => i.status !== 'CANCELLED');
    const totalSales = validInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const paidSales = validInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const pendingSales = validInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);

    return {
      answer: `Total cumulative sales revenue recorded is **${formatINR(totalSales)}** across ${validInvoices.length} invoices. Of this, **${formatINR(paidSales)}** has been collected and **${formatINR(pendingSales)}** is currently outstanding.`,
      structuredData: {
        type: 'KPI_METRICS',
        title: 'Sales Summary Overview',
        rows: [
          { Metric: 'Total Gross Invoiced', Value: formatINR(totalSales) },
          { Metric: 'Collected Cash/UPI', Value: formatINR(paidSales) },
          { Metric: 'Pending Receivables', Value: formatINR(pendingSales) },
          { Metric: 'Average Order Value', Value: formatINR(totalSales / (validInvoices.length || 1)) },
        ],
      },
      actions: [
        { label: 'Go to Sales Register', href: '/sales' },
        { label: 'View Financial Reports', href: '/reports' },
      ],
    };
  }

  // 2. Who owes the most money / Overdue / Debtors
  if (q.includes('owe') || q.includes('debt') || q.includes('overdue') || q.includes('outstanding') || q.includes('pending payment')) {
    const debtors = customers
      .filter(c => c.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    const totalOutstanding = debtors.reduce((sum, c) => sum + c.outstandingBalance, 0);
    const topDebtor = debtors[0];

    const rows = debtors.slice(0, 5).map(c => ({
      Customer: c.name,
      Phone: c.phone,
      Outstanding: formatINR(c.outstandingBalance),
      RiskCategory: c.intelligence?.riskCategory || 'REGULAR',
      DelayDays: `${c.intelligence?.paymentDelayAvgDays || 0} days`,
    }));

    return {
      answer: `You have **${debtors.length} customers** with pending balances totaling **${formatINR(totalOutstanding)}**.\n\nYour largest debtor is **${topDebtor?.name || 'None'}** who owes **${formatINR(topDebtor?.outstandingBalance || 0)}**.`,
      structuredData: {
        type: 'CUSTOMER_LIST',
        title: 'Top Outstanding Debtors',
        columns: ['Customer', 'Phone', 'Outstanding', 'Risk Category', 'Avg Delay'],
        rows,
      },
      actions: [
        { label: 'Launch AI Voice Call Center', href: '/voice-calling' },
        { label: 'View Outstanding Dashboard', href: '/payments' },
      ],
    };
  }

  // 3. Best selling products / top selling
  if (q.includes('best') || q.includes('top product') || q.includes('sells the most') || q.includes('highest selling')) {
    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const inv of invoices) {
      if (inv.status === 'CANCELLED') continue;
      for (const item of inv.items) {
        const prev = productSalesMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
        prev.qty += item.quantity;
        prev.revenue += item.totalAmount;
        productSalesMap.set(item.productId, prev);
      }
    }

    const sorted = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue);
    const top = sorted[0];

    const rows = sorted.slice(0, 5).map((p, idx) => ({
      Rank: `#${idx + 1}`,
      Product: p.name,
      'Units Sold': p.qty,
      'Total Revenue': formatINR(p.revenue),
    }));

    return {
      answer: `Your top selling item by revenue is **${top?.name || 'N/A'}**, generating **${formatINR(top?.revenue || 0)}** with **${top?.qty || 0} units** sold.`,
      structuredData: {
        type: 'TABLE',
        title: 'Top 5 Best-Selling Products by Revenue',
        columns: ['Rank', 'Product', 'Units Sold', 'Total Revenue'],
        rows,
      },
      actions: [
        { label: 'Manage Products', href: '/products' },
        { label: 'Stock Demand Forecast', href: '/inventory' },
      ],
    };
  }

  // 4. Products to reorder / low stock
  if (q.includes('reorder') || q.includes('stockout') || q.includes('low stock') || q.includes('run out') || q.includes('inventory prediction')) {
    const predictions = generateInventoryPredictions(products, invoices);
    const urgentItems = predictions.filter(p => p.status === 'CRITICAL_STOCKOUT' || p.status === 'LOW_STOCK');

    const rows = urgentItems.slice(0, 6).map(p => ({
      Product: p.productName,
      'Current Stock': p.currentStock,
      'Days Left': `${p.daysRemaining} days`,
      'Est. Stockout': p.estimatedStockoutDate,
      'Reorder Qty': `${p.recommendedReorderQuantity} units`,
    }));

    return {
      answer: `AI predicts that **${urgentItems.length} products** require immediate reordering to prevent costly stockouts.`,
      structuredData: {
        type: 'PRODUCT_LIST',
        title: 'Urgent Inventory Reorder Recommendations',
        columns: ['Product', 'Current Stock', 'Days Left', 'Est. Stockout', 'Reorder Qty'],
        rows,
      },
      actions: [
        { label: 'Open Inventory AI Hub', href: '/inventory' },
        { label: 'Create Purchase Order', href: '/purchases' },
      ],
    };
  }

  // 5. Expected revenue / forecast
  if (q.includes('forecast') || q.includes('expected revenue') || q.includes('next month') || q.includes('future sales')) {
    const forecast = generateSalesForecast(invoices, 'NEXT_30_DAYS');

    return {
      answer: `Based on 30-day velocity and seasonal trend modeling, expected sales for next month is projected at **${formatINR(forecast.forecastedRevenue)}** (+${forecast.historicalComparisonPercent}% vs last period) with a **${forecast.confidenceScore}% confidence rating**.`,
      structuredData: {
        type: 'KPI_METRICS',
        title: '30-Day AI Revenue Projection',
        rows: [
          { Metric: 'Forecasted Revenue', Value: formatINR(forecast.forecastedRevenue) },
          { Metric: 'Growth Trajectory', Value: `+${forecast.historicalComparisonPercent}%` },
          { Metric: 'Confidence Score', Value: `${forecast.confidenceScore}%` },
          { Metric: 'Primary Driver', Value: forecast.keyDrivers[0] },
        ],
      },
      actions: [
        { label: 'View Forecast Analytics', href: '/dashboard' },
      ],
    };
  }

  // 6. GST queries
  if (q.includes('gst') || q.includes('tax') || q.includes('gstr') || q.includes('itc')) {
    const gstr3b = generateGSTR3B(invoices, purchases);

    return {
      answer: `Current month GST liability:\n- **Outward Output Tax**: ${formatINR(gstr3b.outwardTaxableSupplies.cgst + gstr3b.outwardTaxableSupplies.sgst + gstr3b.outwardTaxableSupplies.igst)}\n- **Eligible Purchase ITC**: ${formatINR(gstr3b.eligibleITC.cgst + gstr3b.eligibleITC.sgst + gstr3b.eligibleITC.igst)}\n- **Net Tax Payable**: **${formatINR(gstr3b.netTaxPayable.total)}** (CGST: ${formatINR(gstr3b.netTaxPayable.cgst)}, SGST: ${formatINR(gstr3b.netTaxPayable.sgst)}, IGST: ${formatINR(gstr3b.netTaxPayable.igst)})`,
      structuredData: {
        type: 'TABLE',
        title: 'GST Tax Liability Breakdown',
        columns: ['Tax Head', 'Output Liability', 'Input Tax Credit (ITC)', 'Net Payable'],
        rows: [
          { 'Tax Head': 'CGST', 'Output Liability': formatINR(gstr3b.outwardTaxableSupplies.cgst), 'Input Tax Credit (ITC)': formatINR(gstr3b.eligibleITC.cgst), 'Net Payable': formatINR(gstr3b.netTaxPayable.cgst) },
          { 'Tax Head': 'SGST', 'Output Liability': formatINR(gstr3b.outwardTaxableSupplies.sgst), 'Input Tax Credit (ITC)': formatINR(gstr3b.eligibleITC.sgst), 'Net Payable': formatINR(gstr3b.netTaxPayable.sgst) },
          { 'Tax Head': 'IGST', 'Output Liability': formatINR(gstr3b.outwardTaxableSupplies.igst), 'Input Tax Credit (ITC)': formatINR(gstr3b.eligibleITC.igst), 'Net Payable': formatINR(gstr3b.netTaxPayable.igst) },
        ],
      },
      actions: [
        { label: 'Download GSTR-1 / GSTR-3B', href: '/gst' },
      ],
    };
  }

  // 7. Expense queries / Profit & Loss
  if (q.includes('expense') || q.includes('profit') || q.includes('cost') || q.includes('rent') || q.includes('salary')) {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const validInvoices = invoices.filter(i => i.status !== 'CANCELLED');
    const totalRevenue = validInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    
    // Estimate COGS as ~65% of revenue
    const cogs = totalRevenue * 0.65;
    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      answer: `Total recorded expenses are **${formatINR(totalExpenses)}** across ${expenses.length} expense vouchers. Net estimated business profit is **${formatINR(netProfit)}** (Net Margin: **${netMargin.toFixed(1)}%**).`,
      structuredData: {
        type: 'TABLE',
        title: 'Profit & Loss Financial Summary',
        columns: ['Account Head', 'Amount', 'Share of Revenue'],
        rows: [
          { 'Account Head': 'Total Sales Revenue', Amount: formatINR(totalRevenue), 'Share of Revenue': '100%' },
          { 'Account Head': 'Cost of Goods Sold (COGS)', Amount: formatINR(cogs), 'Share of Revenue': '65.0%' },
          { 'Account Head': 'Gross Profit', Amount: formatINR(grossProfit), 'Share of Revenue': '35.0%' },
          { 'Account Head': 'Operating Expenses', Amount: formatINR(totalExpenses), 'Share of Revenue': `${((totalExpenses / (totalRevenue || 1)) * 100).toFixed(1)}%` },
          { 'Account Head': 'Net Profit', Amount: formatINR(netProfit), 'Share of Revenue': `${netMargin.toFixed(1)}%` },
        ],
      },
      actions: [
        { label: 'View Expense Tracker', href: '/expenses' },
        { label: 'Open P&L Reports', href: '/reports' },
      ],
    };
  }

  // Default response
  return {
    answer: `I have analyzed your business database. Here is what I found for "${query}":\n\n- Active Products: **${products.length} items**\n- Registered Customers: **${customers.length} businesses**\n- Processed Invoices: **${invoices.length} invoices**\n- Total Outstanding Debt: **${formatINR(customers.reduce((s, c) => s + c.outstandingBalance, 0))}**\n\nTry asking: *"Who owes the most money?"*, *"What are my best selling products?"*, *"Forecast next month's sales"*, or *"Which products should I reorder?"*`,
    actions: [
      { label: 'Open POS Billing', href: '/billing' },
      { label: 'AI Voice Calling', href: '/voice-calling' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  };
}
