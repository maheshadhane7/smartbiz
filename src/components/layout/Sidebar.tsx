'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Boxes,
  Users,
  PhoneCall,
  BellRing,
  CreditCard,
  TrendingUp,
  Truck,
  Building2,
  ReceiptIndianRupee,
  FileSpreadsheet,
  BotMessageSquare,
  BarChart3,
  History,
  Settings,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  permission?: string;
  isAi?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, currentRole, switchRole } = useAuth();
  const { products, invoices, callRecords, anomalies } = useData();

  // Calculate live badge counts
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockLevel).length;
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
  const scheduledCallsCount = callRecords.filter(c => c.status === 'SCHEDULED').length;

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Core Operations',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'POS Billing', href: '/billing', icon: Receipt, badge: 'Fast F2', badgeColor: 'bg-zinc-800 text-zinc-100 border border-zinc-700' },
        { name: 'Sales Orders', href: '/sales', icon: TrendingUp },
        { name: 'Payments & Due', href: '/payments', icon: CreditCard, badge: overdueCount > 0 ? overdueCount : undefined, badgeColor: 'bg-zinc-800 text-rose-300 border border-zinc-700' },
      ],
    },
    {
      group: 'ERP & Inventory',
      items: [
        { name: 'Products Catalog', href: '/products', icon: Package },
        { name: 'Inventory & Stock', href: '/inventory', icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: 'bg-zinc-800 text-amber-300 border border-zinc-700' },
        { name: 'Purchases & GRN', href: '/purchases', icon: Truck },
        { name: 'Suppliers', href: '/suppliers', icon: Building2 },
        { name: 'Expenses & P&L', href: '/expenses', icon: ReceiptIndianRupee },
      ],
    },
    {
      group: 'CRM & AI Calling',
      items: [
        { name: 'Customer CRM', href: '/customers', icon: Users },
        { name: 'AI Voice Calling', href: '/voice-calling', icon: PhoneCall, isAi: true, badge: scheduledCallsCount > 0 ? `${scheduledCallsCount} Calls` : 'Live AI', badgeColor: 'bg-zinc-800 text-zinc-200 border border-zinc-700' },
        { name: 'Smart Reminders', href: '/reminders', icon: BellRing },
      ],
    },
    {
      group: 'Intelligence & Compliance',
      items: [
        { name: 'AI Business Copilot', href: '/ai-copilot', icon: BotMessageSquare, isAi: true, badge: 'Ask DB', badgeColor: 'bg-zinc-800 text-zinc-200 border border-zinc-700' },
        { name: 'GST Filing Hub', href: '/gst', icon: FileSpreadsheet, badge: 'GSTR-1/3B', badgeColor: 'bg-zinc-800 text-zinc-200 border border-zinc-700' },
        { name: 'Reports Center', href: '/reports', icon: BarChart3 },
        { name: 'Audit Trail', href: '/audit-logs', icon: History },
        { name: 'System Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-black border-r border-zinc-800/80 flex flex-col h-screen shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 font-black">
          <Zap className="w-5 h-5 text-black fill-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm tracking-tight text-white truncate">Prasana Enterprises</h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
              ERP + CRM
            </span>
            <p className="text-[11px] text-zinc-400 truncate">Smart Business</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map(group => (
          <div key={group.group}>
            <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-white text-black font-semibold shadow-md shadow-white/5'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-black'
                            : 'text-zinc-400 group-hover:text-zinc-100'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-black/10 text-black font-bold' : item.badgeColor || 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role Switcher & User Profile Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-zinc-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Role Switch Buttons */}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {(['admin', 'manager', 'cashier', 'accountant'] as const).map(role => (
            <button
              key={role}
              onClick={() => switchRole(role)}
              title={`Switch to ${role}`}
              className={`py-1 text-[10px] font-medium rounded uppercase tracking-wider transition ${
                currentRole === role
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              {role.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
