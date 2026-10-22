'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AIAnomalyAlert,
  AuditLog,
  BusinessProfile,
  CallRecord,
  Customer,
  Expense,
  Invoice,
  PaymentRecord,
  Product,
  PurchaseOrder,
  ReminderLog,
  ReminderRule,
  SalesReturn,
  StockMovement,
  Supplier,
  TelephonySettings,
} from '../lib/types';
import {
  DatabaseState,
  exportDatabaseJSON,
  importDatabaseJSON,
  loadDatabase,
  resetDatabaseToSeed,
  saveDatabase,
} from '../lib/db/db';
import { generateId, generateInvoiceNumber } from '../lib/utils';
import { computeCustomerIntelligence } from '../lib/ai/customerScoring';
import { detectBusinessAnomalies } from '../lib/ai/anomalyDetector';
import { useAuth } from './AuthContext';

interface DataContextType {
  state: DatabaseState;
  isLoaded: boolean;
  business: BusinessProfile;
  telephony: TelephonySettings;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  purchases: PurchaseOrder[];
  expenses: Expense[];
  returns: SalesReturn[];
  stockMovements: StockMovement[];
  callRecords: CallRecord[];
  reminderRules: ReminderRule[];
  reminderLogs: ReminderLog[];
  auditLogs: AuditLog[];
  anomalies: AIAnomalyAlert[];

