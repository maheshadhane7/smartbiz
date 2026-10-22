'use client';

import React, { useState } from 'react';
import { ScanLine, Camera, X, Check, Search } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Product } from '../../lib/types';
import { formatINR } from '../../lib/utils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanProduct: (product: Product) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScanProduct }: BarcodeScannerModalProps) {
  const { products } = useData();
  const [manualCode, setManualCode] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = (barcode: string) => {
    const found = products.find(p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase());
    if (found) {
      setScannedFeedback(`Scanned: ${found.name}`);
      onScanProduct(found);
      setTimeout(() => {
        setScannedFeedback(null);
        onClose();
      }, 700);
    } else {
      setScannedFeedback('Product not found for this barcode');
      setTimeout(() => setScannedFeedback(null), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Barcode & QR Scanner</h3>
              <p className="text-xs text-slate-400">Scan product packaging or select SKU</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Scanner Camera Animation Frame */}
        <div className="relative h-48 rounded-2xl bg-slate-950 border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center overflow-hidden">
          {/* Laser Scan Line Animation */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />

          <Camera className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-xs font-mono text-slate-400">Position barcode inside camera frame</p>
          <span className="text-[10px] text-cyan-400 font-mono mt-1">Laser active (650nm emulation)</span>

          {scannedFeedback && (
            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-4 text-center">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Check className="w-5 h-5" />
                {scannedFeedback}
              </span>
            </div>
          )}
        </div>

        {/* Manual Barcode Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Enter Barcode / SKU Manually</label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="e.g. 890103001001 or FMCG-OIL-01"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => handleScan(manualCode)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Scan
            </button>
          </div>
        </div>

        {/* Quick Click Sample Barcodes for Demo */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick Scan Samples (Demo)
          </span>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {products.slice(0, 6).map(prod => (
              <button
                key={prod.id}
                onClick={() => handleScan(prod.barcode)}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/50 text-left transition group"
              >
                <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white">{prod.name}</p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="font-mono text-indigo-400">{prod.barcode}</span>
                  <span className="font-bold text-emerald-400">{formatINR(prod.sellingPrice)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
