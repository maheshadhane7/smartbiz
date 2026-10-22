'use client';

import React, { useState } from 'react';
import {
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  AlertCircle,
  Clock,
  Volume2,
  Sparkles,
  Share2,
  Filter,
  Languages,
  Play,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { CallDisposition, CallLanguage, CallRecord, Invoice } from '../../lib/types';
import { formatINR, formatDateTime, formatDate } from '../../lib/utils';
import { LiveCallSimulator } from '../../components/voice/LiveCallSimulator';

export default function VoiceCallingPage() {
  const { callRecords, invoices, customers, business } = useData();
  const { showToast } = useNotification();

  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [dispositionFilter, setDispositionFilter] = useState<string>('ALL');

  // Simulator & Transcript Modals
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<CallLanguage>('hi');
  const [viewTranscriptRecord, setViewTranscriptRecord] = useState<CallRecord | null>(null);

  // Overdue Invoices Eligible for Calls
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE' || (i.balanceAmount > 0 && i.status !== 'PAID'));

  // Metrics computation
  const totalCalls = callRecords.length;
  const completedCalls = callRecords.filter(c => c.status === 'COMPLETED').length;
  const promisedCount = callRecords.filter(c => c.disposition === 'PAYMENT_PROMISED').length;
  const linkSentCount = callRecords.filter(c => c.paymentLinkSent || c.disposition === 'REQUESTED_PAYMENT_LINK').length;
  const totalOverdueRecovered = callRecords
    .filter(c => c.disposition === 'PAYMENT_PROMISED' || c.disposition === 'ALREADY_PAID')
    .reduce((sum, c) => sum + c.overdueAmount, 0);

  const handleLaunchCall = (inv: Invoice, lang: CallLanguage = 'hi') => {
    setSelectedInvoice(inv);
    setSelectedLanguage(lang);
    setSimulatorOpen(true);
  };

  const filteredCalls = callRecords.filter(c => {
    const matchesLang = languageFilter === 'ALL' || c.language === languageFilter;
    const matchesDisp = dispositionFilter === 'ALL' || c.disposition === dispositionFilter;
    return matchesLang && matchesDisp;
  });

  const columns: Column<CallRecord>[] = [
    {
      header: 'Customer & Invoice',
      accessorKey: 'customerName',
      sortable: true,
      cell: c => (
        <div>
          <h4 className="font-bold text-white text-xs">{c.customerName}</h4>
          <span className="text-[11px] text-slate-400 font-mono">
            {c.invoiceNumber} • {c.customerPhone}
          </span>
        </div>
      ),
    },
    {
      header: 'Overdue Amount',
      accessorKey: 'overdueAmount',
      sortable: true,
      align: 'right',
      cell: c => (
        <div>
          <span className="font-bold text-rose-400 text-xs">{formatINR(c.overdueAmount)}</span>
          <span className="text-[10px] text-slate-500 block">{c.overdueDays}d overdue</span>
        </div>
      ),
    },
    {
      header: 'Language',
      accessorKey: 'language',
      sortable: true,
      align: 'center',
      cell: c => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 uppercase">
          {c.language === 'hi' ? 'हिंदी' : c.language === 'mr' ? 'मराठी' : 'English'}
        </span>
      ),
    },
    {
      header: 'Call Outcome / Disposition',
      accessorKey: 'disposition',
      sortable: true,
      cell: c => {
        const d = c.disposition || 'CALLBACK_REQUESTED';
        const badgeStyle: Record<CallDisposition, string> = {
          PAYMENT_PROMISED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          REQUESTED_PAYMENT_LINK: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
          ALREADY_PAID: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
          DISPUTE_RAISED: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
          CALLBACK_REQUESTED: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          NO_ANSWER: 'bg-slate-700 text-slate-300',
          WRONG_NUMBER: 'bg-slate-700 text-slate-400',
          CALL_FAILED: 'bg-rose-950 text-rose-400',
        };

        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle[d] || 'bg-slate-800 text-slate-300'}`}>
            {d.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      header: 'Call Duration',
      accessorKey: 'durationSeconds',
      sortable: true,
      align: 'center',
      cell: c => <span className="text-xs font-mono text-slate-300">{c.durationSeconds}s</span>,
    },
    {
      header: 'Date & Time',
      accessorKey: 'callDate',
      sortable: true,
      cell: c => <span className="text-[11px] text-slate-400 font-mono">{formatDateTime(c.callDate)}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: c => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewTranscriptRecord(c)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transcript</span>
          </button>
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
              AI Voice Payment Reminder Call Center
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MULTILINGUAL TELEPHONY
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated outbound voice agent recovering overdue debts in English, Hindi & Marathi with dynamic UPI links
            </p>
          </div>

          <div className="flex items-center gap-2">
            {overdueInvoices.length > 0 && (
              <button
                onClick={() => handleLaunchCall(overdueInvoices[0], 'hi')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/30"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Trigger Next AI Overdue Call</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total AI Calls Handled"
            value={`${totalCalls} Calls`}
            subtitle={`${completedCalls} successful connects (94%)`}
            icon={PhoneCall}
            iconColor="cyan"
          />

          <MetricCard
            title="Promised to Pay"
            value={`${promisedCount} Invoices`}
            subtitle="Scheduled for reconciliation"
            icon={CheckCircle2}
            iconColor="emerald"
          />

          <MetricCard
            title="UPI Links Dispatched"
            value={`${linkSentCount} Links`}
            subtitle="Instant WhatsApp push"
            icon={Share2}
            iconColor="indigo"
          />

          <MetricCard
            title="Overdue Debt Under Recovery"
            value={formatINR(totalOverdueRecovered)}
            subtitle="Committed for bank settlement"
            icon={Clock}
            iconColor="amber"
          />
        </div>

        {/* Priority Overdue Queue (Calling Ready) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Priority Overdue Call Queue</h3>
                <p className="text-xs text-slate-400">High-priority debtors ready for automated AI voice reminder</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {overdueInvoices.length} Overdue Accounts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueInvoices.slice(0, 6).map(inv => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/60 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-500">{inv.invoiceNumber}</span>
                    <span className="text-[10px] font-bold text-rose-400">Due: {formatDate(inv.dueDate)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{inv.customerName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{inv.customerPhone}</p>
                  <p className="text-xs font-black text-rose-400 mt-1">{formatINR(inv.balanceAmount)}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1">
                  <span className="text-[10px] text-slate-400">Dial in:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLaunchCall(inv, 'en')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-bold transition"
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleLaunchCall(inv, 'hi')}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition shadow-sm"
                    >
                      हिंदी
                    </button>
                    <button
                      onClick={() => handleLaunchCall(inv, 'mr')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-bold transition"
                    >
                      मराठी
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Center History Log Table */}
        <DataTable
          data={filteredCalls}
          columns={columns}
          searchPlaceholder="Search calls by customer, phone, or invoice..."
          searchKeys={['customerName', 'customerPhone', 'invoiceNumber', 'disposition', 'summary']}
          exportFilename="ai_voice_call_logs"
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={languageFilter}
                onChange={e => setLanguageFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Languages</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="en">English</option>
                <option value="mr">Marathi (मराठी)</option>
              </select>

              <select
                value={dispositionFilter}
                onChange={e => setDispositionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Dispositions</option>
                <option value="PAYMENT_PROMISED">Payment Promised</option>
                <option value="REQUESTED_PAYMENT_LINK">Requested Payment Link</option>
                <option value="ALREADY_PAID">Already Paid</option>
                <option value="DISPUTE_RAISED">Dispute Raised</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
              </select>
            </div>
          }
        />

        {/* Live Call Simulator Modal */}
        {simulatorOpen && selectedInvoice && (
          <LiveCallSimulator
            isOpen={simulatorOpen}
            onClose={() => setSimulatorOpen(false)}
            targetInvoice={selectedInvoice}
            initialLanguage={selectedLanguage}
          />
        )}

        {/* Transcript Details Modal */}
        {viewTranscriptRecord && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Call Transcript Log</h3>
                    <p className="text-xs text-zinc-400">
                      {viewTranscriptRecord.customerName} ({viewTranscriptRecord.customerPhone})
                    </p>
                  </div>
                </div>
                <button onClick={() => setViewTranscriptRecord(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Disposition and Summary */}
              <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Disposition:</span>
                  <strong className="text-white capitalize">{viewTranscriptRecord.disposition?.replace(/_/g, ' ')}</strong>
                </div>
                <p className="text-zinc-300 italic pt-1">{viewTranscriptRecord.summary}</p>
              </div>

              {/* Messages */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {viewTranscriptRecord.transcript.map(m => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'ai'
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                        : 'bg-white text-black font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                      <span className="font-bold uppercase">
                        {m.sender === 'ai' ? 'Prasana Enterprises Voice AI' : viewTranscriptRecord.customerName}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setViewTranscriptRecord(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
                >
                  Close Transcript
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