  // Mutations
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  recordPayment: (paymentData: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'>) => PaymentRecord;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantity: number, type: StockMovement['type'], reason: string) => void;
  addCustomer: (customerData: Omit<Customer, 'id' | 'intelligence' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => PurchaseOrder;
  receivePurchaseOrder: (poId: string) => void;
  addExpense: (expenseData: Omit<Expense, 'id' | 'voucherNumber'>) => Expense;
  processSalesReturn: (returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>) => SalesReturn;
  scheduleCall: (callData: Omit<CallRecord, 'id'>) => CallRecord;
  updateCallRecord: (callId: string, updates: Partial<CallRecord>) => void;
  triggerReminderRule: (ruleId: string, customerId: string, invoiceId: string) => ReminderLog;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  updateTelephonySettings: (settings: Partial<TelephonySettings>) => void;
  resetToFactorySeed: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseState>(() => loadDatabase());
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loaded = loadDatabase();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  // Save changes to localStorage whenever state changes
  const updateAndSave = (newState: DatabaseState) => {
    // Run anomaly detector
    const detectedAnomalies = detectBusinessAnomalies(
      newState.invoices,
      newState.stockMovements,
      newState.returns,
      newState.products
    );
    newState.anomalies = detectedAnomalies;

    setState(newState);
    saveDatabase(newState);
  };

  const addAuditLog = (action: string, module: string, details: string, currentState: DatabaseState): DatabaseState => {
    const newLog: AuditLog = {
      id: generateId('log'),
      userId: currentUser?.id || 'usr_system',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'admin',
      action,
      module,
      details,
      timestamp: new Date().toISOString(),
    };
    return {
      ...currentState,
      auditLogs: [newLog, ...currentState.auditLogs],
    };
  };

  // 1. Create Invoice with auto stock deduction & payment record
  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const id = generateId('inv');
    const invoiceNumber = generateInvoiceNumber(state.invoices.length + 101, state.business.invoicePrefix || 'INV');
    const now = new Date().toISOString();

    const invoice: Invoice = {
      ...invoiceData,
      id,
      invoiceNumber,
      createdAt: now,
    };

    // Update Product stocks & generate stock movement logs
    const updatedProducts = [...state.products];
    const newStockMovements: StockMovement[] = [];

    for (const item of invoice.items) {
      const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        const prevStock = prod.currentStock;
        const newStock = Math.max(0, prevStock - item.quantity);

        updatedProducts[prodIndex] = {
          ...prod,
          currentStock: newStock,
          updatedAt: now,
        };

        newStockMovements.push({
          id: generateId('sm'),
          productId: prod.id,
          productName: prod.name,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Sale via ${invoiceNumber}`,
          referenceType: 'INVOICE',
          referenceId: id,
          createdBy: currentUser?.name || 'Cashier',
          createdAt: now,
        });
      }
    }

    // Update Customer records
    const updatedCustomers = [...state.customers];
    const custIndex = updatedCustomers.findIndex(c => c.id === invoice.customerId);
    if (custIndex >= 0) {
      const cust = updatedCustomers[custIndex];
      const newOutstanding = cust.outstandingBalance + invoice.balanceAmount;
      const newTotalPurchases = cust.totalPurchases + invoice.grandTotal;
      const newTotalOrders = cust.totalOrders + 1;

      const updatedCust: Customer = {
        ...cust,
        outstandingBalance: newOutstanding,
        totalPurchases: newTotalPurchases,
        totalOrders: newTotalOrders,
        lastPurchaseDate: now,
        intelligence: computeCustomerIntelligence(
          { ...cust, outstandingBalance: newOutstanding, totalPurchases: newTotalPurchases, totalOrders: newTotalOrders },
          [invoice, ...state.invoices]
        ),
      };
      updatedCustomers[custIndex] = updatedCust;
    }

    // If paid amount > 0, generate payment record
    const updatedPayments = [...state.payments];
    if (invoice.paidAmount > 0) {
      updatedPayments.push({
        id: generateId('pay'),
        receiptNumber: `REC-${invoiceNumber.slice(4)}`,
        invoiceId: id,
        invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: invoice.paidAmount,
        paymentMode: invoice.paymentMode,
        status: 'SUCCESS',
        recordedBy: currentUser?.name || 'Cashier',
        createdAt: now,
      });
    }

    let newState: DatabaseState = {
      ...state,
      invoices: [invoice, ...state.invoices],
      products: updatedProducts,
      stockMovements: [...newStockMovements, ...state.stockMovements],
      customers: updatedCustomers,
      payments: updatedPayments,
    };

    newState = addAuditLog(
      'INVOICE_CREATED',
      'Billing',
      `Created invoice ${invoiceNumber} for ${invoice.customerName} (Total: ₹${invoice.grandTotal.toLocaleString('en-IN')})`,
      newState
    );

    updateAndSave(newState);
    return invoice;
  };

  // 2. Record Payment on outstanding invoice
  const recordPayment = (paymentData: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'>): PaymentRecord => {
    const id = generateId('pay');
    const receiptNumber = `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const payment: PaymentRecord = {
      ...paymentData,
      id,
      receiptNumber,
      createdAt: now,
    };

    // Update Invoice balance & status
    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === payment.invoiceId) {
        const newPaid = inv.paidAmount + payment.amount;
        const newBalance = Math.max(0, inv.grandTotal - newPaid);
        const newStatus: Invoice['status'] = newBalance === 0 ? 'PAID' : 'PARTIAL';
        return {
          ...inv,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
        };
      }
      return inv;
    });

    // Update Customer outstanding balance
    const updatedCustomers = state.customers.map(cust => {
      if (cust.id === payment.customerId) {
        const newOutstanding = Math.max(0, cust.outstandingBalance - payment.amount);
        return {
          ...cust,
          outstandingBalance: newOutstanding,
          intelligence: computeCustomerIntelligence({ ...cust, outstandingBalance: newOutstanding }, updatedInvoices),
        };
      }
      return cust;
    });

    let newState: DatabaseState = {
      ...state,
      payments: [payment, ...state.payments],
      invoices: updatedInvoices,
      customers: updatedCustomers,
    };

    newState = addAuditLog(
      'PAYMENT_RECORDED',
      'Payments',
      `Recorded payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.customerName} via ${payment.paymentMode}`,
      newState
    );

    updateAndSave(newState);
    return payment;
  };

  // 3. Products
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const id = generateId('prod');
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    let newState: DatabaseState = {
      ...state,
      products: [newProduct, ...state.products],
    };

    newState = addAuditLog('PRODUCT_ADDED', 'Inventory', `Added new product ${newProduct.name} (SKU: ${newProduct.sku})`, newState);
    updateAndSave(newState);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    const updatedProducts = state.products.map(p => (p.id === id ? { ...p, ...updates, updatedAt: now } : p));
    let newState = { ...state, products: updatedProducts };
    newState = addAuditLog('PRODUCT_UPDATED', 'Inventory', `Updated product ID: ${id}`, newState);
    updateAndSave(newState);
  };

