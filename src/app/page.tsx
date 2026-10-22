'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ShieldCheck,
  Receipt,
  Users,
  PhoneCall,
  BotMessageSquare,
  ArrowRight,
  Sparkles,
  Lock,
  Boxes,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/types';
import { SEED_USERS } from '../lib/db/seedData';

export default function LandingPage() {
  const router = useRouter();
  const { switchRole, currentUser } = useAuth();
  const [email, setEmail] = useState('admin@prasanaenterprises.in');
  const [password, setPassword] = useState('password123');

  const handleLoginAsRole = (role: UserRole) => {
    switchRole(role);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-black/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 font-black">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Prasana Enterprises <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">ERP + CRM</span>
            </h1>
            <p className="text-xs text-zinc-400">Intelligent Business & Billing Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </Link>
        </div>
      </header>

      {/* Hero & Quick Access Roles */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center text-center space-y-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>POS Billing • GST Compliance • Inventory • Multilingual Voice AI Debt Recovery</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Next-Generation <br />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Prasana Enterprises ERP
            </span>
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            Engineered for high-speed POS billing, automated stockout prediction, GST filing reports, conversational AI Copilot, and automated multilingual voice debt recovery.
          </p>
        </div>

        {/* 1-Click Role Access Cards */}
        <div className="w-full max-w-4xl space-y-4 text-left">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Select Demo Role to Enter (Instant Switch):
            </h3>
            <span className="text-xs text-zinc-300 font-medium">No signup required • Live Business Data</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SEED_USERS.map(user => (
              <div
                key={user.id}
                onClick={() => handleLoginAsRole(user.role)}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-white hover:bg-zinc-900 transition-all cursor-pointer group shadow-sm hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-zinc-700 group-hover:ring-white transition"
                    />
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                      {user.role}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white group-hover:text-white transition">{user.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {user.role === 'admin' && 'Full platform access, AI setup, reports, users & database control.'}
                    {user.role === 'manager' && 'Sales, Stock forecasting, CRM, Suppliers & analytics.'}
                    {user.role === 'cashier' && 'High-speed POS Billing, dynamic UPI QR, customer bills.'}
                    {user.role === 'accountant' && 'GST (GSTR-1/3B), P&L, expenses & debtors collection.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-300 group-hover:text-white">
                  <span>Enter as {user.role}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left pt-6">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <Receipt className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-white">Smart POS Billing</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">Barcode scan, UPI QR, Thermal & A4 GST invoices</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <PhoneCall className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-white">AI Voice Calling</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">Automated debt recovery in EN, Hindi & Marathi</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <Boxes className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-white">AI Stock Forecast</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">Stockout prediction & EOQ reorder quantities</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <BotMessageSquare className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-white">AI Copilot</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">Natural language query engine over live database</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-black py-4 px-6 text-center text-xs text-zinc-500">
        Prasana Enterprises • Smart ERP & CRM Platform
      </footer>
    </div>
  );
}
