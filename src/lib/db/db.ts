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
  User,
} from '../types';
import {
  SEED_BUSINESS,
  SEED_CALL_RECORDS,
  SEED_EXPENSES,
  SEED_PRODUCTS,
  SEED_PURCHASES,
  SEED_REMINDER_RULES,
  SEED_SUPPLIERS,
  SEED_TELEPHONY,
  SEED_USERS,
  SEED_CUSTOMERS_RAW,
  generateSeedInvoices,
} from './seedData';
import { generateId, generateInvoiceNumber } from '../utils';
import { computeCustomerIntelligence } from '../ai/customerScoring';

export interface DatabaseState {
  business: BusinessProfile;
  telephony: TelephonySettings;
  users: User[];
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
  version: string;
}

const STORAGE_KEY = 'smartbiz_erp_db_v1';

export function getInitialDatabase(): DatabaseState {
  const { invoices, customers, payments, stockMovements, auditLogs } = generateSeedInvoices(
    SEED_PRODUCTS,
    SEED_CUSTOMERS_RAW
  );

  return {
    business: SEED_BUSINESS,
    telephony: SEED_TELEPHONY,
    users: SEED_USERS,
    products: SEED_PRODUCTS,
    customers,
    suppliers: SEED_SUPPLIERS,
    invoices,
    payments,
    purchases: SEED_PURCHASES,
    expenses: SEED_EXPENSES,
    returns: [],
    stockMovements,
    callRecords: SEED_CALL_RECORDS,
    reminderRules: SEED_REMINDER_RULES,
    reminderLogs: [],
    auditLogs,
    anomalies: [],
    version: '1.0.0',
  };
}

export function loadDatabase(): DatabaseState {
  if (typeof window === 'undefined') {
    return getInitialDatabase();
  }

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      const initial = getInitialDatabase();
      saveDatabase(initial);
      return initial;
    }
    const data = JSON.parse(serialized) as DatabaseState;
    // Migrate/sync business profile if old default name exists
    if (!data.business || data.business.name === 'Nexus SmartBiz ERP & Retail' || !data.business.name) {
      data.business = {
        ...SEED_BUSINESS,
        ...(data.business || {}),
        name: 'Prasana Enterprises',
        legalName: 'Prasana Enterprises Pvt Ltd',
        email: data.business?.email === 'support@nexussmartbiz.in' ? 'contact@prasanaenterprises.in' : data.business?.email || 'contact@prasanaenterprises.in',
        website: data.business?.website === 'https://nexussmartbiz.in' ? 'https://prasanaenterprises.in' : data.business?.website || 'https://prasanaenterprises.in',
        bankUpiId: data.business?.bankUpiId === 'smartbiz@icici' ? 'prasanaenterprises@icici' : data.business?.bankUpiId || 'prasanaenterprises@icici',
      };
      saveDatabase(data);
    }
    return data;
  } catch (err) {
    console.error('Failed to load database from localStorage, falling back to seed:', err);
    return getInitialDatabase();
  }
}

export function saveDatabase(state: DatabaseState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist database to localStorage:', err);
  }
}

export function resetDatabaseToSeed(): DatabaseState {
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

export function exportDatabaseJSON(): string {
  const db = loadDatabase();
  return JSON.stringify(db, null, 2);
}

export function importDatabaseJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr) as DatabaseState;
    if (parsed && parsed.products && parsed.customers && parsed.invoices) {
      saveDatabase(parsed);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to parse and import database JSON:', err);
    return false;
  }
}