  const deleteProduct = (id: string) => {
    const prod = state.products.find(p => p.id === id);
    const updatedProducts = state.products.filter(p => p.id !== id);
    let newState = { ...state, products: updatedProducts };
    newState = addAuditLog('PRODUCT_DELETED', 'Inventory', `Deleted product ${prod?.name || id}`, newState);
    updateAndSave(newState);
  };

  // 4. Stock Adjustment
  const adjustStock = (productId: string, quantity: number, type: StockMovement['type'], reason: string) => {
    const now = new Date().toISOString();
    let prevStock = 0;
    let newStock = 0;
    let prodName = '';

    const updatedProducts = state.products.map(prod => {
      if (prod.id === productId) {
        prodName = prod.name;
        prevStock = prod.currentStock;
        if (type === 'IN') newStock = prevStock + quantity;
        else if (type === 'OUT' || type === 'DAMAGE') newStock = Math.max(0, prevStock - quantity);
        else newStock = quantity; // Adjustment override

        return { ...prod, currentStock: newStock, updatedAt: now };
      }
      return prod;
    });

    const movement: StockMovement = {
      id: generateId('sm'),
      productId,
      productName: prodName,
      type,
      quantity,
      previousStock: prevStock,
      newStock,
      reason,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name || 'Manager',
      createdAt: now,
    };

    let newState = {
      ...state,
      products: updatedProducts,
      stockMovements: [movement, ...state.stockMovements],
    };

    newState = addAuditLog('STOCK_ADJUSTED', 'Inventory', `${type} of ${quantity} units for ${prodName}. New Stock: ${newStock}`, newState);
    updateAndSave(newState);
  };

  // 5. Customers
  const addCustomer = (customerData: Omit<Customer, 'id' | 'intelligence' | 'createdAt'>): Customer => {
    const id = generateId('cust');
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id,
      createdAt: now,
      intelligence: computeCustomerIntelligence(customerData, []),
    };

    let newState = { ...state, customers: [newCustomer, ...state.customers] };
    newState = addAuditLog('CUSTOMER_CREATED', 'CRM', `Added customer ${newCustomer.name}`, newState);
    updateAndSave(newState);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updatedCustomers = state.customers.map(c => {
      if (c.id === id) {
        const merged = { ...c, ...updates };
        merged.intelligence = computeCustomerIntelligence(merged, state.invoices);
        return merged;
      }
      return c;
    });

