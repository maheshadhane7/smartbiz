import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Indian Rupee (INR) currency format
 * e.g., 125000 -> ₹1,25,000
 */
export function formatINR(amount: number | null | undefined, showDecimals: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format date string into human friendly format
 */
export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format datetime into friendly format
 */
export function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculate difference in days between two dates
 */
export function getDaysDifference(date1: string | Date, date2: string | Date = new Date()): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate unique IDs
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generate sequential invoice number
 */
export function generateInvoiceNumber(sequence: number, prefix: string = 'INV'): string {
  const year = new Date().getFullYear();
  const seqStr = sequence.toString().padStart(5, '0');
  return `${prefix}-${year}-${seqStr}`;
}

/**
 * Export data array to CSV file download
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  headers?: { key: keyof T; label: string }[]
) {
  if (!data || !data.length) return;

  const headerKeys = headers ? headers.map(h => h.key) : (Object.keys(data[0]) as (keyof T)[]);
  const headerLabels = headers ? headers.map(h => h.label) : Object.keys(data[0]);

  const csvRows: string[] = [];
  csvRows.push(headerLabels.map(label => `"${label}"`).join(','));

  for (const row of data) {
    const values = headerKeys.map(key => {
      const val = row[key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate UPI dynamic payment URI
 */
export function generateUPILink(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
  notes?: string;
}): string {
  const { upiId, payeeName, amount, invoiceNumber, notes } = params;
  const note = encodeURIComponent(notes || `Bill Payment ${invoiceNumber}`);
  const pn = encodeURIComponent(payeeName);
  return `upi://pay?pa=${upiId}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${note}&tr=${invoiceNumber}`;
}

/**
 * Indian States with GST Codes
 */
export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '19', name: 'West Bengal' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];
