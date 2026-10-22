'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  PhoneCall,
  Share2,
  Sparkles,
  ShieldAlert,
  CreditCard,
  Building,
  TrendingUp,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Customer, CustomerType, RiskCategory } from '../../lib/types';
import { formatINR, formatDate } from '../../lib/utils';
import { LiveCallSimulator } from '../../components/voice/LiveCallSimulator';

export default function CustomersCRMPage() {
  const { customers, invoices, addCustomer, updateCustomer } = useData();
  const { showToast } = useNotification();

  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Drawer / Modals
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [voiceModalCustomer, setVoiceModalCustomer] = useState<Customer | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formState, setFormState] = useState('Maharashtra');
  const [formStateCode, setFormStateCode] = useState('27');
  const [formAddress, setFormAddress] = useState('');
  const [formType, setFormType] = useState<CustomerType>('RETAIL');
  const [formCreditLimit, setFormCreditLimit] = useState('50000');

  // Customer Intelligence counts
  const vipCount = customers.filter(c => c.intelligence?.riskCategory === 'HIGH_VALUE').length;
  const highRiskCount = customers.filter(c => c.intelligence?.riskCategory === 'HIGH_PAYMENT_RISK').length;
  const inactiveCount = customers.filter(c => c.intelligence?.riskCategory === 'INACTIVE').length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addCustomer({
      name: formName,
      companyName: formCompany,
      phone: formPhone,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      gstin: formGstin,
      state: formState,
      stateCode: formStateCode,
      address: formAddress || 'Mumbai, Maharashtra',
      type: formType,
      creditLimit: parseFloat(formCreditLimit) || 50000,
      outstandingBalance: 0,
      totalPurchases: 0,
      totalOrders: 0,
    });

    setAddCustomerOpen(false);
    showToast({ title: 'Customer Registered', message: `${created.name} added to CRM`, type: 'success' });
  };

  const handleWhatsAppNudge = (cust: Customer) => {
    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${cust.name}, this is a gentle reminder regarding your outstanding balance of ${formatINR(cust.outstandingBalance)} with Prasana Enterprises. Please clear at your earliest convenience.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    showToast({ title: 'WhatsApp Opened', message: `Chat opened with ${cust.name}`, type: 'info' });
  };

  const filteredCustomers = customers.filter(c => {
    const matchesRisk = selectedRiskFilter === 'ALL' || c.intelligence?.riskCategory === selectedRiskFilter;
    const matchesType = selectedTypeFilter === 'ALL' || c.type === selectedTypeFilter;
    return matchesRisk && matchesType;
  });

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Details',
      accessorKey: 'name',
      sortable: true,
      cell: c => (
        <div>
          <button
            onClick={() => setProfileCustomer(c)}
            className="font-bold text-white text-xs hover:text-indigo-400 text-left transition"
          >
            {c.name}
          </button>
          <p className="text-[11px] text-slate-400">
            {c.phone} {c.companyName ? `• ${c.companyName}` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Customer Type',
      accessorKey: 'type',
      sortable: true,
      cell: c => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
          {c.type}
        </span>
      ),
    },
    {
      header: 'AI Intelligence Tier',
      sortable: true,
      align: 'center',
      cell: c => {
        const cat = c.intelligence?.riskCategory || 'REGULAR';
        const badgeColors: Record<RiskCategory, string> = {
          HIGH_VALUE: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
          HIGH_PAYMENT_RISK: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse',
          INACTIVE: 'bg-slate-700/40 text-slate-400 border border-slate-700',
          NEW: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
          REGULAR: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        };

        return (
          <div className="inline-flex flex-col items-center">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColors[cat]}`}>
              {cat.replace(/_/g, ' ')}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">RFM: {c.intelligence?.rfmScore || 75}/100</span>
          </div>
        );
      },
    },
    {
      header: 'Total Purchases (LTV)',
      accessorKey: 'totalPurchases',
      sortable: true,
      align: 'right',
      cell: c => (
        <div>
          <span className="font-bold text-slate-200 text-xs">{formatINR(c.totalPurchases)}</span>
          <span className="text-[10px] text-slate-500 block">{c.totalOrders} orders</span>
        </div>
      ),
    },
    {
      header: 'Outstanding Balance',
      accessorKey: 'outstandingBalance',
      sortable: true,
      align: 'right',
      cell: c => {
        const hasDue = c.outstandingBalance > 0;
        return (
          <div className="text-right">
            <span className={`font-bold text-xs ${hasDue ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatINR(c.outstandingBalance)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Limit: {formatINR(c.creditLimit)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      cell: c => (
        <div className="flex items-center justify-end gap-1.5">
          {c.outstandingBalance > 0 && (
            <button
              onClick={() => setVoiceModalCustomer(c)}
              title="Launch AI Voice Reminder Call"
              className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleWhatsAppNudge(c)}
            title="Send WhatsApp Nudge"
            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setProfileCustomer(c)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            360° Profile
          </button>
        </div>
      ),
    },
  ];

  // Invoices for the currently opened 360 profile customer
  const customerInvoices = profileCustomer
    ? invoices.filter(i => i.customerId === profileCustomer.id)
    : [];

  // Target invoice for AI voice call
  const targetCallInvoice = voiceModalCustomer
    ? invoices.find(i => i.customerId === voiceModalCustomer.id && i.balanceAmount > 0) || {
        id: 'inv_mock',
        invoiceNumber: `INV-2026-00${Math.floor(100 + Math.random() * 900)}`,
        customerId: voiceModalCustomer.id,
        customerName: voiceModalCustomer.name,
        customerPhone: voiceModalCustomer.phone,
        customerState: voiceModalCustomer.state,
        customerStateCode: voiceModalCustomer.stateCode,
        isInterState: false,
        items: [],
        subtotal: voiceModalCustomer.outstandingBalance,
        discountTotal: 0,
        taxableTotal: voiceModalCustomer.outstandingBalance,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: voiceModalCustomer.outstandingBalance,
        paidAmount: 0,
        balanceAmount: voiceModalCustomer.outstandingBalance,
        paymentMode: 'CREDIT',
        status: 'OVERDUE',
        dueDate: '2026-08-01',
        createdAt: new Date().toISOString(),
        createdBy: 'usr_cashier',
        cashierName: 'Amit Verma',
      }
    : null;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Customer Relationship Management (CRM)
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                {customers.length} Accounts
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              AI-driven customer scoring, credit exposure, churn probability & 360° financial profiles
            </p>
          </div>

          <button
            onClick={() => setAddCustomerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Intelligence Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Outstanding Receivables"
            value={formatINR(totalOutstanding)}
            subtitle="Current active ledger balances"
            icon={CreditCard}
            iconColor="rose"
          />

          <MetricCard
            title="VIP High-Value Accounts"
            value={`${vipCount} VIPs`}
            subtitle="Top 5% revenue contributors"
            icon={Sparkles}
            iconColor="indigo"
          />

          <MetricCard
            title="High Payment Delay Risk"
            value={`${highRiskCount} Accounts`}
            subtitle="Trigger voice reminder recommended"
            icon={ShieldAlert}
            iconColor="amber"
          />

          <MetricCard
            title="Inactive / Churn Risk"
            value={`${inactiveCount} Inactive`}
            subtitle="No purchase in past 45 days"
            icon={Users}
            iconColor="cyan"
          />
        </div>

        {/* Customers Data Table */}
        <DataTable
          data={filteredCustomers}
          columns={columns}
          searchPlaceholder="Search customer name, phone, GSTIN, or company..."
          searchKeys={['name', 'companyName', 'phone', 'email', 'gstin']}
          exportFilename="customers_crm_database"
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={selectedRiskFilter}
                onChange={e => setSelectedRiskFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All AI Risk Tiers</option>
                <option value="HIGH_VALUE">High Value (VIP)</option>
                <option value="HIGH_PAYMENT_RISK">High Payment Risk</option>
                <option value="REGULAR">Regular Loyal</option>
                <option value="NEW">New Onboarding</option>
                <option value="INACTIVE">Inactive / At-Risk</option>
              </select>

              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Customer Types</option>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="CORPORATE">Corporate</option>
              </select>
            </div>
          }
        />

        {/* 360° Customer Profile Drawer Modal */}
        {profileCustomer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-end p-0 animate-fade-in">
            <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto space-y-6 animate-slide-up flex flex-col justify-between">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{profileCustomer.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {profileCustomer.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{profileCustomer.companyName || 'Individual Account'} • {profileCustomer.phone}</p>
                  </div>
                  <button onClick={() => setProfileCustomer(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Intelligence Score Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white">AI Customer Intelligence</h4>
                    </div>
                    <span className="text-xs font-bold text-indigo-300">
                      RFM Score: {profileCustomer.intelligence?.rfmScore || 75}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {profileCustomer.intelligence?.recommendation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400">Payment Delay Probability:</span>
                      <strong className="text-amber-400 block">{profileCustomer.intelligence?.delayProbability || 10}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Churn Probability:</span>
                      <strong className="text-rose-400 block">{profileCustomer.intelligence?.churnProbability || 15}%</strong>
                    </div>
                  </div>
                </div>

                {/* Credit Exposure Meter */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Credit Utilization</span>
                    <strong className="text-white">
                      {formatINR(profileCustomer.outstandingBalance)} / {formatINR(profileCustomer.creditLimit)}
                    </strong>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        profileCustomer.outstandingBalance > profileCustomer.creditLimit * 0.75
                          ? 'bg-rose-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (profileCustomer.outstandingBalance / (profileCustomer.creditLimit || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Past Invoices List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Transaction & Invoice Ledger ({customerInvoices.length})
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {customerInvoices.length === 0 ? (
                      <p className="text-xs text-slate-500">No invoices recorded for this customer yet.</p>
                    ) : (
                      customerInvoices.map(inv => (
                        <div key={inv.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-white">{inv.invoiceNumber}</span>
                            <span className="text-[10px] text-slate-400 block">{formatDate(inv.createdAt)} • Mode: {inv.paymentMode}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-white">{formatINR(inv.grandTotal)}</span>
                            <span
                              className={`text-[10px] font-semibold block ${
                                inv.status === 'PAID' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-800 flex gap-2">
                {profileCustomer.outstandingBalance > 0 && (
                  <button
                    onClick={() => {
                      setVoiceModalCustomer(profileCustomer);
                      setProfileCustomer(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Launch AI Voice Reminder</span>
                  </button>
                )}
                <button
                  onClick={() => handleWhatsAppNudge(profileCustomer)}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp Nudge</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {addCustomerOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Create New Customer Account</h3>
                <button onClick={() => setAddCustomerOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Customer / Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Company / Trading Name</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="e.g. Patel Retail Stores LLP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="+91 98200 00000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="account@company.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">GSTIN (for B2B)</label>
                    <input
                      type="text"
                      value={formGstin}
                      onChange={e => setFormGstin(e.target.value.toUpperCase())}
                      placeholder="27AABCS1429B1Z8"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Account Type</label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                      <option value="CORPORATE">Corporate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Approved Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={e => setFormCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2"
                >
                  Create Customer Record
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live AI Voice Calling Simulator Modal */}
        {voiceModalCustomer && targetCallInvoice && (
          <LiveCallSimulator
            isOpen={true}
            onClose={() => setVoiceModalCustomer(null)}
            targetInvoice={targetCallInvoice as any}
          />
        )}
      </div>
    </AppLayout>
  );
}
