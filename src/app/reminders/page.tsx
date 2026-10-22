'use client';

import React, { useState } from 'react';
import {
  BellRing,
  Plus,
  Share2,
  PhoneCall,
  Mail,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { ReminderLog, ReminderRule } from '../../lib/types';
import { formatDateTime, formatDate, formatINR } from '../../lib/utils';

export default function RemindersPage() {
  const { reminderRules, reminderLogs, invoices, customers, triggerReminderRule } = useData();
  const { showToast } = useNotification();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState(reminderRules[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');

  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE' || i.balanceAmount > 0);

  const handleTriggerTest = (e: React.FormEvent) => {
    e.preventDefault();
    const log = triggerReminderRule(selectedRuleId, selectedCustomerId, selectedInvoiceId);
    setTestModalOpen(false);
    showToast({
      title: 'Reminder Dispatched',
      message: `Sent ${log.channel.toUpperCase()} message to ${log.customerName}`,
      type: 'success',
    });
  };

  const ruleColumns: Column<ReminderRule>[] = [
    {
      header: 'Workflow Rule Name',
      accessorKey: 'name',
      sortable: true,
      cell: r => (
        <div>
          <h4 className="font-bold text-white text-xs">{r.name}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">{r.templateText}</p>
        </div>
      ),
    },
    {
      header: 'Trigger Timing',
      accessorKey: 'triggerType',
      sortable: true,
      align: 'center',
      cell: r => {
        const offset = r.daysOffset;
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300">
            {offset < 0 ? `${Math.abs(offset)} Days Before Due` : offset === 0 ? 'On Due Date' : `${offset} Days Overdue`}
          </span>
        );
      },
    },
    {
      header: 'Channels',
      cell: r => (
        <div className="flex items-center gap-1.5">
          {r.channels.map(ch => (
            <span
              key={ch}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                ch === 'whatsapp'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : ch === 'voice'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : ch === 'sms'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-indigo-500/20 text-indigo-300'
              }`}
            >
              {ch}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      align: 'center',
      cell: r => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            r.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {r.isActive ? 'Active Auto' : 'Paused'}
        </span>
      ),
    },
  ];

  const logColumns: Column<ReminderLog>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'sentAt',
      sortable: true,
      cell: l => <span className="text-xs text-slate-400 font-mono">{formatDateTime(l.sentAt)}</span>,
    },
    {
      header: 'Recipient Customer',
      accessorKey: 'customerName',
      sortable: true,
      cell: l => (
        <div>
          <h4 className="font-bold text-white text-xs">{l.customerName}</h4>
          <span className="text-[10px] text-slate-400">{l.recipient} • {l.invoiceNumber}</span>
        </div>
      ),
    },
    {
      header: 'Channel',
      accessorKey: 'channel',
      sortable: true,
      align: 'center',
      cell: l => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            l.channel === 'whatsapp'
              ? 'bg-emerald-500/20 text-emerald-300'
              : l.channel === 'voice'
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-indigo-500/20 text-indigo-300'
          }`}
        >
          {l.channel}
        </span>
      ),
    },
    {
      header: 'Dispatched Message Content',
      accessorKey: 'message',
      cell: l => <span className="text-xs text-slate-300 line-clamp-1">{l.message}</span>,
    },
    {
      header: 'Delivery Status',
      accessorKey: 'status',
      sortable: true,
      align: 'center',
      cell: l => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
          {l.status}
        </span>
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
              Smart Multi-Stage Reminder Engine
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                4 Active Rules
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automate multi-channel reminders across WhatsApp, SMS, Email, and AI Voice Call prior to and after due dates
            </p>
          </div>

          <button
            onClick={() => setTestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
          >
            <Send className="w-4 h-4 text-black" />
            <span>Trigger Reminder Now</span>
          </button>
        </div>

        {/* Workflow Timeline Diagram Visualizer */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Automated Debt Recovery Escalation Timeline
            </h3>
            <span className="text-xs text-slate-400">Configured Schedule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">T - 3 Days</span>
              <h5 className="text-xs font-bold text-white">WhatsApp Friendly Nudge</h5>
              <p className="text-[10px] text-slate-400">PDF invoice copy + UPI payment link dispatched</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase">Due Date</span>
              <h5 className="text-xs font-bold text-white">Due Date SMS & Email</h5>
              <p className="text-[10px] text-slate-400">Official due date reminder sent to accounts</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase">T + 1 Day</span>
              <h5 className="text-xs font-bold text-white">Overdue SMS Warning</h5>
              <p className="text-[10px] text-slate-400">Urgent settlement request with zero-fee UPI</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 bg-indigo-950/20 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase">T + 3 Days</span>
              <h5 className="text-xs font-bold text-white">AI Voice Call Agent</h5>
              <p className="text-[10px] text-slate-400">Natural voice call speaks in Hindi/Marathi/EN</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/40 space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase">T + 7+ Days</span>
              <h5 className="text-xs font-bold text-white">Credit Hold & Escalation</h5>
              <p className="text-[10px] text-slate-400">Freezes billing credit limit until cleared</p>
            </div>
          </div>
        </div>

        {/* Reminder Rules Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Active Workflow Rules</h3>
          <DataTable
            data={reminderRules}
            columns={ruleColumns}
            searchPlaceholder="Search reminder rules..."
            searchKeys={['name', 'templateText']}
            exportFilename="reminder_rules"
          />
        </div>

        {/* Dispatched Communication Logs */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-white">Dispatched Reminder Logs</h3>
          <DataTable
            data={reminderLogs}
            columns={logColumns}
            searchPlaceholder="Search communication history..."
            searchKeys={['customerName', 'recipient', 'message', 'invoiceNumber']}
            exportFilename="reminder_dispatch_logs"
            emptyMessage="No reminders triggered yet in this session."
          />
        </div>

        {/* Trigger Reminder Modal */}
        {testModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Dispatch Reminder Notification</h3>
                <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTriggerTest} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Select Reminder Workflow Rule</label>
                  <select
                    value={selectedRuleId}
                    onChange={e => setSelectedRuleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  >
                    {reminderRules.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.channels.join(', ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Target Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Due: {formatINR(c.outstandingBalance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Reference Invoice</label>
                  <select
                    value={selectedInvoiceId}
                    onChange={e => setSelectedInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                  >
                    {invoices.slice(0, 15).map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - Total: {formatINR(inv.grandTotal)} (Bal: {formatINR(inv.balanceAmount)})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2"
                >
                  Send Multi-Channel Reminder Now
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
