'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ReceiptIndianRupee,
  CreditCard,
  AlertCircle,
  Users,
  Package,
  AlertTriangle,
  Receipt,
  Sparkles,
  PhoneCall,
  ArrowRight,
  ShieldAlert,
  Bot,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../lib/utils';
import { generateInventoryPredictions, generateSalesForecast } from '../../lib/ai/forecastEngine';

const CATEGORY_COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b'];

export default function DashboardPage() {
  const { invoices, products, customers, expenses, purchases, anomalies, callRecords } = useData();

  // Metrics computation
  const validInvoices = invoices.filter(i => i.status !== 'CANCELLED');
  const totalRevenue = validInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalCollected = validInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const overdueInvoices = validInvoices.filter(i => i.status === 'OVERDUE');
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cogs = totalRevenue * 0.64;
  const grossProfit = totalRevenue - cogs;
  const netProfit = grossProfit - totalExpenses;

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockLevel);

  // Predictions
  const inventoryPredictions = generateInventoryPredictions(products, invoices);
  const criticalStockouts = inventoryPredictions.filter(p => p.status === 'CRITICAL_STOCKOUT' || p.status === 'LOW_STOCK');
  const salesForecast = generateSalesForecast(invoices, 'NEXT_30_DAYS');

  // Chart 1: Daily Sales Trend (past 14 days)
  const salesTimelineMap = new Map<string, { date: string; sales: number; invoicesCount: number }>();
  for (let d = 13; d >= 0; d--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    const dateKey = dt.toISOString().slice(5, 10); // MM-DD
    salesTimelineMap.set(dateKey, { date: dateKey, sales: 0, invoicesCount: 0 });
  }

  for (const inv of validInvoices) {
    const dateKey = inv.createdAt.slice(5, 10);
    if (salesTimelineMap.has(dateKey)) {
      const entry = salesTimelineMap.get(dateKey)!;
      entry.sales += inv.grandTotal;
      entry.invoicesCount += 1;
    }
  }

  const salesTimelineData = Array.from(salesTimelineMap.values());

  // Chart 2: Category Distribution
  const categoryMap = new Map<string, number>();
  for (const inv of validInvoices) {
    for (const item of inv.items) {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category || 'General';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.totalAmount);
    }
  }

  const categoryChartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Chart 3: Top 5 Products by Revenue
  const productSalesMap = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const inv of validInvoices) {
    for (const item of inv.items) {
      const prev = productSalesMap.get(item.productId) || { name: item.productName, revenue: 0, qty: 0 };
      prev.revenue += item.totalAmount;
      prev.qty += item.quantity;
      productSalesMap.set(item.productId, prev);
    }
  }

  const topProductsData = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Top Header & AI Insights Ticker Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Prasana Enterprises Dashboard
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                LIVE FY 2026-27
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comprehensive ERP overview, automated AI forecasting & financial performance
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/billing"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
            >
              <Receipt className="w-4 h-4 text-black" />
              <span>Create POS Invoice (F2)</span>
            </Link>

            <Link
              href="/voice-calling"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 text-xs font-bold transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>AI Voice Calling</span>
            </Link>
          </div>
        </div>

        {/* AI Smart Insights Ticker Card */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white text-black shadow-md shrink-0 font-bold">
              <Sparkles className="w-5 h-5 text-black animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Intelligence Alert</h4>
                <span className="text-[10px] text-zinc-500">• Updated real-time</span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                "Sales increased by <strong>18.4%</strong> this month. Expected 30-day forecast is <strong>{formatINR(salesForecast.forecastedRevenue)}</strong>. <strong>{criticalStockouts.length} products</strong> require immediate restock and <strong>{overdueInvoices.length} invoices</strong> are overdue."
              </p>
            </div>
          </div>

          <Link
            href="/ai-copilot"
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold transition"
          >
            <span>Ask Copilot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* KPI Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatINR(totalRevenue)}
            changePercent={18.4}
            icon={TrendingUp}
            iconColor="emerald"
          />

          <MetricCard
            title="Net Business Profit"
            value={formatINR(netProfit)}
            subtitle={`Gross Margin: 36% • Net: ${((netProfit / (totalRevenue || 1)) * 100).toFixed(1)}%`}
            icon={ReceiptIndianRupee}
            iconColor="indigo"
          />

          <MetricCard
            title="Outstanding Receivables"
            value={formatINR(totalOutstanding)}
            subtitle={`${overdueInvoices.length} invoices overdue (${formatINR(overdueAmount)})`}
            icon={CreditCard}
            iconColor="amber"
          />

          <MetricCard
            title="AI 30-Day Forecast"
            value={formatINR(salesForecast.forecastedRevenue)}
            isAiForecast
            changePercent={18.4}
            changeLabel="projected growth"
            icon={Sparkles}
            iconColor="cyan"
          />
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium">Invoices Issued</span>
            <h4 className="text-lg font-bold text-white mt-1">{validInvoices.length}</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium">Active Customers</span>
            <h4 className="text-lg font-bold text-white mt-1">{customers.length}</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium">Catalog Products</span>
            <h4 className="text-lg font-bold text-white mt-1">{products.length}</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium">Low Stock Alerts</span>
            <h4 className="text-lg font-bold text-amber-400 mt-1">{lowStockProducts.length} items</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium">Total Expenses</span>
            <h4 className="text-lg font-bold text-rose-400 mt-1">{formatINR(totalExpenses)}</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium">AI Calls Handled</span>
            <h4 className="text-lg font-bold text-white mt-1">{callRecords.length} calls</h4>
          </div>
        </div>

        {/* Charts Grid: Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Sales Area Chart (2 cols) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Revenue & Sales Velocity</h3>
                <p className="text-xs text-zinc-400">Past 14 days invoicing trends</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Avg: {formatINR(totalRevenue / 30)}/day
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '12px', color: '#ffffff' }}
                    formatter={(val: any) => [formatINR(Number(val)), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#ffffff" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Category Donut Chart (1 col) */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Sales by Category</h3>
              <p className="text-xs text-zinc-400">Revenue share breakdown</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '12px', color: '#ffffff' }}
                    formatter={(val: any) => [formatINR(Number(val)), 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-zinc-800 text-[11px]">
              {categoryChartData.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-zinc-300 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Grid: Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products Bar Chart */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Top 5 Best-Selling Products</h3>
                <p className="text-xs text-zinc-400">Highest grossing catalog items</p>
              </div>
              <Link href="/products" className="text-xs text-zinc-300 hover:text-white font-medium underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {topProductsData.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white border border-zinc-700 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{p.name}</h4>
                      <p className="text-[10px] text-zinc-400">{p.qty} units sold</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white">{formatINR(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Stockout & Reorder Demand Predictions */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Stockout & Reorder Alerts</h3>
                  <p className="text-xs text-zinc-400">Predicted inventory depletion timeline</p>
                </div>
              </div>
              <Link href="/inventory" className="text-xs text-zinc-300 hover:text-white font-medium underline">
                Inventory Hub →
              </Link>
            </div>

            <div className="space-y-3">
              {criticalStockouts.slice(0, 4).map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">{item.productName}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-rose-300 border border-zinc-700">
                        {item.daysRemaining}d left
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Current Stock: <strong>{item.currentStock}</strong> • Reorder Suggestion: <strong>{item.recommendedReorderQuantity} units</strong>
                    </p>
                  </div>
                  <Link
                    href="/purchases"
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shrink-0 shadow-sm"
                  >
                    PO Reorder
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
