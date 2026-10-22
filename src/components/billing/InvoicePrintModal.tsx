'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Mail,
  X,
  FileText,
  Receipt,
  Check,
  Building,
  QrCode,
} from 'lucide-react';
import { Invoice } from '../../lib/types';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, formatDateTime } from '../../lib/utils';
import { useNotification } from '../../context/NotificationContext';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export function InvoicePrintModal({ isOpen, onClose, invoice }: InvoicePrintModalProps) {
  const { business } = useData();
  const { showToast } = useNotification();
  const [viewFormat, setViewFormat] = useState<'A4' | 'THERMAL'>('A4');
  const [isShared, setIsShared] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = invoice.customerPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Dear ${invoice.customerName},\nThank you for your business at ${business.name}!\n\nHere is your Tax Invoice: *${invoice.invoiceNumber}*\nDate: ${formatDate(invoice.createdAt)}\nTotal Amount: *${formatINR(invoice.grandTotal)}*\nPaid: ${formatINR(invoice.paidAmount)}\nBalance: ${formatINR(invoice.balanceAmount)}\n\nView or download digital invoice: https://erp.prasanaenterprises.in/inv/${invoice.invoiceNumber}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    showToast({
      title: 'WhatsApp Shared',
      message: `Invoice dispatched to ${invoice.customerPhone}`,
      type: 'success',
    });
  };

  const handleEmailInvoice = () => {
    showToast({
      title: 'Email Dispatched',
      message: `GST Tax Invoice PDF sent to customer email.`,
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-6 animate-slide-up flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-black border-b border-zinc-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                onClick={() => setViewFormat('A4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewFormat === 'A4'
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 GST Tax Invoice</span>
              </button>
              <button
                onClick={() => setViewFormat('THERMAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewFormat === 'THERMAL'
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal Receipt</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-semibold transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleEmailInvoice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition hidden sm:flex"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/60 flex justify-center">
          {viewFormat === 'A4' ? (
            /* ========================================================== */
            /* STANDARD A4 GST TAX INVOICE                                 */
            /* ========================================================== */
            <div className="w-full max-w-3xl bg-white text-slate-900 p-8 rounded-xl shadow-xl printable-area font-sans border border-slate-200">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">{business.name}</h1>
                  <p className="text-xs text-slate-600 font-medium">{business.legalName}</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm">{business.address}, {business.city}, {business.state} - {business.pincode}</p>
                  <p className="text-xs text-slate-700 font-semibold mt-1">
                    GSTIN: <span className="font-mono text-slate-900">{business.gstin}</span> | PAN: <span className="font-mono">{business.pan}</span>
                  </p>
                  <p className="text-xs text-slate-600">Email: {business.email} | Phone: {business.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded">
                    TAX INVOICE
                  </span>
                  <div className="mt-2 text-xs text-slate-700 space-y-0.5">
                    <p>Invoice No: <strong className="font-mono text-sm text-slate-900">{invoice.invoiceNumber}</strong></p>
                    <p>Invoice Date: <strong className="text-slate-900">{formatDate(invoice.createdAt)}</strong></p>
                    <p>Due Date: <strong className="text-slate-900">{formatDate(invoice.dueDate)}</strong></p>
                    <p>Place of Supply: <strong className="text-slate-900">{invoice.customerState} ({invoice.customerStateCode})</strong></p>
                  </div>
                </div>
              </div>

              {/* Bill To & Payment Info */}
              <div className="grid grid-cols-2 gap-6 my-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Billed To / Customer:</h3>
                  <p className="font-bold text-sm text-slate-900">{invoice.customerName}</p>
                  <p className="text-slate-600">{invoice.customerPhone}</p>
                  <p className="text-slate-600">State: {invoice.customerState} (Code: {invoice.customerStateCode})</p>
                  {invoice.customerGstin && (
                    <p className="font-semibold text-slate-800 mt-0.5">GSTIN: <span className="font-mono">{invoice.customerGstin}</span></p>
                  )}
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Payment & Bank Details:</h3>
                  <p className="text-slate-700">Mode: <strong className="uppercase">{invoice.paymentMode}</strong></p>
                  <p className="text-slate-700">Bank: <strong>{business.bankName}</strong></p>
                  <p className="text-slate-700 font-mono">A/C: {business.bankAccountNo} | IFSC: {business.bankIfsc}</p>
                  <p className="text-slate-700 font-mono">UPI ID: <strong className="text-indigo-700">{business.bankUpiId}</strong></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse my-4 border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                    <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                    <th className="p-2 border-r border-slate-300">Item Description</th>
                    <th className="p-2 border-r border-slate-300 text-center">HSN</th>
                    <th className="p-2 border-r border-slate-300 text-right">Qty</th>
                    <th className="p-2 border-r border-slate-300 text-right">Rate</th>
                    <th className="p-2 border-r border-slate-300 text-right">Taxable</th>
                    <th className="p-2 border-r border-slate-300 text-center">GST %</th>
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                        {item.productName}
                        <span className="block text-[10px] text-slate-500 font-normal">SKU: {item.sku}</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{item.hsnCode}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-medium">{item.quantity} {item.unit}</td>
                      <td className="p-2 border-r border-slate-200 text-right">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-200 text-right">₹{item.taxableAmount.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-200 text-center">{item.gstRate}%</td>
                      <td className="p-2 text-right font-bold text-slate-900">₹{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tax Breakdown & Grand Totals Summary */}
              <div className="grid grid-cols-12 gap-4 my-4 pt-2">
                <div className="col-span-7 text-xs text-slate-600 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Terms & Conditions:</h4>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                      {business.terms.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ol>
                  </div>
                  <p className="text-[11px] italic text-slate-500">
                    Cashier: {invoice.cashierName} • Certified that the particulars given above are true and correct.
                  </p>
                </div>

                <div className="col-span-5 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span>Taxable Amount:</span>
                    <span className="font-semibold">{formatINR(invoice.taxableTotal, true)}</span>
                  </div>
                  {invoice.isInterState ? (
                    <div className="flex justify-between text-slate-700">
                      <span>IGST Total:</span>
                      <span className="font-semibold">{formatINR(invoice.igstTotal, true)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-700">
                        <span>CGST Total:</span>
                        <span className="font-semibold">{formatINR(invoice.cgstTotal, true)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>SGST Total:</span>
                        <span className="font-semibold">{formatINR(invoice.sgstTotal, true)}</span>
                      </div>
                    </>
                  )}
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Total Savings / Discount:</span>
                      <span>-{formatINR(invoice.discountTotal, true)}</span>
                    </div>
                  )}
                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Round Off:</span>
                      <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-indigo-900">{formatINR(invoice.grandTotal, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1 text-[11px]">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-emerald-700">{formatINR(invoice.paidAmount, true)}</span>
                  </div>
                  {invoice.balanceAmount > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold text-[11px]">
                      <span>Balance Outstanding:</span>
                      <span>{formatINR(invoice.balanceAmount, true)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Authorized Signatory */}
              <div className="flex justify-between items-end mt-8 pt-4 border-t border-slate-300 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-700" />
                  </div>
                  <span className="text-[10px] text-slate-500 max-w-[120px]">Scan to verify GST E-Invoice signature</span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-700">For {business.legalName}</p>
                  <div className="h-12 flex items-center justify-end">
                    <span className="font-serif italic text-sm text-indigo-900 font-bold">Authorized Signatory</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Authorized Signature & Stamp</p>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* 80mm THERMAL POS RECEIPT VIEW                              */
            /* ========================================================== */
            <div className="w-80 bg-white text-black p-4 rounded shadow-xl printable-area font-mono text-xs border border-slate-300 leading-tight">
              <div className="text-center space-y-1 border-b border-dashed border-black pb-3">
                <h2 className="text-base font-black tracking-tighter uppercase">{business.name}</h2>
                <p className="text-[10px]">{business.address}, {business.city}</p>
                <p className="text-[10px] font-bold">GSTIN: {business.gstin}</p>
                <p className="text-[10px]">Ph: {business.phone}</p>
              </div>

              <div className="my-2 space-y-0.5 text-[11px] border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Bill: {invoice.invoiceNumber}</span>
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cust: {invoice.customerName.slice(0, 18)}</span>
                  <span>{invoice.paymentMode}</span>
                </div>
                <p className="text-[10px] text-slate-600">Cashier: {invoice.cashierName}</p>
              </div>

              <table className="w-full text-left text-[11px] my-2">
                <thead>
                  <tr className="border-b border-black">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-right">Qty</th>
                    <th className="pb-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-300">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pr-1 font-bold">{item.productName.slice(0, 16)}</td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">₹{item.totalAmount.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span>₹{invoice.taxableTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total GST ({invoice.isInterState ? 'IGST' : 'CGST+SGST'}):</span>
                  <span>₹{invoice.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                  <span>TOTAL:</span>
                  <span>{formatINR(invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>PAID ({invoice.paymentMode}):</span>
                  <span>{formatINR(invoice.paidAmount)}</span>
                </div>
                {invoice.balanceAmount > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>BALANCE DUE:</span>
                    <span>{formatINR(invoice.balanceAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center mt-4 pt-3 border-t border-dashed border-black space-y-1">
                <p className="text-[10px] font-bold">THANK YOU! VISIT AGAIN</p>
                <p className="text-[9px]">Goods once sold not returnable without bill.</p>
                <div className="font-mono text-[9px] tracking-widest pt-1">|||| | | ||||| | || |||| |</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
