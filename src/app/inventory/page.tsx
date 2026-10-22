'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  Plus,
  RefreshCw,
  Clock,
  Truck,
  TrendingUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { AIInventoryPrediction, StockMovement } from '../../lib/types';
import { formatINR, formatDateTime } from '../../lib/utils';
import { generateInventoryPredictions } from '../../lib/ai/forecastEngine';

export default function InventoryPage() {
  const { products, invoices, stockMovements, adjustStock } = useData();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'FORECAST' | 'MOVEMENTS'>('FORECAST');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  // Adjustment Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<StockMovement['type']>('IN');
  const [adjustQty, setAdjustQty] = useState('10');
  const [adjustReason, setAdjustReason] = useState('Stock replenishment');

  // Compute AI Predictions
  const predictions = generateInventoryPredictions(products, invoices);
  const criticalItems = predictions.filter(p => p.status === 'CRITICAL_STOCKOUT');
  const lowStockItems = predictions.filter(p => p.status === 'LOW_STOCK');

  // Total valuation
  const costValuation = products.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);
  const retailValuation = products.reduce((sum, p) => sum + p.sellingPrice * p.currentStock, 0);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustQty, 10) || 0;
    if (qty <= 0) return;

    adjustStock(selectedProductId, qty, adjustType, adjustReason);
    setAdjustmentModalOpen(false);
    showToast({
      title: 'Stock Adjusted',
      message: `Recorded ${adjustType} of ${qty} units.`,
      type: 'success',
    });
  };

  const forecastColumns: Column<AIInventoryPrediction>[] = [
    {
      header: 'Product Name',
      accessorKey: 'productName',
      sortable: true,
      cell: p => (
        <div>
          <h4 className="font-bold text-white text-xs">{p.productName}</h4>
          <span className="text-[11px] text-slate-400">Daily Sales Rate: ~{p.dailyVelocity} units/day</span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      accessorKey: 'currentStock',
      sortable: true,
      align: 'right',
      cell: p => <span className="font-bold text-slate-200 text-xs">{p.currentStock} units</span>,
    },
    {
      header: 'Run-Out Estimation',
      accessorKey: 'daysRemaining',
      sortable: true,
      align: 'center',
      cell: p => {
        const isCritical = p.status === 'CRITICAL_STOCKOUT';
        const isLow = p.status === 'LOW_STOCK';
        return (
          <span
            className={`font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                : isLow
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isCritical && <AlertTriangle className="w-3 h-3" />}
            {p.daysRemaining === 0 ? 'Stock Out' : `${p.daysRemaining} days left`}
          </span>
        );
      },
    },
    {
      header: 'Est. Depletion Date',
      accessorKey: 'estimatedStockoutDate',
      sortable: true,
      cell: p => <span className="font-mono text-slate-300 text-xs">{p.estimatedStockoutDate}</span>,
    },
    {
      header: 'Recommended Reorder (EOQ)',
      accessorKey: 'recommendedReorderQuantity',
      sortable: true,
      align: 'right',
      cell: p => (
        <span className="font-bold text-cyan-400 text-xs">
          +{p.recommendedReorderQuantity} units
        </span>
      ),
    },
    {
      header: 'AI Confidence',
      accessorKey: 'confidenceScore',
      sortable: true,
      align: 'center',
      cell: p => (
        <span className="text-[11px] font-semibold text-slate-300">
          {p.confidenceScore}% Model Match
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: p => (
        <Link
          href="/purchases"
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition inline-block shadow-sm"
        >
          Create PO ({p.recommendedReorderQuantity})
        </Link>
      ),
    },
  ];

  const movementColumns: Column<StockMovement>[] = [
    {
      header: 'Date & Time',
      accessorKey: 'createdAt',
      sortable: true,
      cell: m => <span className="text-xs text-slate-400 font-mono">{formatDateTime(m.createdAt)}</span>,
    },
    {
      header: 'Product',
      accessorKey: 'productName',
      sortable: true,
      cell: m => <span className="font-bold text-white text-xs">{m.productName}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: m => {
        const isIn = m.type === 'IN' || m.type === 'RETURN';
        return (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {m.type}
          </span>
        );
      },
    },
    {
      header: 'Qty Changed',
      accessorKey: 'quantity',
      sortable: true,
      align: 'right',
      cell: m => <span className="font-bold text-white text-xs">{m.quantity}</span>,
    },
    {
      header: 'Previous -> New',
      align: 'center',
      cell: m => (
        <span className="font-mono text-xs text-slate-400">
          {m.previousStock} → <strong className="text-white">{m.newStock}</strong>
        </span>
      ),
    },
    {
      header: 'Reason / Reference',
      accessorKey: 'reason',
      cell: m => <span className="text-xs text-slate-300">{m.reason}</span>,
    },
    {
      header: 'Recorded By',
      accessorKey: 'createdBy',
      cell: m => <span className="text-xs text-slate-400">{m.createdBy}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Inventory & AI Stock Forecasting Hub
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI DEMAND ENGINE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live run-out predictions, Economic Order Quantity (EOQ) replenishment & stock adjustment trail
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdjustmentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Stock In / Out / Adjust</span>
            </button>
          </div>
        </div>

        {/* Valuation KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Stock Value (Cost)"
            value={formatINR(costValuation)}
            subtitle="Wholesale asset capital invested"
            icon={Boxes}
            iconColor="indigo"
          />

          <MetricCard
            title="Total Retail Valuation"
            value={formatINR(retailValuation)}
            subtitle={`Potential Margin: ${formatINR(retailValuation - costValuation)}`}
            icon={TrendingUp}
            iconColor="emerald"
          />

          <MetricCard
            title="Critical Stockouts"
            value={`${criticalItems.length} items`}
            subtitle="Will run out within 3 days"
            icon={AlertTriangle}
            iconColor="rose"
          />

          <MetricCard
            title="Low Stock Reorders"
            value={`${lowStockItems.length} items`}
            subtitle="Reorder buffer needed"
            icon={Truck}
            iconColor="amber"
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab('FORECAST')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'FORECAST' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Demand Forecast & Run-out Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'MOVEMENTS' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Stock Movements & Audit Logs ({stockMovements.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'FORECAST' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">How AI Demand Forecasting Works:</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  The model dynamically analyzes 30-day billing velocity, invoice frequency, and seasonal spikes. It computes the exact number of days until stock depletion and calculates optimal Economic Order Quantities (EOQ) to prevent revenue loss.
                </p>
              </div>
            </div>

            <DataTable
              data={predictions}
              columns={forecastColumns}
              searchPlaceholder="Filter AI stock predictions..."
              searchKeys={['productName']}
              exportFilename="ai_inventory_forecast"
            />
          </div>
        ) : (
          <DataTable
            data={stockMovements}
            columns={movementColumns}
            searchPlaceholder="Search movement audit trail by product or reason..."
            searchKeys={['productName', 'reason', 'type', 'createdBy']}
            exportFilename="stock_movements_log"
          />
        )}

        {/* Stock Adjustment Modal */}
        {adjustmentModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Manual Stock Adjustment</h3>
                <button onClick={() => setAdjustmentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Select Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Adjustment Type *</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-bold"
                  >
                    <option value="IN">Stock IN (+ Restock)</option>
                    <option value="OUT">Stock OUT (- Manual deduction)</option>
                    <option value="DAMAGE">Damaged / Expired Write-off</option>
                    <option value="ADJUSTMENT">Physical Audit Override</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustQty}
                    onChange={e => setAdjustQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Reason for Adjustment</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    placeholder="e.g. Warehouse count reconciliation, Damaged in transit"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2"
                >
                  Save Stock Adjustment
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
