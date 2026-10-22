'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Receipt,
  Search,
  Printer,
  Share2,
  RotateCcw,
  Plus,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Invoice, InvoiceStatus, PaymentMode, SalesReturn } from '../../lib/types';
import { formatINR, formatDateTime, formatDate } from '../../lib/utils';
import { InvoicePrintModal } from '../../components/billing/InvoicePrintModal';

export default function SalesPage() {
  const { invoices, processSalesReturn } = useData();
  const { showToast } = useNotification();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('ALL');

  // Modals
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState<Invoice | null>(null);
  const [returnReason, setReturnReason] = useState('Customer changed requirement');
  const [restockInventory, setRestockInventory] = useState(true);

  const handleOpenReturnModal = (inv: Invoice) => {
    setReturnInvoice(inv);
    setReturnReason('Customer returned damaged/unopened goods');
    setRestockInventory(true);
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoice) return;

    const returnRecord = processSalesReturn({
      invoiceId: returnInvoice.id,
      invoiceNumber: returnInvoice.invoiceNumber,
      customerId: returnInvoice.customerId,
      customerName: returnInvoice.customerName,
      items: returnInvoice.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
        refundAmount: item.totalAmount,
        reason: returnReason,
      })),
      totalRefundAmount: returnInvoice.paidAmount,
      restockInventory,
    });

    setReturnModalOpen(false);
    showToast({
      title: 'Sales Return Processed',
      message: `Return ${returnRecord.returnNumber} generated. Inventory restored.`,
      type: 'success',
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesMode = paymentModeFilter === 'ALL' || inv.paymentMode === paymentModeFilter;
    return matchesStatus && matchesMode;
  });

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice No & Date',
      accessorKey: 'invoiceNumber',
      sortable: true,
      cell: inv => (
        <div>
          <h4 className="font-bold text-white text-xs font-mono">{inv.invoiceNumber}</h4>
          <span className="text-[10px] text-slate-400">{formatDateTime(inv.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      accessorKey: 'customerName',
      sortable: true,
      cell: inv => (
        <div>
          <h4 className="font-bold text-white text-xs">{inv.customerName}</h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {inv.customerPhone} • {inv.customerState} ({inv.isInterState ? 'IGST' : 'CGST+SGST'})
          </span>
        </div>
      ),
    },
    {
      header: 'Items Count',
      align: 'center',
      cell: inv => (
        <span className="text-xs font-semibold text-slate-300">
          {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
        </span>
      ),
    },
    {
      header: 'Grand Total',
      accessorKey: 'grandTotal',
      sortable: true,
      align: 'right',
      cell: inv => <span className="font-extrabold text-white text-xs">{formatINR(inv.grandTotal)}</span>,
    },
    {
      header: 'Paid / Mode',
      accessorKey: 'paidAmount',
      sortable: true,
      align: 'right',
      cell: inv => (
        <div>
          <span className="font-bold text-emerald-400 text-xs">{formatINR(inv.paidAmount)}</span>
          <span className="text-[10px] text-slate-500 block uppercase font-mono">{inv.paymentMode}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      align: 'center',
      cell: inv => {
        const badgeStyle: Record<InvoiceStatus, string> = {
          PAID: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          PARTIAL: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
          UNPAID: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          OVERDUE: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse',
          CANCELLED: 'bg-slate-800 text-slate-500',
        };

        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle[inv.status]}`}>
            {inv.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      cell: inv => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setPrintInvoice(inv)}
            title="View & Print Tax Invoice / Thermal Receipt"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
          </button>
          <button
            onClick={() => handleOpenReturnModal(inv)}
            title="Process Sales Return & Credit Note"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
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
              Sales Invoices & Orders Register
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                {invoices.length} Invoices
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Complete historical record of B2B & B2C sales orders, GST calculations & credit notes
            </p>
          </div>

          <Link
            href="/billing"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Create New Invoice (F2)</span>
          </Link>
        </div>

        {/* Sales Table */}
        <DataTable
          data={filteredInvoices}
          columns={columns}
          searchPlaceholder="Search invoices by number, customer, or phone..."
          searchKeys={['invoiceNumber', 'customerName', 'customerPhone', 'cashierName']}
          exportFilename="sales_invoices_register"
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue</option>
              </select>

              <select
                value={paymentModeFilter}
                onChange={e => setPaymentModeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
          }
        />

        {/* Print / View Modal */}
        <InvoicePrintModal
          isOpen={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
        />

        {/* Sales Return Modal */}
        {returnModalOpen && returnInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Process Sales Return & Restock</h3>
                  <p className="text-xs text-slate-400 font-mono">{returnInvoice.invoiceNumber} • {returnInvoice.customerName}</p>
                </div>
                <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Refund Amount:</span>
                    <strong className="text-rose-400 font-bold">{formatINR(returnInvoice.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Items to Restock:</span>
                    <span className="text-white">{returnInvoice.items.length} items</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Return Reason *</label>
                  <input
                    type="text"
                    required
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="restock"
                    checked={restockInventory}
                    onChange={e => setRestockInventory(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="restock" className="text-xs text-slate-300 font-medium">
                    Automatically restore returned units back into active inventory
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 mt-2"
                >
                  Confirm Return & Issue Credit Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
