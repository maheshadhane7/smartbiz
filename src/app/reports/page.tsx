'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  ReceiptIndianRupee,
  Boxes,
  Users,
  PhoneCall,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, exportToCSV } from '../../lib/utils';
import { useNotification } from '../../context/NotificationContext';

export default function ReportsCenterPage() {
  const { invoices, purchases, products, customers, expenses, callRecords, business } = useData();
  const { showToast } = useNotification();

  const [dateRange, setDateRange] = useState<'30_DAYS' | '90_DAYS' | 'ALL'>('30_DAYS');

  // Reports data export handlers
  const handleExportSales = () => {
    exportToCSV('sales_detailed_report', invoices);
    showToast({ title: 'Report Exported', message: 'Sales Report downloaded as CSV', type: 'success' });
  };

  const handleExportPurchases = () => {
    exportToCSV('purchases_procurement_report', purchases);
    showToast({ title: 'Report Exported', message: 'Purchase Report downloaded as CSV', type: 'success' });
  };

  const handleExportInventory = () => {
    exportToCSV('inventory_stock_valuation_report', products);
    showToast({ title: 'Report Exported', message: 'Stock Valuation downloaded as CSV', type: 'success' });
  };

  const handleExportDebtors = () => {
    exportToCSV('outstanding_debtors_aging_report', customers.filter(c => c.outstandingBalance > 0));
    showToast({ title: 'Report Exported', message: 'Debtors Report downloaded as CSV', type: 'success' });
  };

  const handleExportExpenses = () => {
    exportToCSV('operating_expenses_report', expenses);
    showToast({ title: 'Report Exported', message: 'Expenses Report downloaded as CSV', type: 'success' });
  };

  const handleExportCalls = () => {
    exportToCSV('ai_voice_call_analytics_report', callRecords);
    showToast({ title: 'Report Exported', message: 'Call Center Report downloaded as CSV', type: 'success' });
  };

  const reportCards = [
    {
      title: 'Sales & Invoicing Report',
      description: 'Comprehensive register of B2B/B2C invoices, taxable values, GST heads, and payment modes.',
      count: `${invoices.length} Invoices`,
      icon: TrendingUp,
      color: 'indigo',
      onExport: handleExportSales,
    },
    {
      title: 'Purchase & Vendor Orders Report',
      description: 'Procurement bills, supplier ledgers, goods received (GRN), and Input Tax Credit (ITC).',
      count: `${purchases.length} Purchase Orders`,
      icon: FileSpreadsheet,
      color: 'emerald',
      onExport: handleExportPurchases,
    },
    {
      title: 'Stock Valuation & Inventory Report',
      description: 'Current quantities, cost valuation, retail markup, reorder thresholds, and daily run-rate velocity.',
      count: `${products.length} Products`,
      icon: Boxes,
      color: 'amber',
      onExport: handleExportInventory,
    },
    {
      title: 'Customer Debtors & Aging Report',
      description: 'Outstanding accounts receivables categorized by aging (1-7d, 8-30d, 30+d) with AI risk scores.',
      count: `${customers.filter(c => c.outstandingBalance > 0).length} Debtors`,
      icon: Users,
      color: 'rose',
      onExport: handleExportDebtors,
    },
    {
      title: 'Operating Expenses & P&L Report',
      description: 'Breakdown of monthly overheads (Rent, Salary, Utilities, Transport) and net operating margins.',
      count: `${expenses.length} Vouchers`,
      icon: ReceiptIndianRupee,
      color: 'cyan',
      onExport: handleExportExpenses,
    },
    {
      title: 'AI Voice Calling & Recovery Report',
      description: 'Call center performance metrics, disposition distribution, promised payment dates, and transcripts.',
      count: `${callRecords.length} Voice Calls`,
      icon: PhoneCall,
      color: 'purple',
      onExport: handleExportCalls,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Financial & Operational Reports Center
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EXPORT HUB
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export audit-ready CSV, Excel, and PDF reports for chartered accountants, management & tax filing
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition self-start sm:self-auto"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Print Current View</span>
          </button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reportCards.map((rep, idx) => {
            const Icon = rep.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                      {rep.count}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{rep.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rep.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={rep.onExport}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download CSV Dataset</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
