'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Banknote,
  Smartphone,
  Building,
  Receipt,
  Printer,
  X,
  Share2,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Invoice, PaymentMode, PaymentRecord } from '../../lib/types';
import { formatINR, formatDateTime, formatDate, getDaysDifference } from '../../lib/utils';
import confetti from 'canvas-confetti';

export default function PaymentsPage() {
  const { invoices, payments, customers, recordPayment } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'RECEIPTS'>('RECEIVABLES');
  const [agingFilter, setAgingFilter] = useState<'ALL' | 'DUE_TODAY' | '1_7' | '8_30' | '30_PLUS'>('ALL');

  // Collect Payment Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState<PaymentMode>('UPI');
  const [collectNotes, setCollectNotes] = useState('');

  // Receivables computation
  const unpaidInvoices = invoices.filter(i => i.balanceAmount > 0 && i.status !== 'CANCELLED');
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);

  // Aging classifications
  const dueTodayInvoices = unpaidInvoices.filter(i => getDaysDifference(i.dueDate) === 0);
  const overdue1to7 = unpaidInvoices.filter(i => {
    const diff = getDaysDifference(i.dueDate);
    return diff > 0 && diff <= 7;
  });
  const overdue8to30 = unpaidInvoices.filter(i => {
    const diff = getDaysDifference(i.dueDate);
    return diff > 7 && diff <= 30;
  });
  const overdue30Plus = unpaidInvoices.filter(i => getDaysDifference(i.dueDate) > 30);

  // Filtered unpaid invoices based on aging filter
  const filteredUnpaidInvoices = unpaidInvoices.filter(inv => {
    const daysOverdue = getDaysDifference(inv.dueDate);
    if (agingFilter === 'DUE_TODAY') return daysOverdue === 0;
    if (agingFilter === '1_7') return daysOverdue > 0 && daysOverdue <= 7;
    if (agingFilter === '8_30') return daysOverdue > 7 && daysOverdue <= 30;
    if (agingFilter === '30_PLUS') return daysOverdue > 30;
    return true;
  });

  const handleOpenCollectModal = (inv: Invoice) => {
    setTargetInvoice(inv);
    setCollectAmount(inv.balanceAmount.toString());
    setCollectMode('UPI');
    setCollectNotes('');
    setCollectModalOpen(true);
  };

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoice) return;

    const amt = parseFloat(collectAmount) || 0;
    if (amt <= 0 || amt > targetInvoice.balanceAmount) {
      showToast({ title: 'Invalid Amount', message: 'Enter a valid payment amount.', type: 'warning' });
      return;
    }

    const receipt = recordPayment({
      invoiceId: targetInvoice.id,
      invoiceNumber: targetInvoice.invoiceNumber,
      customerId: targetInvoice.customerId,
      customerName: targetInvoice.customerName,
      amount: amt,
      paymentMode: collectMode,
      status: 'SUCCESS',
      recordedBy: `${currentUser.name} (${currentUser.role})`,
      notes: collectNotes,
    });

    try {
      confetti({ particleCount: 60, spread: 60 });
    } catch (err) {}

    setCollectModalOpen(false);
    showToast({
      title: 'Payment Recorded',
      message: `Receipt ${receipt.receiptNumber} of ${formatINR(amt)} collected via ${collectMode}`,
      type: 'success',
    });
  };

  const receivablesColumns: Column<Invoice>[] = [
    {
      header: 'Invoice & Customer',
      accessorKey: 'invoiceNumber',
      sortable: true,
      cell: i => (
        <div>
          <h4 className="font-bold text-white text-xs">{i.invoiceNumber}</h4>
          <p className="text-[11px] text-slate-400 font-medium">{i.customerName} • {i.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Invoice Date',
      accessorKey: 'createdAt',
      sortable: true,
      cell: i => <span className="text-xs text-slate-400 font-mono">{formatDate(i.createdAt)}</span>,
    },
    {
      header: 'Due Date & Aging',
      accessorKey: 'dueDate',
      sortable: true,
      align: 'center',
      cell: i => {
        const daysOver = getDaysDifference(i.dueDate);
        return (
          <div className="inline-flex flex-col items-center">
            <span className="text-xs font-mono text-slate-300">{formatDate(i.dueDate)}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.2 rounded-full mt-0.5 ${
                daysOver > 30
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : daysOver > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {daysOver > 0 ? `${daysOver}d Overdue` : daysOver === 0 ? 'Due Today' : 'Upcoming'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Grand Total',
      accessorKey: 'grandTotal',
      sortable: true,
      align: 'right',
      cell: i => <span className="font-bold text-slate-200 text-xs">{formatINR(i.grandTotal)}</span>,
    },
    {
      header: 'Paid Amount',
      accessorKey: 'paidAmount',
      sortable: true,
      align: 'right',
      cell: i => <span className="font-bold text-emerald-400 text-xs">{formatINR(i.paidAmount)}</span>,
    },
    {
      header: 'Pending Balance',
      accessorKey: 'balanceAmount',
      sortable: true,
      align: 'right',
      cell: i => (
        <span className="font-extrabold text-rose-400 text-xs">
          {formatINR(i.balanceAmount)}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: i => (
        <button
          onClick={() => handleOpenCollectModal(i)}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
        >
          Collect Pay
        </button>
      ),
    },
  ];

  const receiptsColumns: Column<PaymentRecord>[] = [
    {
      header: 'Receipt No & Date',
      accessorKey: 'receiptNumber',
      sortable: true,
      cell: p => (
        <div>
          <h4 className="font-bold text-white text-xs font-mono">{p.receiptNumber}</h4>
          <span className="text-[10px] text-slate-400">{formatDateTime(p.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Customer & Invoice',
      accessorKey: 'customerName',
      sortable: true,
      cell: p => (
        <div>
          <h4 className="font-bold text-white text-xs">{p.customerName}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Invoice: {p.invoiceNumber}</span>
        </div>
      ),
    },
    {
      header: 'Payment Mode',
      accessorKey: 'paymentMode',
      sortable: true,
      align: 'center',
      cell: p => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 uppercase">
          {p.paymentMode}
        </span>
      ),
    },
    {
      header: 'Collected Amount',
      accessorKey: 'amount',
      sortable: true,
      align: 'right',
      cell: p => <span className="font-bold text-emerald-400 text-xs">{formatINR(p.amount)}</span>,
    },
    {
      header: 'Recorded By',
      accessorKey: 'recordedBy',
      cell: p => <span className="text-xs text-slate-300">{p.recordedBy}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      align: 'center',
      cell: p => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
          {p.status}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Outstanding Debtors & Payments Ledger
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {unpaidInvoices.length} Unsettled Bills
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track aging debt buckets, collect partial/full payments & record transaction receipts
            </p>
          </div>
        </div>

        {/* Aging Debt Bucket Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setAgingFilter(agingFilter === 'DUE_TODAY' ? 'ALL' : 'DUE_TODAY')}
            className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer select-none ${
              agingFilter === 'DUE_TODAY' ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Due Today</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">
              {formatINR(dueTodayInvoices.reduce((s, i) => s + i.balanceAmount, 0))}
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">{dueTodayInvoices.length} invoices due today</span>
          </div>

          <div
            onClick={() => setAgingFilter(agingFilter === '1_7' ? 'ALL' : '1_7')}
            className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer select-none ${
              agingFilter === '1_7' ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">1 – 7 Days Overdue</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">
              {formatINR(overdue1to7.reduce((s, i) => s + i.balanceAmount, 0))}
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">{overdue1to7.length} invoices overdue</span>
          </div>

          <div
            onClick={() => setAgingFilter(agingFilter === '8_30' ? 'ALL' : '8_30')}
            className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer select-none ${
              agingFilter === '8_30' ? 'border-orange-500 bg-orange-950/20' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">8 – 30 Days Overdue</span>
              <AlertCircle className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-orange-400 mt-1">
              {formatINR(overdue8to30.reduce((s, i) => s + i.balanceAmount, 0))}
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">{overdue8to30.length} invoices overdue</span>
          </div>

          <div
            onClick={() => setAgingFilter(agingFilter === '30_PLUS' ? 'ALL' : '30_PLUS')}
            className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer select-none ${
              agingFilter === '30_PLUS' ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">30+ Days Critical</span>
              <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">
              {formatINR(overdue30Plus.reduce((s, i) => s + i.balanceAmount, 0))}
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">{overdue30Plus.length} critical invoices</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab('RECEIVABLES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'RECEIVABLES' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Outstanding Invoices ({filteredUnpaidInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('RECEIPTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'RECEIPTS' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Payment Receipts Ledger ({payments.length})
          </button>
        </div>

        {/* Tables */}
        {activeTab === 'RECEIVABLES' ? (
          <DataTable
            data={filteredUnpaidInvoices}
            columns={receivablesColumns}
            searchPlaceholder="Search unpaid invoices by number, customer, or phone..."
            searchKeys={['invoiceNumber', 'customerName', 'customerPhone']}
            exportFilename="outstanding_debtors_report"
          />
        ) : (
          <DataTable
            data={payments}
            columns={receiptsColumns}
            searchPlaceholder="Search receipts by number, customer, or payment mode..."
            searchKeys={['receiptNumber', 'customerName', 'invoiceNumber', 'paymentMode', 'recordedBy']}
            exportFilename="payment_receipts_ledger"
          />
        )}

        {/* Collect Payment Modal */}
        {collectModalOpen && targetInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Collect Outstanding Payment</h3>
                  <p className="text-xs text-slate-400 font-mono">{targetInvoice.invoiceNumber} • {targetInvoice.customerName}</p>
                </div>
                <button onClick={() => setCollectModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount Overview */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Total Invoiced</span>
                  <span className="font-bold text-white">{formatINR(targetInvoice.grandTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Already Paid</span>
                  <span className="font-bold text-emerald-400">{formatINR(targetInvoice.paidAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Balance Outstanding</span>
                  <span className="font-extrabold text-rose-400">{formatINR(targetInvoice.balanceAmount)}</span>
                </div>
              </div>

              <form onSubmit={handleCollectSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Payment Amount to Collect (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    max={targetInvoice.balanceAmount}
                    value={collectAmount}
                    onChange={e => setCollectAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-base font-extrabold text-emerald-400 mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {(['UPI', 'CASH', 'CARD', 'BANK_TRANSFER'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCollectMode(mode)}
                        className={`py-2 rounded-xl text-xs font-semibold uppercase transition ${
                          collectMode === mode
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {mode === 'BANK_TRANSFER' ? 'BANK' : mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-semibold">Transaction Reference / UTR (Optional)</label>
                  <input
                    type="text"
                    value={collectNotes}
                    onChange={e => setCollectNotes(e.target.value)}
                    placeholder="e.g. UPI Ref: 1029384756, Cheque No: 4432"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Confirm Receipt & Update Ledger</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
