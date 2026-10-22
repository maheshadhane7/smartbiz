'use client';

import React, { useState } from 'react';
import { QrCode, CheckCircle2, Copy, Check, Smartphone, ShieldCheck, X } from 'lucide-react';
import { formatINR, generateUPILink } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  invoiceNumber: string;
  customerName: string;
  upiId?: string;
  onPaymentSuccess: (utr: string) => void;
}

export function UPIPaymentModal({
  isOpen,
  onClose,
  amount,
  invoiceNumber,
  customerName,
  upiId = 'prasanaenterprises@icici',
  onPaymentSuccess,
}: UPIPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [utrNumber, setUtrNumber] = useState(`UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`);

  if (!isOpen) return null;

  const upiUri = generateUPILink({
    upiId,
    payeeName: 'Prasana Enterprises',
    amount,
    invoiceNumber,
    notes: `Bill Payment ${invoiceNumber}`,
  });

  // Generate SVG QR code representation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPaid = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Confetti fallback
      }
      onPaymentSuccess(utrNumber);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 animate-slide-up text-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scan & Pay via UPI</h3>
              <p className="text-xs text-zinc-400">GPay, PhonePe, Paytm, BHIM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Badge */}
        <div className="p-4 rounded-2xl bg-black border border-zinc-800">
          <span className="text-xs text-zinc-400">Total Payable Amount</span>
          <h2 className="text-3xl font-extrabold text-white mt-0.5">{formatINR(amount, true)}</h2>
          <p className="text-[11px] text-zinc-400 mt-1">Invoice: <strong className="text-white">{invoiceNumber}</strong> • {customerName}</p>
        </div>

        {/* Dynamic Live QR Code Container */}
        <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center mx-auto w-64 h-64 shadow-xl border-4 border-zinc-800">
          <img
            src={qrCodeUrl}
            alt="Dynamic UPI QR Code"
            className="w-52 h-52 object-contain"
          />
        </div>

        {/* UPI ID & Copy button */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800 text-xs">
          <div className="text-left">
            <span className="text-zinc-400 block text-[10px]">Merchant UPI VPA</span>
            <span className="font-mono font-semibold text-white">{upiId}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition border border-zinc-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied URI' : 'Copy Intent'}</span>
          </button>
        </div>

        {/* UTR Input & Confirmation Action */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Simulated Bank Ref (UTR):</span>
            <span className="font-mono text-zinc-300 font-semibold">{utrNumber}</span>
          </div>

          <button
            onClick={handleConfirmPaid}
            disabled={isVerifying}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold text-sm transition shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{isVerifying ? 'Verifying with Bank...' : 'Confirm UPI Payment Received'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
