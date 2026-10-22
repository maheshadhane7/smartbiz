'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Filter,
} from 'lucide-react';
import { exportToCSV } from '../../lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  exportFilename?: string;
  filterComponent?: React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKeys,
  exportFilename = 'export_data',
  filterComponent,
  pageSize = 10,
  emptyMessage = 'No records found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();

    return data.filter(item => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some(key => {
          const val = item[key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      }
      return Object.values(item).some(val => {
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      });
    });
  }, [data, search, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    exportToCSV(exportFilename, sortedData);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
            />
          </div>

          {filterComponent}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-black text-zinc-400 font-semibold">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                    className={`p-3.5 select-none ${col.sortable ? 'cursor-pointer hover:text-white' : ''} ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-zinc-500 text-xs">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-900/60 transition">
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-3.5 text-zinc-300 ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? '-') : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-zinc-800 bg-black/80 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Showing <strong className="text-white">{sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-white">{Math.min(currentPage * pageSize, sortedData.length)}</strong> of{' '}
            <strong className="text-white">{sortedData.length}</strong> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
