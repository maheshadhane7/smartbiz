'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  ScanLine,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  CheckCircle2,
  Printer,
  Sparkles,
  Percent,
  X,
  Keyboard,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Customer, Invoice, InvoiceItem, PaymentMode, Product } from '../../lib/types';
import { formatINR } from '../../lib/utils';
import { calculateItemTax } from '../../lib/gst/gstCalculator';
import { BarcodeScannerModal } from '../../components/billing/BarcodeScannerModal';
import { UPIPaymentModal } from '../../components/billing/UPIPaymentModal';
import { InvoicePrintModal } from '../../components/billing/InvoicePrintModal';

interface CartItem extends InvoiceItem {
  maxStock: number;
}

export default function POSBillingPage() {
  const { products, customers, invoices, createInvoice, addCustomer, business } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [discountOverallPercent, setDiscountOverallPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Modals
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  // New Customer form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [newCustState, setNewCustState] = useState('Maharashtra');
  const [newCustStateCode, setNewCustStateCode] = useState('27');

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  // Inter-state check
  const isInterState = selectedCustomer?.stateCode !== (business.stateCode || '27');

  // Keyboard shortcut listener: F4 to checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      productSearch === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch);
    return matchesCat && matchesSearch;
  });

  // Add Product to Cart
  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.currentStock) {
        showToast({
          title: 'Stock Limit Reached',
          message: `Only ${product.currentStock} units available in stock.`,
          type: 'warning',
        });
        return;
      }
      updateQuantity(existing.productId, existing.quantity + 1);
    } else {
      if (product.currentStock <= 0) {
        showToast({
          title: 'Out of Stock',
          message: `${product.name} is currently out of stock.`,
          type: 'error',
        });
        return;
      }

      const taxRes = calculateItemTax(product.sellingPrice, 1, 0, product.gstRate, isInterState);
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        hsnCode: product.hsnCode,
        quantity: 1,
        unit: product.unit,
        costPrice: product.costPrice,
        unitPrice: product.sellingPrice,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: taxRes.taxableAmount,
        gstRate: product.gstRate,
        cgstRate: taxRes.cgstRate,
        cgstAmount: taxRes.cgstAmount,
        sgstRate: taxRes.sgstRate,
        sgstAmount: taxRes.sgstAmount,
        igstRate: taxRes.igstRate,
        igstAmount: taxRes.igstAmount,
        totalAmount: taxRes.totalAmount,
        maxStock: product.currentStock,
      };

      setCart([...cart, newItem]);
    }
  };

  // Update Cart Quantity
  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map(item => {
        if (item.productId === productId) {
          const qty = Math.min(newQty, item.maxStock);
          const taxRes = calculateItemTax(item.unitPrice, qty, item.discountPercent, item.gstRate, isInterState);
          return {
            ...item,
            quantity: qty,
            taxableAmount: taxRes.taxableAmount,
            cgstAmount: taxRes.cgstAmount,
            sgstAmount: taxRes.sgstAmount,
            igstAmount: taxRes.igstAmount,
            totalAmount: taxRes.totalAmount,
          };
        }
        return item;
      })
    );
  };

  // Update Item Discount
  const updateItemDiscount = (productId: string, discountPercent: number) => {
    setCart(
      cart.map(item => {
        if (item.productId === productId) {
          const taxRes = calculateItemTax(item.unitPrice, item.quantity, discountPercent, item.gstRate, isInterState);
          return {
            ...item,
            discountPercent,
            discountAmount: (item.unitPrice * item.quantity * discountPercent) / 100,
            taxableAmount: taxRes.taxableAmount,
            cgstAmount: taxRes.cgstAmount,
            sgstAmount: taxRes.sgstAmount,
            igstAmount: taxRes.igstAmount,
            totalAmount: taxRes.totalAmount,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaidAmountInput('');
    setDiscountOverallPercent(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemsDiscountTotal = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const overallDiscountAmount = (subtotal * discountOverallPercent) / 100;
  const totalDiscount = itemsDiscountTotal + overallDiscountAmount;

  const taxableTotal = Number(cart.reduce((sum, item) => sum + item.taxableAmount, 0).toFixed(2));
  const cgstTotal = Number(cart.reduce((sum, item) => sum + item.cgstAmount, 0).toFixed(2));
  const sgstTotal = Number(cart.reduce((sum, item) => sum + item.sgstAmount, 0).toFixed(2));
  const igstTotal = Number(cart.reduce((sum, item) => sum + item.igstAmount, 0).toFixed(2));
  const totalTax = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));

  const rawGrandTotal = taxableTotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  // Determine paid and balance
  const defaultPaid = paymentMode === 'CREDIT' ? 0 : grandTotal;
  const parsedPaid = paidAmountInput === '' ? defaultPaid : parseFloat(paidAmountInput) || 0;
  const paidAmount = Math.min(grandTotal, Math.max(0, parsedPaid));
  const balanceAmount = Math.max(0, grandTotal - paidAmount);

  // Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast({ title: 'Cart is empty', message: 'Add products to proceed.', type: 'warning' });
      return;
    }

    if (paymentMode === 'UPI' && paidAmount > 0 && !upiModalOpen) {
      // Open dynamic UPI modal first
      setUpiModalOpen(true);
      return;
    }

    finalizeInvoice();
  };

  const finalizeInvoice = (upiUtr?: string) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    let status: Invoice['status'] = 'PAID';
    if (balanceAmount > 0) {
      status = paidAmount === 0 ? 'UNPAID' : 'PARTIAL';
    }

    const created = createInvoice({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerGstin: selectedCustomer.gstin,
      customerState: selectedCustomer.state,
      customerStateCode: selectedCustomer.stateCode,
      isInterState,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit,
        costPrice: item.costPrice,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        taxableAmount: item.taxableAmount,
        gstRate: item.gstRate,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        igstRate: item.igstRate,
        igstAmount: item.igstAmount,
        totalAmount: item.totalAmount,
      })),
      subtotal,
      discountTotal: totalDiscount,
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalTax,
      roundOff,
      grandTotal,
      paidAmount,
      balanceAmount,
      paymentMode,
      status,
      dueDate: dueDate.toISOString().slice(0, 10),
      notes: notes || (upiUtr ? `Paid via UPI Ref: ${upiUtr}` : undefined),
      createdBy: currentUser?.id || 'usr_cashier',
      cashierName: currentUser?.name || 'Amit Verma',
    });

    setGeneratedInvoice(created);
    setPrintModalOpen(true);
    clearCart();

    showToast({
      title: 'Invoice Generated Successfully!',
      message: `${created.invoiceNumber} for ${created.customerName} (${formatINR(created.grandTotal)})`,
      type: 'success',
    });
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newCust = addCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: `${newCustName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      gstin: newCustGstin,
      state: newCustState,
      stateCode: newCustStateCode,
      address: 'Mumbai, Maharashtra',
      type: newCustGstin ? 'WHOLESALE' : 'RETAIL',
      creditLimit: 50000,
      outstandingBalance: 0,
      totalPurchases: 0,
      totalOrders: 0,
    });

    setSelectedCustomer(newCust);
    setNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustGstin('');

    showToast({
      title: 'Customer Added',
      message: `Selected ${newCust.name} for billing`,
      type: 'success',
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6.5rem)] animate-fade-in">
        {/* Left Column: Product Selection & Catalog Grid */}
        <div className="flex-1 flex flex-col bg-zinc-950 rounded-3xl border border-zinc-800 p-5 overflow-hidden">
          {/* Search, Barcode & Category Bar */}
          <div className="space-y-3 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search 50+ products by name, SKU, or barcode..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <button
                onClick={() => setBarcodeModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition shadow-sm"
              >
                <ScanLine className="w-4 h-4 text-white" />
                <span>Barcode Scan</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs whitespace-nowrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
            {filteredProducts.map(prod => {
              const inCartItem = cart.find(c => c.productId === prod.id);
              const isLowStock = prod.currentStock <= prod.minStockLevel;

              return (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`p-3 rounded-2xl bg-black border transition-all cursor-pointer select-none flex flex-col justify-between group ${
                    inCartItem
                      ? 'border-white bg-zinc-900 shadow-md'
                      : isLowStock
                      ? 'border-amber-500/40 hover:border-amber-500'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">{prod.sku}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                        {prod.gstRate}% GST
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-zinc-200 transition line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-white">{formatINR(prod.sellingPrice)}</span>
                      <span className="text-[10px] text-zinc-500 block">Stock: {prod.currentStock} {prod.unit}</span>
                    </div>

                    {inCartItem ? (
                      <span className="w-6 h-6 rounded-lg bg-white text-black font-bold text-xs flex items-center justify-center">
                        {inCartItem.quantity}
                      </span>
                    ) : (
                      <div className="p-1 rounded-lg bg-zinc-900 group-hover:bg-white text-zinc-400 group-hover:text-black transition">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Cart & Fast Checkout Terminal */}
        <div className="w-full lg:w-[420px] bg-zinc-950 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl shrink-0">
          {/* Customer Selection Header */}
          <div className="pb-3 border-b border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Customer / Khata</span>
              <button
                onClick={() => setNewCustomerModalOpen(true)}
                className="text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-semibold underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>

            <select
              value={selectedCustomer?.id}
              onChange={e => {
                const found = customers.find(c => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
              className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs font-medium text-white focus:outline-none focus:border-white"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - Bal: {formatINR(c.outstandingBalance)}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>GST Supply Type:</span>
              <strong className="text-white font-medium">
                {isInterState ? `Inter-State (IGST ${selectedCustomer?.stateCode})` : 'Intra-State (CGST+SGST 27)'}
              </strong>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 my-2 pr-1 min-h-[160px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12 space-y-2">
                <Receipt className="w-10 h-10 text-zinc-700" />
                <p className="text-xs">No products in cart.</p>
                <p className="text-[11px] text-zinc-600">Click items from catalog or scan barcode.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-white truncate">{item.productName}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>₹{item.unitPrice} × {item.quantity}</span>
                      <span>•</span>
                      <span>GST: {item.gstRate}%</span>
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="text-xs font-bold text-white">{formatINR(item.totalAmount)}</span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="block ml-auto text-zinc-500 hover:text-rose-400 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Calculation Summary */}
          <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-xs text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-400">Taxable Subtotal:</span>
              <span className="font-semibold">{formatINR(taxableTotal, true)}</span>
            </div>

            {isInterState ? (
              <div className="flex justify-between text-zinc-400">
                <span>IGST Total:</span>
                <span>{formatINR(igstTotal, true)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-zinc-400">
                <span>CGST + SGST ({cgstTotal > 0 ? 'Total' : '0%'}):</span>
                <span>{formatINR(cgstTotal + sgstTotal, true)}</span>
              </div>
            )}

            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Discount Applied:</span>
                <span>-{formatINR(totalDiscount, true)}</span>
              </div>
            )}

            {roundOff !== 0 && (
              <div className="flex justify-between text-zinc-500 text-[11px]">
                <span>Round Off:</span>
                <span>{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-extrabold text-white">
              <span>Grand Total:</span>
              <span className="text-xl text-white">{formatINR(grandTotal, true)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-3 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Payment Method
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setPaymentMode(mode);
                    if (mode === 'CREDIT') setPaidAmountInput('0');
                    else setPaidAmountInput(grandTotal.toString());
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                    paymentMode === mode
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {mode === 'BANK_TRANSFER' ? 'BANK' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Action Button */}
          <div className="pt-3">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-black text-sm tracking-wide transition shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-black" />
              <span>COLLECT & PRINT INVOICE (F4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        onScanProduct={addToCart}
      />

      {/* Dynamic UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={upiModalOpen}
        onClose={() => setUpiModalOpen(false)}
        amount={grandTotal}
        invoiceNumber={`INV-2026-00${invoices.length + 101}`}
        customerName={selectedCustomer.name}
        upiId={business.bankUpiId}
        onPaymentSuccess={utr => finalizeInvoice(utr)}
      />

      {/* Invoice Print & PDF Modal */}
      <InvoicePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        invoice={generatedInvoice}
      />

      {/* New Customer Modal */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Customer</h3>
              <button onClick={() => setNewCustomerModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-semibold">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Stores"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white focus:outline-none focus:border-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="+91 98200 00000"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white focus:outline-none focus:border-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold">GSTIN (Optional for B2B)</label>
                <input
                  type="text"
                  value={newCustGstin}
                  onChange={e => setNewCustGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCS1429B1Z8"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white focus:outline-none focus:border-white mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">State</label>
                  <input
                    type="text"
                    value={newCustState}
                    onChange={e => setNewCustState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold">State Code</label>
                  <input
                    type="text"
                    value={newCustStateCode}
                    onChange={e => setNewCustStateCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white mt-1 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition shadow-sm mt-2"
              >
                Save & Select Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
