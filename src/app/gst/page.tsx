'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  FileText,
  Filter,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { generateGSTR1, generateGSTR3B } from '../../lib/gst/gstCalculator';
import { formatINR, formatDate, exportToCSV } from '../../lib/utils';

export default function GSTCompliancePage() {
  const { invoices, purchases, business } = useData();
  const [activeTab, setActiveTab] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');

  // Compute GSTR-1 & GSTR-3B
  const gstr1 = generateGSTR1(invoices);
  const gstr3b = generateGSTR3B(invoices, purchases);

  const handleExportGSTR1_B2B = () => {
    exportToCSV('GSTR1_B2B_Invoices', gstr1.b2bInvoices);
  };

  const handleExportGSTR1_HSN = () => {
    exportToCSV('GSTR1_HSN_Summary', gstr1.hsnSummary);
  };

  const b2bColumns: Column<typeof gstr1.b2bInvoices[0]>[] = [
    {
      header: 'Customer GSTIN',
      accessorKey: 'gstin',
      sortable: true,
      cell: r => <span className="font-mono font-bold text-indigo-400 text-xs">{r.gstin}</span>,
    },
    {
      header: 'Customer Name',
      accessorKey: 'customerName',
      sortable: true,
      cell: r => <span className="font-semibold text-white text-xs">{r.customerName}</span>,
    },
    {
      header: 'Invoice No & Date',
      accessorKey: 'invoiceNumber',
      sortable: true,
      cell: r => (
        <div>
          <span className="font-mono text-xs text-white">{r.invoiceNumber}</span>
          <span className="text-[10px] text-slate-400 block">{formatDate(r.date)}</span>
        </div>
      ),
    },
    {
      header: 'Taxable Value',
      accessorKey: 'taxableValue',
      sortable: true,
      align: 'right',
      cell: r => <span className="font-bold text-slate-200 text-xs">{formatINR(r.taxableValue)}</span>,
    },
    {
      header: 'CGST',
      accessorKey: 'cgst',
      align: 'right',
      cell: r => <span className="text-xs text-slate-300">{r.cgst > 0 ? formatINR(r.cgst) : '-'}</span>,
    },
    {
      header: 'SGST',
      accessorKey: 'sgst',
      align: 'right',
      cell: r => <span className="text-xs text-slate-300">{r.sgst > 0 ? formatINR(r.sgst) : '-'}</span>,
    },
    {
      header: 'IGST',
      accessorKey: 'igst',
      align: 'right',
      cell: r => <span className="text-xs text-slate-300">{r.igst > 0 ? formatINR(r.igst) : '-'}</span>,
    },
    {
      header: 'Total Invoice Value',
      accessorKey: 'total',
      sortable: true,
      align: 'right',
      cell: r => <span className="font-bold text-emerald-400 text-xs">{formatINR(r.total)}</span>,
    },
  ];

  const hsnColumns: Column<typeof gstr1.hsnSummary[0]>[] = [
    {
      header: 'HSN / SAC Code',
      accessorKey: 'hsnCode',
      sortable: true,
      cell: h => <span className="font-mono font-bold text-indigo-400 text-xs">{h.hsnCode}</span>,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      sortable: true,
      cell: h => <span className="font-semibold text-white text-xs">{h.description}</span>,
    },
    {
      header: 'Total Qty',
      accessorKey: 'totalQuantity',
      align: 'right',
      cell: h => <span className="text-xs text-slate-200 font-semibold">{h.totalQuantity} {h.unit}</span>,
    },
    {
      header: 'Total Taxable Value',
      accessorKey: 'totalTaxable',
      sortable: true,
      align: 'right',
      cell: h => <span className="font-bold text-white text-xs">{formatINR(h.totalTaxable)}</span>,
    },
    {
      header: 'Total Tax Amount',
      accessorKey: 'totalTax',
      sortable: true,
      align: 'right',
      cell: h => <span className="font-bold text-emerald-400 text-xs">{formatINR(h.totalTax)}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              GST Compliance & Returns Hub
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                GSTIN: {business.gstin}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated GSTR-1 outward invoice summaries, HSN reporting, and GSTR-3B Input Tax Credit (ITC) liability computation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportGSTR1_B2B}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Export GSTR-1 CSV</span>
            </button>
          </div>
        </div>

        {/* GST Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Outward Taxable Value"
            value={formatINR(gstr1.totals.totalTaxable)}
            subtitle="Gross outward sales base"
            icon={FileSpreadsheet}
            iconColor="indigo"
          />

          <MetricCard
            title="Output GST Liability"
            value={formatINR(gstr1.totals.totalTax)}
            subtitle={`CGST: ${formatINR(gstr1.totals.totalCgst)} • SGST: ${formatINR(gstr1.totals.totalSgst)}`}
            icon={CreditCard}
            iconColor="rose"
          />

          <MetricCard
            title="Eligible Purchase ITC"
            value={formatINR(gstr3b.eligibleITC.cgst + gstr3b.eligibleITC.sgst + gstr3b.eligibleITC.igst)}
            subtitle="Input credit claimed from POs"
            icon={CheckCircle2}
            iconColor="emerald"
          />

          <MetricCard
            title="Net GST Cash Payable"
            value={formatINR(gstr3b.netTaxPayable.total)}
            subtitle="After offsetting purchase ITC"
            icon={AlertCircle}
            iconColor="amber"
          />
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab('GSTR1')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'GSTR1' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            GSTR-1 Monthly Return (B2B & HSN Summary)
          </button>
          <button
            onClick={() => setActiveTab('GSTR3B')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'GSTR3B' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            GSTR-3B Tax Computation & ITC Offset
          </button>
        </div>

        {activeTab === 'GSTR1' ? (
          <div className="space-y-6">
            {/* B2B Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Table 4: B2B Invoices ({gstr1.b2bInvoices.length})</h3>
                  <p className="text-xs text-slate-400">Sales made to registered GSTIN businesses</p>
                </div>
                <button
                  onClick={handleExportGSTR1_B2B}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Download Table 4 CSV →
                </button>
              </div>

              <DataTable
                data={gstr1.b2bInvoices}
                columns={b2bColumns}
                searchPlaceholder="Search B2B invoices..."
                searchKeys={['gstin', 'customerName', 'invoiceNumber']}
                exportFilename="gstr1_b2b_invoices"
              />
            </div>

            {/* HSN Summary Table */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Table 12: HSN-wise Summary of Outward Supplies</h3>
                  <p className="text-xs text-slate-400">Consolidated product category quantities and tax heads</p>
                </div>
                <button
                  onClick={handleExportGSTR1_HSN}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Download Table 12 CSV →
                </button>
              </div>

              <DataTable
                data={gstr1.hsnSummary}
                columns={hsnColumns}
                searchPlaceholder="Search HSN codes or descriptions..."
                searchKeys={['hsnCode', 'description']}
                exportFilename="gstr1_hsn_summary"
              />
            </div>
          </div>
        ) : (
          /* ========================================================== */
          /* GSTR-3B TAX COMPUTATION VIEW                               */
          /* ========================================================== */
          <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-white">GSTR-3B Monthly Return Summary</h3>
              <p className="text-xs text-slate-400">Computation of tax liability and Input Tax Credit (ITC) offset for the tax period</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                  <th className="p-3 border-r border-slate-800">Nature of Supplies / Section</th>
                  <th className="p-3 border-r border-slate-800 text-right">Taxable Value</th>
                  <th className="p-3 border-r border-slate-800 text-right">Integrated Tax (IGST)</th>
                  <th className="p-3 border-r border-slate-800 text-right">Central Tax (CGST)</th>
                  <th className="p-3 text-right">State Tax (SGST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {/* 3.1 Outward Taxable Supplies */}
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 border-r border-slate-800 font-bold text-white">
                    3.1 (a) Outward Taxable Supplies (Output Liability)
                  </td>
                  <td className="p-3 border-r border-slate-800 text-right font-semibold text-slate-200">
                    {formatINR(gstr3b.outwardTaxableSupplies.taxableValue)}
                  </td>
                  <td className="p-3 border-r border-slate-800 text-right text-rose-400 font-bold">
                    {formatINR(gstr3b.outwardTaxableSupplies.igst)}
                  </td>
                  <td className="p-3 border-r border-slate-800 text-right text-rose-400 font-bold">
                    {formatINR(gstr3b.outwardTaxableSupplies.cgst)}
                  </td>
                  <td className="p-3 text-right text-rose-400 font-bold">
                    {formatINR(gstr3b.outwardTaxableSupplies.sgst)}
                  </td>
                </tr>

                {/* 4. Eligible ITC */}
                <tr className="hover:bg-slate-800/30 bg-slate-950/40">
                  <td className="p-3 border-r border-slate-800 font-bold text-white">
                    4. (A) Eligible Input Tax Credit (ITC from Purchases)
                  </td>
                  <td className="p-3 border-r border-slate-800 text-right font-semibold text-slate-200">
                    {formatINR(gstr3b.eligibleITC.taxableValue)}
                  </td>
                  <td className="p-3 border-r border-slate-800 text-right text-emerald-400 font-bold">
                    {formatINR(gstr3b.eligibleITC.igst)}
                  </td>
                  <td className="p-3 border-r border-slate-800 text-right text-emerald-400 font-bold">
                    {formatINR(gstr3b.eligibleITC.cgst)}
                  </td>
                  <td className="p-3 text-right text-emerald-400 font-bold">
                    {formatINR(gstr3b.eligibleITC.sgst)}
                  </td>
                </tr>

                {/* 5. Net Tax Payable in Cash */}
                <tr className="bg-indigo-950/40 font-extrabold text-sm">
                  <td className="p-3.5 border-r border-slate-800 text-white">
                    5. Net Tax Payable in Cash (Output - ITC)
                  </td>
                  <td className="p-3.5 border-r border-slate-800 text-right text-slate-400 font-normal">-</td>
                  <td className="p-3.5 border-r border-slate-800 text-right text-amber-400">
                    {formatINR(gstr3b.netTaxPayable.igst)}
                  </td>
                  <td className="p-3.5 border-r border-slate-800 text-right text-amber-400">
                    {formatINR(gstr3b.netTaxPayable.cgst)}
                  </td>
                  <td className="p-3.5 text-right text-amber-400">
                    {formatINR(gstr3b.netTaxPayable.sgst)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Net GST Cash Challan Required:</span>
                <h4 className="text-2xl font-black text-emerald-400 mt-0.5">{formatINR(gstr3b.netTaxPayable.total, true)}</h4>
              </div>
              <button
                onClick={() => exportToCSV('GSTR3B_Monthly_Tax_Challan', [gstr3b.netTaxPayable])}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 text-black" />
                <span>Export GSTR-3B Challan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
