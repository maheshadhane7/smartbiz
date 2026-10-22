'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Building,
  ArrowDownRight,
  X,
  FileText,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { PurchaseOrder, Supplier } from '../../lib/types';
import { formatINR, formatDate } from '../../lib/utils';

export default function PurchasesPage() {
  const { purchases, suppliers, products, createPurchaseOrder, receivePurchaseOrder } = useData();
  const { showToast } = useNotification();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: products[0]?.id || '', quantity: 20, unitPrice: products[0]?.costPrice || 100 },
  ]);

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const pendingGRNCount = purchases.filter(p => p.status === 'ORDERED').length;
  const receivedGRNCount = purchases.filter(p => p.status === 'RECEIVED').length;

  const handleAddItemRow = () => {
    setPoItems([...poItems, { productId: products[0]?.id || '', quantity: 10, unitPrice: products[0]?.costPrice || 100 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) return;

    let taxableTotal = 0;
    let gstTotal = 0;

    const formattedItems = poItems.map(row => {
      const prod = products.find(p => p.id === row.productId);
      const taxable = row.unitPrice * row.quantity;
      const gst = (taxable * (prod?.gstRate || 18)) / 100;
      taxableTotal += taxable;
      gstTotal += gst;

      return {
        productId: row.productId,
        productName: prod?.name || 'Item',
        hsnCode: prod?.hsnCode || '1512',
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        gstRate: prod?.gstRate || 18,
        taxableAmount: taxable,
        gstAmount: gst,
        totalAmount: taxable + gst,
      };
    });

    const grandTotal = taxableTotal + gstTotal;

    const po = createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      supplierGstin: sup.gstin,
      items: formattedItems,
      taxableTotal,
      gstTotal,
      grandTotal,
      paidAmount: grandTotal,
      balanceAmount: 0,
      status: 'ORDERED',
      orderDate: new Date().toISOString(),
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notes: 'Standard replenishment purchase order.',
    });

    setCreateModalOpen(false);
    showToast({
      title: 'Purchase Order Created',
      message: `${po.poNumber} issued to ${sup.name} (${formatINR(po.grandTotal)})`,
      type: 'success',
    });
  };

  const handleReceiveGRN = (po: PurchaseOrder) => {
    receivePurchaseOrder(po.id);
    showToast({
      title: 'GRN Confirmed & Stock Replenished',
      message: `Updated inventory for ${po.items.length} items automatically.`,
      type: 'success',
    });
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      header: 'PO Number & Date',
      accessorKey: 'poNumber',
      sortable: true,
      cell: po => (
        <div>
          <h4 className="font-bold text-white text-xs font-mono">{po.poNumber}</h4>
          <span className="text-[10px] text-slate-400">{formatDate(po.orderDate)}</span>
        </div>
      ),
    },
    {
      header: 'Supplier Name',
      accessorKey: 'supplierName',
      sortable: true,
      cell: po => (
        <div>
          <h4 className="font-bold text-white text-xs">{po.supplierName}</h4>
          <span className="text-[10px] text-slate-400 font-mono">GSTIN: {po.supplierGstin}</span>
        </div>
      ),
    },
    {
      header: 'Items Ordered',
      align: 'center',
      cell: po => (
        <span className="text-xs font-semibold text-slate-300">
          {po.items.length} items ({po.items.reduce((s, i) => s + i.quantity, 0)} units)
        </span>
      ),
    },
    {
      header: 'Grand Total (with GST)',
      accessorKey: 'grandTotal',
      sortable: true,
      align: 'right',
      cell: po => <span className="font-extrabold text-white text-xs">{formatINR(po.grandTotal)}</span>,
    },
    {
      header: 'ITC Eligible GST',
      accessorKey: 'gstTotal',
      sortable: true,
      align: 'right',
      cell: po => <span className="font-bold text-indigo-400 text-xs">{formatINR(po.gstTotal)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      align: 'center',
      cell: po => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            po.status === 'RECEIVED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
          }`}
        >
          {po.status === 'RECEIVED' ? 'GRN Received' : 'In Transit'}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: po => (
        <div>
          {po.status === 'ORDERED' ? (
            <button
              onClick={() => handleReceiveGRN(po)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm GRN</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium">Stock Restocked</span>
          )}
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
              Purchase Orders & Goods Receipt (GRN)
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                {purchases.length} Purchase Orders
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage supplier procurements, purchase invoices, and automated inventory replenishment on GRN receipt
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Create Purchase Order</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Procurement Volume"
            value={formatINR(totalPurchasesAmount)}
            subtitle="Cumulative purchase expenditure"
            icon={Truck}
            iconColor="indigo"
          />

          <MetricCard
            title="Pending Inward GRN"
            value={`${pendingGRNCount} Orders`}
            subtitle="Goods in transit from suppliers"
            icon={Clock}
            iconColor="amber"
          />

          <MetricCard
            title="Stock Received & Stocked"
            value={`${receivedGRNCount} GRNs`}
            subtitle="Inventory auto-updated"
            icon={CheckCircle2}
            iconColor="emerald"
          />
        </div>

        {/* PO Data Table */}
        <DataTable
          data={purchases}
          columns={columns}
          searchPlaceholder="Search purchase orders by number, supplier, or GSTIN..."
          searchKeys={['poNumber', 'supplierName', 'supplierGstin']}
          exportFilename="purchases_grn_register"
        />

        {/* Create PO Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up my-8">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Create Purchase Order (PO)</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Select Vendor / Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.categories.join(', ')}) - GSTIN: {s.gstin}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">Order Items & Quantities</label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {poItems.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <select
                          value={row.productId}
                          onChange={e => {
                            const newItems = [...poItems];
                            newItems[idx].productId = e.target.value;
                            const prod = products.find(p => p.id === e.target.value);
                            if (prod) newItems[idx].unitPrice = prod.costPrice;
                            setPoItems(newItems);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.currentStock})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={e => {
                            const newItems = [...poItems];
                            newItems[idx].quantity = parseInt(e.target.value, 10) || 1;
                            setPoItems(newItems);
                          }}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white text-right"
                        />

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate"
                          value={row.unitPrice}
                          onChange={e => {
                            const newItems = [...poItems];
                            newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                            setPoItems(newItems);
                          }}
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white text-right font-mono"
                        />

                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
