'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building,
  PhoneCall,
  Database,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileText,
  Key,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { CallLanguage } from '../../lib/types';

export default function SettingsPage() {
  const {
    business,
    telephony,
    updateBusinessProfile,
    updateTelephonySettings,
    exportJSON,
    importJSON,
    resetToFactorySeed,
  } = useData();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'TELEPHONY' | 'BACKUP'>('BUSINESS');

  // Business Form State
  const [bName, setBName] = useState(business.name);
  const [bLegalName, setBLegalName] = useState(business.legalName);
  const [bGstin, setBGstin] = useState(business.gstin);
  const [bPan, setBPan] = useState(business.pan);
  const [bEmail, setBEmail] = useState(business.email);
  const [bPhone, setBPhone] = useState(business.phone);
  const [bAddress, setBAddress] = useState(business.address);
  const [bCity, setBCity] = useState(business.city);
  const [bState, setBState] = useState(business.state);
  const [bStateCode, setBStateCode] = useState(business.stateCode);
  const [bBankName, setBBankName] = useState(business.bankName);
  const [bAccountNo, setBAccountNo] = useState(business.bankAccountNo);
  const [bIfsc, setBIfsc] = useState(business.bankIfsc);
  const [bUpiId, setBUpiId] = useState(business.bankUpiId);
  const [bPrefix, setBPrefix] = useState(business.invoicePrefix || 'INV');

  // Telephony Form State
  const [telProvider, setTelProvider] = useState(telephony.provider);
  const [telSid, setTelSid] = useState(telephony.accountSid);
  const [telToken, setTelToken] = useState(telephony.authToken);
  const [telNumber, setTelNumber] = useState(telephony.callerNumber);
  const [telLang, setTelLang] = useState<CallLanguage>(telephony.defaultLanguage);
  const [telAutoCall, setTelAutoCall] = useState(telephony.enableAutoCall);
  const [telMaxAttempts, setTelMaxAttempts] = useState(telephony.maxCallAttempts.toString());

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      name: bName,
      legalName: bLegalName,
      gstin: bGstin,
      pan: bPan,
      email: bEmail,
      phone: bPhone,
      address: bAddress,
      city: bCity,
      state: bState,
      stateCode: bStateCode,
      bankName: bBankName,
      bankAccountNo: bAccountNo,
      bankIfsc: bIfsc,
      bankUpiId: bUpiId,
      invoicePrefix: bPrefix,
    });
    showToast({ title: 'Settings Saved', message: 'Business profile & GST settings updated.', type: 'success' });
  };

  const handleSaveTelephony = (e: React.FormEvent) => {
    e.preventDefault();
    updateTelephonySettings({
      provider: telProvider,
      accountSid: telSid,
      authToken: telToken,
      callerNumber: telNumber,
      defaultLanguage: telLang,
      enableAutoCall: telAutoCall,
      maxCallAttempts: parseInt(telMaxAttempts, 10) || 3,
    });
    showToast({ title: 'Telephony Updated', message: 'AI Voice Calling settings saved.', type: 'success' });
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prasana_enterprises_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast({ title: 'Backup Downloaded', message: 'Full database snapshot saved.', type: 'success' });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importJSON(content);
      if (success) {
        showToast({ title: 'Restore Successful', message: 'Database state loaded from JSON backup.', type: 'success' });
      } else {
        showToast({ title: 'Restore Failed', message: 'Invalid database backup format.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (window.confirm('Are you sure you want to reset all data back to original seed defaults? This will erase custom additions.')) {
      resetToFactorySeed();
      showToast({ title: 'Database Reset', message: 'Loaded pristine seed dataset.', type: 'info' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              System Settings & Configuration
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize business branding, GST details, bank accounts, AI voice telephony, and database backups
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab('BUSINESS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'BUSINESS' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Business & GST Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('TELEPHONY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'TELEPHONY' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>AI Voice & Telephony Config</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'BACKUP' ? 'bg-white text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Factory Reset</span>
          </button>
        </div>

        {/* Tab 1: Business Profile & GST */}
        {activeTab === 'BUSINESS' && (
          <form onSubmit={handleSaveBusiness} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white">Business Information & Tax Profile</h3>
              <p className="text-xs text-zinc-400">These particulars will appear on GST Tax Invoices and thermal receipts</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-semibold">Trade / Store Name *</label>
                <input
                  type="text"
                  required
                  value={bName}
                  onChange={e => setBName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Legal Entity Name</label>
                <input
                  type="text"
                  value={bLegalName}
                  onChange={e => setBLegalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">GSTIN (15 Digits) *</label>
                <input
                  type="text"
                  required
                  value={bGstin}
                  onChange={e => setBGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">PAN Card Number</label>
                <input
                  type="text"
                  value={bPan}
                  onChange={e => setBPan(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={bPhone}
                  onChange={e => setBPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Official Email</label>
                <input
                  type="email"
                  value={bEmail}
                  onChange={e => setBEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 font-semibold">Registered Address</label>
                <input
                  type="text"
                  value={bAddress}
                  onChange={e => setBAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">City</label>
                <input
                  type="text"
                  value={bCity}
                  onChange={e => setBCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">State</label>
                  <input
                    type="text"
                    value={bState}
                    onChange={e => setBState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">State Code</label>
                  <input
                    type="text"
                    value={bStateCode}
                    onChange={e => setBStateCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Bank Particulars */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Bank Account & UPI Details</h4>
                <p className="text-xs text-zinc-400">Printed on invoices for customer remittance and dynamic QR scanning</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">Bank Name</label>
                  <input
                    type="text"
                    value={bBankName}
                    onChange={e => setBBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">Account Number</label>
                  <input
                    type="text"
                    value={bAccountNo}
                    onChange={e => setBAccountNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">IFSC Code</label>
                  <input
                    type="text"
                    value={bIfsc}
                    onChange={e => setBIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">Merchant UPI VPA ID (For Dynamic QR)</label>
                  <input
                    type="text"
                    value={bUpiId}
                    onChange={e => setBUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono font-bold focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4 text-black" />
                <span>Save Business Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: AI Voice Telephony Settings */}
        {activeTab === 'TELEPHONY' && (
          <form onSubmit={handleSaveTelephony} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white">AI Voice Calling & Telephony Integration</h3>
              <p className="text-xs text-zinc-400">Configure Twilio, Exotel or Web Speech engine for automated debt recovery</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-semibold">Telephony Provider</label>
                <select
                  value={telProvider}
                  onChange={e => setTelProvider(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-bold focus:outline-none focus:border-white"
                >
                  <option value="SIMULATOR">Prasana Enterprises Built-in Web Speech Simulator (Live)</option>
                  <option value="TWILIO">Twilio Voice API</option>
                  <option value="EXOTEL">Exotel India Telephony</option>
                  <option value="PLIVO">Plivo SIP Trunk</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Caller Outbound ID Number</label>
                <input
                  type="text"
                  value={telNumber}
                  onChange={e => setTelNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Account SID / API Key</label>
                <input
                  type="text"
                  value={telSid}
                  onChange={e => setTelSid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Auth Token / Secret</label>
                <input
                  type="password"
                  value={telToken}
                  onChange={e => setTelToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Default Calling Language</label>
                <select
                  value={telLang}
                  onChange={e => setTelLang(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                >
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="en">English</option>
                  <option value="mr">Marathi (मराठी)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Max Daily Call Attempts</label>
                <input
                  type="number"
                  value={telMaxAttempts}
                  onChange={e => setTelMaxAttempts(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autocall"
                checked={telAutoCall}
                onChange={e => setTelAutoCall(e.target.checked)}
                className="rounded bg-black border-zinc-800 text-white focus:ring-0"
              />
              <label htmlFor="autocall" className="text-xs text-zinc-300 font-medium">
                Automatically dial customers whose invoices become 3+ days overdue during business hours (09:30 - 19:00)
              </label>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4 text-black" />
                <span>Save Telephony Configuration</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Backup & Restore */}
        {activeTab === 'BACKUP' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white">Database Backup & State Portability</h3>
              <p className="text-xs text-zinc-400">Export complete business state as JSON or restore past snapshots</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Backup */}
              <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white">
                  <Download className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-white">Export Database Snapshot</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Downloads full JSON snapshot containing all 50+ products, customers, invoices, expenses, audit logs, and settings.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
                >
                  Download JSON Backup
                </button>
              </div>

              {/* Restore */}
              <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white">
                  <Upload className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-white">Restore from Backup</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload a previously exported `.json` file to restore the entire database state instantly.
                </p>
                <label className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition block text-center cursor-pointer">
                  <span>Upload & Restore JSON</span>
                  <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                </label>
              </div>
            </div>

            {/* Factory Reset */}
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <RotateCcw className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">Factory Reset to Seed Data</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Re-seeds the entire platform with 50+ fresh Indian SMB products, 20+ customer profiles, 10+ suppliers, and 100+ sample invoices.
              </p>
              <button
                onClick={handleFactoryReset}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700"
              >
                Reset Database to Realistic Seed
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
