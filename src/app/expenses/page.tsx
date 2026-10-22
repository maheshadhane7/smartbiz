'use client';

import React, { useState } from 'react';
import {
  ReceiptIndianRupee,
  Plus,
  Search,
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory, PaymentMode } from '../../lib/types';
import { formatINR, formatDateTime, formatDate } from '../../lib/utils';

const EXPENSE_COLORS = ['#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#64748b'];

export default function ExpensesPage() {
  const { expenses, invoices, addExpense } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PL_STATEMENT'>('EXPENSES');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('RENT');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('5000');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formMode, setFormMode] = useState<PaymentMode>('UPI');
  const [formHasGst, setFormHasGst] = useState(false);
  const [formGstin, setFormGstin] = useState('');

  // Financial P&L Computations
  const validInvoices = invoices.filter(i => i.status !== 'CANCELLED');
  const totalRevenue = validInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // COGS estimate
  const cogs = totalRevenue * 0.64;
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfit = grossProfit - totalExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Group by category for Chart
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
  }

  const expenseChartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount) || 0;
    if (amt <= 0) return;

    const taxAmount = formHasGst ? (amt * 18) / 100 : 0;

    const exp = addExpense({
      category: formCategory,
      description: formDescription,
      amount: amt,
      taxAmount,
      paymentMode: formMode,
      paidTo: formPaidTo || 'Vendor Ledger',
      date: new Date().toISOString(),
      recordedBy: `${currentUser.name} (${currentUser.role})`,
      hasGst: formHasGst,
      gstin: formGstin,
    });

    setModalOpen(false);
    showToast({
      title: 'Expense Recorded',
      message: `${exp.voucherNumber} for ${formatINR(exp.amount)} under ${exp.category}`,
      type: 'success',
    });
  };

  const filteredExpenses = expenses.filter(e => {
    return categoryFilter === 'ALL' || e.category === categoryFilter;
  });

  const columns: Column<Expense>[] = [
    {
      header: 'Voucher & Date',
      accessorKey: 'voucherNumber',
      sortable: true,
      cell: e => (
        <div>
          <h4 className="font-bold text-white text-xs font-mono">{e.voucherNumber}</h4>
          <span className="text-[10px] text-slate-400">{formatDate(e.date)}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: e => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 uppercase">
          {e.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Description & Paid To',
      accessorKey: 'description',
      cell: e => (
        <div>
          <h5 className="font-semibold text-white text-xs">{e.description}</h5>
          <span className="text-[10px] text-slate-400">Paid to: {e.paidTo} • Mode: {e.paymentMode}</span>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      align: 'right',
      cell: e => <span className="font-bold text-rose-400 text-xs">{formatINR(e.amount)}</span>,
    },
    {
      header: 'GST Input',
      accessorKey: 'taxAmount',
      sortable: true,
      align: 'right',
      cell: e => (
        <span className="text-xs text-slate-400 font-mono">
          {e.taxAmount > 0 ? formatINR(e.taxAmount) : '-'}
        </span>
      ),
    },
    {
      header: 'Recorded By',
      accessorKey: 'recordedBy',
      cell: e => <span className="text-xs text-slate-400">{e.recordedBy}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Expense Management & Profit / Loss (P&L)
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {expenses.length} Vouchers
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record business operating expenses, calculate COGS, Gross Profit & Net Profit margins in real-time
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Record Expense Voucher</span>
          </button>
        </div>

        {/* P&L Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatINR(totalRevenue)}
            subtitle="Gross sales turnover"
            icon={TrendingUp}
            iconColor="emerald"
          />

          <MetricCard
            title="Total Operating Expenses"
            value={formatINR(totalExpenses)}
            subtitle={`${expenses.length} expense vouchers`}
            icon={TrendingDown}
            iconColor="rose"
          />

          <MetricCard
            title="Gross Profit"
            value={formatINR(grossProfit)}
            subtitle={`Gross Margin: ${grossMargin.toFixed(1)}%`}
            icon={ReceiptIndianRupee}
            iconColor="indigo"
          />

          <MetricCard
            title="Net Business Profit"
            value={formatINR(netProfit)}
            subtitle={`Net Margin: ${netMargin.toFixed(1)}%`}
            icon={DollarSign}
            iconColor="cyan"
          />
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'EXPENSES' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Expense Vouchers Register ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('PL_STATEMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'PL_STATEMENT' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Profit & Loss Financial Statement
          </button>
        </div>

        {activeTab === 'EXPENSES' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <DataTable
                data={filteredExpenses}
                columns={columns}
                searchPlaceholder="Search expenses by description, paid to, or category..."
                searchKeys={['voucherNumber', 'description', 'paidTo', 'category']}
                exportFilename="business_expenses_register"
                filterComponent={
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Expense Categories</option>
                    <option value="RENT">Rent</option>
                    <option value="SALARY">Staff Salaries</option>
                    <option value="ELECTRICITY">Electricity Utilities</option>
                    <option value="TRANSPORT">Logistics & Freight</option>
                    <option value="MARKETING">Marketing & Ads</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="PACKAGING">Packaging</option>
                  </select>
                }
              />
            </div>

            {/* Expense Distribution Chart (1 col) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Expense Distribution</h3>
                <p className="text-xs text-slate-400">Share of business overheads</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val: any) => [formatINR(Number(val)), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                {expenseChartData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span className="text-slate-300">{c.name}</span>
                    </div>
                    <span className="font-bold text-white">{formatINR(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================== */
          /* PROFIT & LOSS STATEMENT                                    */
          /* ========================================================== */
          <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Profit & Loss Statement (Year-to-Date)</h3>
              <p className="text-xs text-slate-400">Computed automatically from live invoices, COGS, and expense vouchers</p>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {/* Revenue */}
              <div className="py-3 flex justify-between font-bold text-white text-sm">
                <span>1. Total Gross Revenue (Sales Turnover)</span>
                <span className="text-emerald-400">{formatINR(totalRevenue, true)}</span>
              </div>

              {/* COGS */}
              <div className="py-3 flex justify-between text-slate-300 pl-4">
                <span>Less: Cost of Goods Sold (COGS - 64%)</span>
                <span className="text-rose-400">-{formatINR(cogs, true)}</span>
              </div>

              {/* Gross Profit */}
              <div className="py-3.5 flex justify-between font-bold text-white text-sm bg-slate-950/40 px-3 rounded-xl">
                <span>2. Gross Profit (Revenue - COGS)</span>
                <span className="text-indigo-300">{formatINR(grossProfit, true)} ({grossMargin.toFixed(1)}%)</span>
              </div>

              {/* Operating Expenses list */}
              <div className="py-3 space-y-2 pl-4">
                <span className="font-semibold text-slate-400 block">Less: Operating Expenses (Overheads):</span>
                {Array.from(categoryMap.entries()).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-slate-400">
                    <span>• {cat.replace(/_/g, ' ')}</span>
                    <span className="text-slate-300 font-mono">-{formatINR(amt, true)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-rose-400 pt-1 border-t border-slate-800/60">
                  <span>Total Operating Expenses</span>
                  <span>-{formatINR(totalExpenses, true)}</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="py-4 flex justify-between font-extrabold text-base text-white bg-indigo-950/40 px-4 rounded-2xl border border-indigo-500/30">
                <span>3. Net Business Profit</span>
                <span className="text-emerald-400 text-lg">{formatINR(netProfit, true)} ({netMargin.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Record Expense Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Record Expense Voucher</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Expense Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-bold"
                  >
                    <option value="RENT">Rent (Warehouse / Showroom)</option>
                    <option value="SALARY">Staff Salaries & Wages</option>
                    <option value="ELECTRICITY">Electricity & Power Utility</option>
                    <option value="TRANSPORT">Transport & Freight Logistics</option>
                    <option value="MARKETING">Marketing & Advertising</option>
                    <option value="MAINTENANCE">Repairs & Maintenance</option>
                    <option value="PACKAGING">Packaging & Carry Bags</option>
                    <option value="INTERNET_PHONE">Internet & Telephone</option>
                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                    <option value="OTHER">Other Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-rose-400 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Description / Purpose *</label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="e.g. Monthly Warehouse Rent for July"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Paid To (Vendor/Person)</label>
                    <input
                      type="text"
                      value={formPaidTo}
                      onChange={e => setFormPaidTo(e.target.value)}
                      placeholder="e.g. Landlord, MSEDCL"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Payment Mode</label>
                    <select
                      value={formMode}
                      onChange={e => setFormMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    >
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Card</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="hasgst"
                    checked={formHasGst}
                    onChange={e => setFormHasGst(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="hasgst" className="text-xs text-slate-300 font-medium">
                    Expense includes GST (Eligible for Input Tax Credit)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2"
                >
                  Save Expense Voucher
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
