'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Star,
  Truck,
  CreditCard,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Supplier } from '../../lib/types';
import { formatINR } from '../../lib/utils';

export default function SuppliersPage() {
  const { suppliers, purchases, addSupplier, updateSupplier } = useData();
  const { showToast } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formState, setFormState] = useState('Maharashtra');
  const [formStateCode, setFormStateCode] = useState('27');
  const [formAddress, setFormAddress] = useState('');
  const [formCategories, setFormCategories] = useState('Groceries, FMCG');

  const totalOutstandingToVendors = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);
  const totalPurchasesAll = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormGstin('');
    setFormState('Maharashtra');
    setFormStateCode('27');
    setFormAddress('Mumbai, Maharashtra');
    setFormCategories('Groceries, FMCG');
    setModalOpen(true);
  };

  const handleOpenEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormContact(s.contactPerson);
    setFormPhone(s.phone);
    setFormEmail(s.email);
    setFormGstin(s.gstin);
    setFormState(s.state);
    setFormStateCode(s.stateCode);
    setFormAddress(s.address);
    setFormCategories(s.categories.join(', '));
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catArray = formCategories.split(',').map(c => c.trim()).filter(Boolean);

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formName,
        contactPerson: formContact,
        phone: formPhone,
        email: formEmail,
        gstin: formGstin,
        state: formState,
        stateCode: formStateCode,
        address: formAddress,
        categories: catArray,
      });
      showToast({ title: 'Supplier Updated', message: `${formName} was updated successfully.`, type: 'success' });
    } else {
      addSupplier({
        name: formName,
        contactPerson: formContact,
        phone: formPhone,
        email: formEmail || `sales@${formName.toLowerCase().replace(/\s+/g, '')}.com`,
        gstin: formGstin,
        state: formState,
        stateCode: formStateCode,
        address: formAddress || 'Mumbai, Maharashtra',
        categories: catArray,
        outstandingBalance: 0,
        totalPurchases: 0,
        rating: 4.8,
      });
      showToast({ title: 'Supplier Registered', message: `${formName} added to vendors.`, type: 'success' });
    }

    setModalOpen(false);
  };

  const columns: Column<Supplier>[] = [
    {
      header: 'Supplier Name & Contact',
      accessorKey: 'name',
      sortable: true,
      cell: s => (
        <div>
          <h4 className="font-bold text-white text-xs">{s.name}</h4>
          <span className="text-[11px] text-slate-400">
            {s.contactPerson} • {s.phone}
          </span>
        </div>
      ),
    },
    {
      header: 'Categories Supplied',
      cell: s => (
        <div className="flex flex-wrap gap-1">
          {s.categories.map((c, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'GSTIN & State',
      accessorKey: 'gstin',
      sortable: true,
      cell: s => (
        <div>
          <span className="font-mono text-xs font-semibold text-indigo-300">{s.gstin}</span>
          <span className="text-[10px] text-slate-500 block">{s.state} ({s.stateCode})</span>
        </div>
      ),
    },
    {
      header: 'Total Purchases Volume',
      accessorKey: 'totalPurchases',
      sortable: true,
      align: 'right',
      cell: s => <span className="font-bold text-white text-xs">{formatINR(s.totalPurchases)}</span>,
    },
    {
      header: 'Vendor Balance Due',
      accessorKey: 'outstandingBalance',
      sortable: true,
      align: 'right',
      cell: s => {
        const hasDue = s.outstandingBalance > 0;
        return (
          <span className={`font-bold text-xs ${hasDue ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatINR(s.outstandingBalance)}
          </span>
        );
      },
    },
    {
      header: 'Vendor Rating',
      accessorKey: 'rating',
      sortable: true,
      align: 'center',
      cell: s => (
        <div className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{s.rating}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: s => (
        <button
          onClick={() => handleOpenEditModal(s)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          Edit
        </button>
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
              Suppliers & Vendor Management
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                {suppliers.length} Vendors
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage supplier agreements, vendor ledgers, GSTIN records, and procurement balances
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add New Supplier</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Procurement B2B Volume"
            value={formatINR(totalPurchasesAll)}
            subtitle="Lifetime vendor procurement spend"
            icon={Building2}
            iconColor="indigo"
          />

          <MetricCard
            title="Outstanding Payable to Vendors"
            value={formatINR(totalOutstandingToVendors)}
            subtitle="Unsettled supplier invoices"
            icon={CreditCard}
            iconColor="amber"
          />

          <MetricCard
            title="Active Preferred Suppliers"
            value={`${suppliers.length} Vendors`}
            subtitle="Average vendor rating: 4.7 ★"
            icon={Star}
            iconColor="emerald"
          />
        </div>

        {/* Suppliers Data Table */}
        <DataTable
          data={suppliers}
          columns={columns}
          searchPlaceholder="Search vendors by name, contact, phone, or GSTIN..."
          searchKeys={['name', 'contactPerson', 'phone', 'email', 'gstin']}
          exportFilename="suppliers_vendor_directory"
        />

        {/* Add / Edit Supplier Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  {editingSupplier ? 'Edit Vendor Details' : 'Register New Vendor'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Supplier / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Supreme FMCG Wholesalers"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Contact Person</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                    placeholder="e.g. Kailash Singhania"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="+91 98111 22334"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="sales@vendor.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">GSTIN *</label>
                  <input
                    type="text"
                    required
                    value={formGstin}
                    onChange={e => setFormGstin(e.target.value.toUpperCase())}
                    placeholder="27AABCB1234F1Z1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Supplied Categories (comma-separated)</label>
                  <input
                    type="text"
                    value={formCategories}
                    onChange={e => setFormCategories(e.target.value)}
                    placeholder="e.g. Electronics, Hardware, FMCG"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2"
                >
                  {editingSupplier ? 'Save Vendor Changes' : 'Register Vendor'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
