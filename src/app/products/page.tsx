'use client';

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  X,
  Filter,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { DataTable, Column } from '../../components/common/DataTable';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { GSTSlab, Product } from '../../lib/types';
import { formatINR } from '../../lib/utils';

export default function ProductsPage() {
  const { products, suppliers, addProduct, updateProduct, deleteProduct } = useData();
  const { showToast } = useNotification();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK' | 'IN_STOCK'>('ALL');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('Groceries');
  const [formBrand, setFormBrand] = useState('');
  const [formHsn, setFormHsn] = useState('1512');
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formCostPrice, setFormCostPrice] = useState('100');
  const [formSellingPrice, setFormSellingPrice] = useState('125');
  const [formMrp, setFormMrp] = useState('140');
  const [formGstRate, setFormGstRate] = useState<GSTSlab>(18);
  const [formStock, setFormStock] = useState('50');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formSupplierId, setFormSupplierId] = useState(suppliers[0]?.id || '');
  const [formDescription, setFormDescription] = useState('');

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormBarcode(`890103${Math.floor(100000 + Math.random() * 900000)}`);
    setFormCategory('Groceries');
    setFormBrand('');
    setFormHsn('1512');
    setFormUnit('Pcs');
    setFormCostPrice('100');
    setFormSellingPrice('130');
    setFormMrp('150');
    setFormGstRate(18);
    setFormStock('50');
    setFormMinStock('15');
    setFormSupplierId(suppliers[0]?.id || '');
    setFormDescription('');
    setProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormBrand(p.brand);
    setFormHsn(p.hsnCode);
    setFormUnit(p.unit);
    setFormCostPrice(p.costPrice.toString());
    setFormSellingPrice(p.sellingPrice.toString());
    setFormMrp(p.mrp.toString());
    setFormGstRate(p.gstRate);
    setFormStock(p.currentStock.toString());
    setFormMinStock(p.minStockLevel.toString());
    setFormSupplierId(p.supplierId);
    setFormDescription(p.description);
    setProductModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === formSupplierId);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category: formCategory,
        brand: formBrand,
        hsnCode: formHsn,
        unit: formUnit,
        costPrice: parseFloat(formCostPrice) || 0,
        sellingPrice: parseFloat(formSellingPrice) || 0,
        mrp: parseFloat(formMrp) || 0,
        gstRate: formGstRate,
        currentStock: parseInt(formStock, 10) || 0,
        minStockLevel: parseInt(formMinStock, 10) || 0,
        supplierId: formSupplierId,
        supplierName: sup?.name || '',
        description: formDescription,
      });

      showToast({ title: 'Product Updated', message: `${formName} was updated successfully.`, type: 'success' });
    } else {
      addProduct({
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category: formCategory,
        brand: formBrand,
        hsnCode: formHsn,
        unit: formUnit,
        costPrice: parseFloat(formCostPrice) || 0,
        sellingPrice: parseFloat(formSellingPrice) || 0,
        mrp: parseFloat(formMrp) || 0,
        gstRate: formGstRate,
        currentStock: parseInt(formStock, 10) || 0,
        minStockLevel: parseInt(formMinStock, 10) || 0,
        supplierId: formSupplierId,
        supplierName: sup?.name || '',
        description: formDescription,
        dailyVelocity: 4.5,
      });

      showToast({ title: 'Product Created', message: `${formName} added to catalog.`, type: 'success' });
    }

    setProductModalOpen(false);
  };

  const handleDelete = (p: Product) => {
    if (confirm(`Are you sure you want to delete ${p.name}?`)) {
      deleteProduct(p.id);
      showToast({ title: 'Product Deleted', message: `${p.name} removed.`, type: 'info' });
    }
  };

  // Filtered dataset
  const filteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW_STOCK' && p.currentStock <= p.minStockLevel) ||
      (stockFilter === 'IN_STOCK' && p.currentStock > p.minStockLevel);
    return matchesCat && matchesStock;
  });

  const columns: Column<Product>[] = [
    {
      header: 'Product Details',
      accessorKey: 'name',
      sortable: true,
      cell: p => (
        <div>
          <h4 className="font-bold text-white text-xs">{p.name}</h4>
          <p className="text-[11px] text-slate-400 font-mono">SKU: {p.sku} | HSN: {p.hsnCode} | {p.brand}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: p => (
        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium">
          {p.category}
        </span>
      ),
    },
    {
      header: 'Selling Price',
      accessorKey: 'sellingPrice',
      sortable: true,
      align: 'right',
      cell: p => (
        <div>
          <span className="font-bold text-emerald-400 text-xs">{formatINR(p.sellingPrice)}</span>
          <span className="text-[10px] text-slate-500 block">MRP: {formatINR(p.mrp)}</span>
        </div>
      ),
    },
    {
      header: 'Cost Price',
      accessorKey: 'costPrice',
      sortable: true,
      align: 'right',
      cell: p => <span className="text-slate-300 text-xs">{formatINR(p.costPrice)}</span>,
    },
    {
      header: 'GST Slab',
      accessorKey: 'gstRate',
      sortable: true,
      align: 'center',
      cell: p => (
        <span className="font-bold text-indigo-400 text-xs">{p.gstRate}%</span>
      ),
    },
    {
      header: 'Stock Status',
      accessorKey: 'currentStock',
      sortable: true,
      align: 'right',
      cell: p => {
        const isLow = p.currentStock <= p.minStockLevel;
        return (
          <div className="text-right">
            <span className={`font-bold text-xs ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
              {p.currentStock} {p.unit}
            </span>
            <span className={`block text-[10px] ${isLow ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
              {isLow ? `Low (Min: ${p.minStockLevel})` : `Min: ${p.minStockLevel}`}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      cell: p => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setBarcodeModalProduct(p)}
            title="Print Barcode Label"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 transition"
          >
            <Barcode className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEditModal(p)}
            title="Edit Product"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(p)}
            title="Delete Product"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-4 h-4" />
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
              Products Catalog & Inventory
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                {products.length} Products
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage SKUs, barcodes, MRP pricing, GST slabs, and supplier relations
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Data Table with Filters */}
        <DataTable
          data={filteredProducts}
          columns={columns}
          searchPlaceholder="Search by product name, SKU, HSN, or barcode..."
          searchKeys={['name', 'sku', 'barcode', 'hsnCode', 'brand', 'category']}
          exportFilename="products_catalog"
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="LOW_STOCK">Low Stock Only</option>
                <option value="IN_STOCK">Healthy Stock</option>
              </select>
            </div>
          }
        />

        {/* Add / Edit Product Modal */}
        {productModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product to Inventory'}
                </h3>
                <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 font-semibold">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Fortune Sunlite Refined Sunflower Oil 1L"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">SKU / Item Code *</label>
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={e => setFormSku(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Barcode (EAN-13 / UPC)</label>
                    <input
                      type="text"
                      value={formBarcode}
                      onChange={e => setFormBarcode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Category</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      placeholder="e.g. Groceries, Electronics, Apparel"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Brand</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={e => setFormBrand(e.target.value)}
                      placeholder="e.g. Tata, Xiaomi, Bosch"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">HSN Code *</label>
                    <input
                      type="text"
                      required
                      value={formHsn}
                      onChange={e => setFormHsn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Unit of Measurement</label>
                    <select
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    >
                      <option value="Pcs">Pcs (Pieces)</option>
                      <option value="Kg">Kg (Kilograms)</option>
                      <option value="Litre">Litre</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                      <option value="Bag">Bag</option>
                      <option value="Roll">Roll</option>
                      <option value="Set">Set</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Purchase / Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCostPrice}
                      onChange={e => setFormCostPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Selling Price (Excl/Incl Tax) (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formSellingPrice}
                      onChange={e => setFormSellingPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-bold text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formMrp}
                      onChange={e => setFormMrp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">GST Rate Slab</label>
                    <select
                      value={formGstRate}
                      onChange={e => setFormGstRate(parseInt(e.target.value, 10) as GSTSlab)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-bold text-indigo-400"
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5% (Essential)</option>
                      <option value={12}>12% (Standard 1)</option>
                      <option value={18}>18% (Standard 2)</option>
                      <option value={28}>28% (Luxury/Demerit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Current Stock Qty</label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={e => setFormStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Min Stock Alert Level</label>
                    <input
                      type="number"
                      value={formMinStock}
                      onChange={e => setFormMinStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 font-semibold">Primary Supplier</label>
                    <select
                      value={formSupplierId}
                      onChange={e => setFormSupplierId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mt-1"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.categories.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barcode Print Label Modal */}
        {barcodeModalProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl text-center">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Barcode Label Preview</h3>
                <button onClick={() => setBarcodeModalProduct(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barcode Sticker Preview */}
              <div className="p-4 bg-white text-black rounded-xl border-2 border-zinc-300 shadow-md font-mono text-center space-y-1">
                <p className="text-xs font-bold">{barcodeModalProduct.name.slice(0, 24)}</p>
                <div className="font-mono text-2xl tracking-widest py-2 font-black">
                  ||| | |||| | ||| |||| |
                </div>
                <p className="text-xs font-bold tracking-wider">{barcodeModalProduct.barcode}</p>
                <p className="text-sm font-black text-black">MRP: {formatINR(barcodeModalProduct.mrp)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-black" />
                  <span>Print Barcode Label</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
