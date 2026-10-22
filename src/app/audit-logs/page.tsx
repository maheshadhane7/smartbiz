'use client';

import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Clock,
  User,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { AuditLog } from '../../lib/types';
import { formatDateTime } from '../../lib/utils';

export default function AuditLogsPage() {
  const { auditLogs } = useData();
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    return moduleFilter === 'ALL' || log.module === moduleFilter;
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: l => <span className="text-xs text-slate-400 font-mono">{formatDateTime(l.timestamp)}</span>,
    },
    {
      header: 'User & Role',
      accessorKey: 'userName',
      sortable: true,
      cell: l => (
        <div>
          <h4 className="font-bold text-white text-xs">{l.userName}</h4>
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            {l.userRole}
          </span>
        </div>
      ),
    },
    {
      header: 'Module',
      accessorKey: 'module',
      sortable: true,
      cell: l => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
          {l.module}
        </span>
      ),
    },
    {
      header: 'Action Taken',
      accessorKey: 'action',
      sortable: true,
      cell: l => (
        <span className="text-xs font-mono font-semibold text-slate-200">
          {l.action}
        </span>
      ),
    },
    {
      header: 'Audit Event Details',
      accessorKey: 'details',
      cell: l => <span className="text-xs text-slate-300">{l.details}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              System Audit & Activity Trail
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                IMMUTABLE LOGS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of all billing, payment, stock modification, and AI telephony events
            </p>
          </div>
        </div>

        {/* Audit Logs Table */}
        <DataTable
          data={filteredLogs}
          columns={columns}
          searchPlaceholder="Search audit logs by user, action, or details..."
          searchKeys={['userName', 'userRole', 'action', 'module', 'details']}
          exportFilename="system_audit_trail"
          filterComponent={
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Modules</option>
              <option value="Billing">Billing & POS</option>
              <option value="Payments">Payments & Debt</option>
              <option value="Inventory">Inventory & Stock</option>
              <option value="CRM">Customer CRM</option>
              <option value="Purchases">Purchases & GRN</option>
              <option value="Expenses">Expenses</option>
              <option value="Call Center">AI Call Center</option>
              <option value="System">System Startup</option>
            </select>
          }
        />
      </div>
    </AppLayout>
  );
}