    let newState = { ...state, customers: updatedCustomers };
    newState = addAuditLog('CUSTOMER_UPDATED', 'CRM', `Updated customer ID: ${id}`, newState);
    updateAndSave(newState);
  };

  // 6. Suppliers
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const id = generateId('sup');
    const newSupplier: Supplier = { ...supplierData, id, createdAt: new Date().toISOString() };
    let newState = { ...state, suppliers: [newSupplier, ...state.suppliers] };
    newState = addAuditLog('SUPPLIER_CREATED', 'Purchases', `Added supplier ${newSupplier.name}`, newState);
    updateAndSave(newState);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const updatedSuppliers = state.suppliers.map(s => (s.id === id ? { ...s, ...updates } : s));
    let newState = { ...state, suppliers: updatedSuppliers };
    updateAndSave(newState);
  };

  // 7. Purchase Orders & Auto Stock Increase on GRN
  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>): PurchaseOrder => {
    const id = generateId('po');
    const poNumber = `PO-2026-${(state.purchases.length + 101).toString().padStart(5, '0')}`;
    const po: PurchaseOrder = { ...poData, id, poNumber };

    let newState = { ...state, purchases: [po, ...state.purchases] };
    newState = addAuditLog('PO_CREATED', 'Purchases', `Created Purchase Order ${poNumber} for ${po.supplierName}`, newState);
    updateAndSave(newState);
    return po;
  };

  const receivePurchaseOrder = (poId: string) => {
    const now = new Date().toISOString();
    const targetPo = state.purchases.find(p => p.id === poId);
    if (!targetPo || targetPo.status === 'RECEIVED') return;

    // Automatically increase product stock & create stock movements
    const updatedProducts = [...state.products];
    const newStockMovements: StockMovement[] = [];

    for (const item of targetPo.items) {
      const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        const prevStock = prod.currentStock;
        const newStock = prevStock + item.quantity;

        updatedProducts[prodIndex] = {
          ...prod,
          currentStock: newStock,
          costPrice: item.unitPrice, // Update latest purchase cost
          updatedAt: now,
        };

        newStockMovements.push({
          id: generateId('sm'),
          productId: prod.id,
          productName: prod.name,
          type: 'IN',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `GRN Received from PO ${targetPo.poNumber}`,
          referenceType: 'PURCHASE',
          referenceId: poId,
          createdBy: currentUser?.name || 'Manager',
          createdAt: now,
        });
      }
    }

    const updatedPurchases = state.purchases.map(p =>
      p.id === poId ? { ...p, status: 'RECEIVED' as const, receivedDate: now } : p
    );

    let newState = {
      ...state,
      purchases: updatedPurchases,
      products: updatedProducts,
      stockMovements: [...newStockMovements, ...state.stockMovements],
    };

    newState = addAuditLog(
      'GRN_RECEIVED',
      'Purchases',
      `Goods Received for PO ${targetPo.poNumber}. Automatically updated inventory for ${targetPo.items.length} items.`,
      newState
    );

    updateAndSave(newState);
  };

  // 8. Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'voucherNumber'>): Expense => {
    const id = generateId('exp');
    const voucherNumber = `EXP-2026-${(state.expenses.length + 101).toString().padStart(4, '0')}`;
    const exp: Expense = { ...expenseData, id, voucherNumber };

    let newState = { ...state, expenses: [exp, ...state.expenses] };
    newState = addAuditLog(
      'EXPENSE_ADDED',
      'Expenses',
      `Recorded ${exp.category} expense of ₹${exp.amount.toLocaleString('en-IN')} (Voucher: ${voucherNumber})`,
      newState
    );
    updateAndSave(newState);
    return exp;
  };

  // 9. Sales Returns with stock restoration
  const processSalesReturn = (returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>): SalesReturn => {
    const id = generateId('ret');
    const returnNumber = `RET-2026-${(state.returns.length + 101).toString().padStart(4, '0')}`;
    const now = new Date().toISOString();

    const salesRet: SalesReturn = { ...returnData, id, returnNumber, createdAt: now };

    const updatedProducts = [...state.products];
    const newStockMovements: StockMovement[] = [];

    if (salesRet.restockInventory) {
      for (const item of salesRet.items) {
        const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIndex >= 0) {
          const prod = updatedProducts[prodIndex];
          const prev = prod.currentStock;
          const newStk = prev + item.quantity;
          updatedProducts[prodIndex] = { ...prod, currentStock: newStk, updatedAt: now };

          newStockMovements.push({
            id: generateId('sm'),
            productId: prod.id,
            productName: prod.name,
            type: 'RETURN',
            quantity: item.quantity,
            previousStock: prev,
            newStock: newStk,
            reason: `Return for ${salesRet.invoiceNumber}: ${item.reason}`,
            referenceType: 'RETURN',
            referenceId: id,
            createdBy: currentUser?.name || 'Cashier',
            createdAt: now,
          });
        }
      }
    }

    let newState = {
      ...state,
      returns: [salesRet, ...state.returns],
      products: updatedProducts,
      stockMovements: [...newStockMovements, ...state.stockMovements],
    };

    newState = addAuditLog(
      'SALES_RETURN',
      'Billing',
      `Processed return ${returnNumber} on ${salesRet.invoiceNumber} for ₹${salesRet.totalRefundAmount.toLocaleString('en-IN')}`,
      newState
    );

    updateAndSave(newState);
    return salesRet;
  };

  // 10. Voice Call Center & Reminders
  const scheduleCall = (callData: Omit<CallRecord, 'id'>): CallRecord => {
    const id = generateId('call');
    const record: CallRecord = { ...callData, id };
    let newState = { ...state, callRecords: [record, ...state.callRecords] };
    updateAndSave(newState);
    return record;
  };

  const updateCallRecord = (callId: string, updates: Partial<CallRecord>) => {
    const updatedCalls = state.callRecords.map(c => (c.id === callId ? { ...c, ...updates } : c));
    let newState = { ...state, callRecords: updatedCalls };
    updateAndSave(newState);
  };

  const triggerReminderRule = (ruleId: string, customerId: string, invoiceId: string): ReminderLog => {
    const rule = state.reminderRules.find(r => r.id === ruleId);
    const customer = state.customers.find(c => c.id === customerId);
    const invoice = state.invoices.find(i => i.id === invoiceId);

    const now = new Date().toISOString();
    const log: ReminderLog = {
      id: generateId('rem_log'),
      customerId,
      customerName: customer?.name || 'Customer',
      invoiceId,
      invoiceNumber: invoice?.invoiceNumber || 'INV',
      channel: rule?.channels[0] || 'whatsapp',
      status: 'DELIVERED',
      message: rule?.templateText
        .replace('{{customer_name}}', customer?.name || '')
        .replace('{{invoice_number}}', invoice?.invoiceNumber || '')
        .replace('{{amount}}', `₹${invoice?.balanceAmount.toLocaleString('en-IN') || 0}`)
        .replace('{{due_date}}', invoice?.dueDate || '')
        .replace('{{payment_link}}', `https://pay.nexussmartbiz.in/${invoice?.invoiceNumber}`) || 'Payment reminder',
      recipient: customer?.phone || customer?.email || '',
      sentAt: now,
    };

    let newState = {
      ...state,
      reminderLogs: [log, ...state.reminderLogs],
    };

    newState = addAuditLog(
      'REMINDER_DISPATCHED',
      'Reminders',
      `Sent ${log.channel.toUpperCase()} reminder to ${log.customerName} for ${log.invoiceNumber}`,
      newState
    );

    updateAndSave(newState);
    return log;
  };

  const updateBusinessProfile = (profile: Partial<BusinessProfile>) => {
    const newState = { ...state, business: { ...state.business, ...profile } };
    updateAndSave(newState);
  };

  const updateTelephonySettings = (settings: Partial<TelephonySettings>) => {
    const newState = { ...state, telephony: { ...state.telephony, ...settings } };
    updateAndSave(newState);
  };

  const resetToFactorySeed = () => {
    const fresh = resetDatabaseToSeed();
    setState(fresh);
  };

  const exportJSON = () => {
    return exportDatabaseJSON();
  };

  const importJSON = (json: string): boolean => {
    const success = importDatabaseJSON(json);
    if (success) {
      setState(loadDatabase());
    }
    return success;
  };

  return (
    <DataContext.Provider
      value={{
        state,
        isLoaded,
        business: state.business,
        telephony: state.telephony,
        products: state.products,
        customers: state.customers,
        suppliers: state.suppliers,
        invoices: state.invoices,
        payments: state.payments,
        purchases: state.purchases,
        expenses: state.expenses,
        returns: state.returns,
        stockMovements: state.stockMovements,
        callRecords: state.callRecords,
        reminderRules: state.reminderRules,
        reminderLogs: state.reminderLogs,
        auditLogs: state.auditLogs,
        anomalies: state.anomalies,

        createInvoice,
        recordPayment,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        addSupplier,
        updateSupplier,
        createPurchaseOrder,
        receivePurchaseOrder,
        addExpense,
        processSalesReturn,
        scheduleCall,
        updateCallRecord,
        triggerReminderRule,
        updateBusinessProfile,
        updateTelephonySettings,
        resetToFactorySeed,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
