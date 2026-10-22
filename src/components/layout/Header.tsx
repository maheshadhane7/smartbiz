'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  Lock,
  Receipt,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Package,
  FileText,
  Users,
  ChevronDown,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../lib/utils';

interface HeaderProps {
  onToggleCopilot?: () => void;
}

export function Header({ onToggleCopilot }: HeaderProps) {
  const router = useRouter();
  const { currentUser, currentRole, switchRole, lockApp } = useAuth();
  const { products, invoices, customers, suppliers, anomalies, resetToFactorySeed } = useData();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Keyboard shortcut listener: '/' or 'Cmd+K' for search, 'F2' for POS billing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      } else if (e.key === 'F2') {
        e.preventDefault();
        router.push('/billing');
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Global search filtering
  const q = searchQuery.toLowerCase().trim();
  const matchedProducts = q
    ? products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 4)
    : [];
  const matchedCustomers = q
    ? customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.gstin?.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const matchedInvoices = q
    ? invoices.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const unreadAlertsCount = anomalies.length + (products.filter(p => p.currentStock <= p.minStockLevel).length > 0 ? 1 : 0);

  return (
    <>
      <header className="h-16 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Global Search Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-sm hover:border-zinc-700 hover:text-zinc-200 transition shadow-inner group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
              <span>Search products, invoices, customers...</span>
            </div>
            <kbd className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              ⌘K / F2
            </kbd>
          </button>

          <Link
            href="/billing"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-black" />
            <span>Fast POS (F2)</span>
          </Link>
        </div>

        {/* Right: Actions, AI Copilot, Notifications & Role Switch */}
        <div className="flex items-center gap-3">
          {/* AI Copilot Button */}
          <button
            onClick={onToggleCopilot}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-700 hover:border-white hover:bg-zinc-800 hover:text-white transition shadow-sm group"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold">AI Copilot</span>
          </button>

          {/* Notifications Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 z-50 animate-slide-up">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-white" />
                    Live Alerts & Notifications
                  </h3>
                  <span className="text-xs text-zinc-400">{unreadAlertsCount} active</span>
                </div>

                <div className="divide-y divide-zinc-800/60 max-h-80 overflow-y-auto my-2">
                  {anomalies.map(alert => (
                    <div key={alert.id} className="py-2.5 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{alert.title}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{alert.description}</p>
                      </div>
                    </div>
                  ))}

                  {products.filter(p => p.currentStock <= p.minStockLevel).slice(0, 3).map(prod => (
                    <div key={prod.id} className="py-2.5 flex items-start gap-3">
                      <Package className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-rose-300 truncate">Low Stock: {prod.name}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Only {prod.currentStock} {prod.unit} left (Min: {prod.minStockLevel}).</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-800 text-center">
                  <Link
                    href="/dashboard"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-zinc-300 hover:text-white font-medium underline"
                  >
                    View All Insights on Dashboard →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Lock Button */}
          <button
            onClick={lockApp}
            title="Lock POS Terminal"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition hidden sm:block"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-lg object-cover ring-1 ring-zinc-700"
              />
              <span className="text-xs font-semibold text-white capitalize">{currentRole}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1.5 z-50 animate-slide-up">
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider border-b border-zinc-800">
                  Switch Active Role
                </div>
                {(['admin', 'manager', 'cashier', 'accountant'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium capitalize transition ${
                      currentRole === role
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{role}</span>
                    {currentRole === role && <UserCheck className="w-3.5 h-3.5 text-black" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-white" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type to search products, customers, invoice numbers, SKUs..."
                className="w-full bg-transparent text-white placeholder-zinc-500 text-base focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-4">
              {q === '' ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  Search across 50+ products, 20+ customers, and 100+ invoices...
                </div>
              ) : (
                <>
                  {/* Products */}
                  {matchedProducts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Products ({matchedProducts.length})
                      </h4>
                      <div className="space-y-1.5">
                        {matchedProducts.map(p => (
                          <Link
                            key={p.id}
                            href="/products"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                          >
                            <div>
                              <p className="text-xs font-semibold text-white">{p.name}</p>
                              <p className="text-[11px] text-zinc-400 font-mono">SKU: {p.sku} | Stock: {p.currentStock} {p.unit}</p>
                            </div>
                            <span className="text-xs font-bold text-white">{formatINR(p.sellingPrice)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers */}
                  {matchedCustomers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Customers ({matchedCustomers.length})
                      </h4>
                      <div className="space-y-1.5">
                        {matchedCustomers.map(c => (
                          <Link
                            key={c.id}
                            href="/customers"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                          >
                            <div>
                              <p className="text-xs font-semibold text-white">{c.name}</p>
                              <p className="text-[11px] text-zinc-400">{c.phone} | {c.state || 'Maharashtra'}</p>
                            </div>
                            <span className="text-xs font-bold text-amber-400">Due: {formatINR(c.outstandingBalance)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoices */}
                  {matchedInvoices.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Invoices ({matchedInvoices.length})
                      </h4>
                      <div className="space-y-1.5">
                        {matchedInvoices.map(i => (
                          <Link
                            key={i.id}
                            href="/sales"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                          >
                            <div>
                              <p className="text-xs font-semibold text-white">{i.invoiceNumber} - {i.customerName}</p>
                              <p className="text-[11px] text-zinc-400">{i.createdAt.slice(0, 10)} | Mode: {i.paymentMode}</p>
                            </div>
                            <span className="text-xs font-bold text-white">{formatINR(i.grandTotal)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedProducts.length === 0 && matchedCustomers.length === 0 && matchedInvoices.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 text-sm">
                      No matching records found for "{searchQuery}".
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Press <kbd className="px-1 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono">ESC</kbd> to close</span>
              <span>Quick Billing: <kbd className="px-1 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono">F2</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
