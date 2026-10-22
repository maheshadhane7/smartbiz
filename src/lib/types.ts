export type UserRole = 'admin' | 'manager' | 'cashier' | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  pin?: string; // For fast cashier POS unlock
  lastLogin?: string;
}

export interface BusinessProfile {
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // e.g. "27" for Maharashtra
  pincode: string;
  website: string;
  logo: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankUpiId: string;
  terms: string[];
  invoicePrefix: string;
}

export type GSTSlab = 0 | 5 | 12 | 18 | 28;

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  hsnCode: string;
  unit: string; // Pcs, Kg, Box, Litre, Meter
  costPrice: number; // Purchase price
  sellingPrice: number; // Selling price before tax or with tax
  mrp: number;
  gstRate: GSTSlab;
  currentStock: number;
  minStockLevel: number;
  supplierId: string;
  supplierName: string;
  description: string;
  image?: string;
  dailyVelocity?: number; // Average sales units/day
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceType?: 'INVOICE' | 'PURCHASE' | 'MANUAL' | 'RETURN';
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR' | 'CORPORATE';
export type RiskCategory = 'HIGH_VALUE' | 'REGULAR' | 'NEW' | 'INACTIVE' | 'HIGH_PAYMENT_RISK';

export interface CustomerIntelligence {
  rfmScore: number; // 1-100
  recencyDays: number;
  frequencyOrders: number;
  monetaryTotal: number;
  paymentDelayAvgDays: number;
  riskCategory: RiskCategory;
  churnProbability: number; // 0-100%
  delayProbability: number; // 0-100%
  recommendation: string;
  insights: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  gstin?: string;
  state: string;
  stateCode: string;
  address: string;
  type: CustomerType;
  creditLimit: number;
  outstandingBalance: number;
  totalPurchases: number;
  totalOrders: number;
  lastPurchaseDate?: string;
  intelligence: CustomerIntelligence;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  stateCode: string;
  address: string;
  categories: string[];
  outstandingBalance: number;
  totalPurchases: number;
  rating: number; // 1-5
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  costPrice: number;
  unitPrice: number; // Selling price
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: GSTSlab;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';
export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-00123
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerGstin?: string;
  customerState: string;
  customerStateCode: string;
  isInterState: boolean;
  items: InvoiceItem[];
  subtotal: number; // Sum of taxable
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: PaymentMode;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  notes?: string;
  createdBy: string;
  cashierName: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string; // UPI UTR or Bank ref
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstRate: GSTSlab;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  items: PurchaseItem[];
  taxableTotal: number;
  gstTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'RENT'
  | 'SALARY'
  | 'ELECTRICITY'
  | 'TRANSPORT'
  | 'MARKETING'
  | 'MAINTENANCE'
  | 'PACKAGING'
  | 'INTERNET_PHONE'
  | 'OFFICE_SUPPLIES'
  | 'OTHER';

export interface Expense {
  id: string;
  voucherNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  taxAmount: number;
  paymentMode: PaymentMode;
  paidTo: string;
  date: string;
  recordedBy: string;
  hasGst: boolean;
  gstin?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    refundAmount: number;
    reason: string;
  }[];
  totalRefundAmount: number;
  restockInventory: boolean;
  createdAt: string;
}

export type CallDisposition = 
  | 'PAYMENT_PROMISED'
  | 'ALREADY_PAID'
  | 'REQUESTED_PAYMENT_LINK'
  | 'DISPUTE_RAISED'
  | 'CALLBACK_REQUESTED'
  | 'WRONG_NUMBER'
  | 'NO_ANSWER'
  | 'CALL_FAILED';

export type CallLanguage = 'en' | 'hi' | 'mr';

export interface CallMessage {
  id: string;
  sender: 'ai' | 'customer';
  text: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
}

export interface CallRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceId: string;
  invoiceNumber: string;
  overdueAmount: number;
  overdueDays: number;
  callDate: string;
  durationSeconds: number;
  language: CallLanguage;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER';
  disposition?: CallDisposition;
  promisedDate?: string;
  summary: string;
  transcript: CallMessage[];
  paymentLinkSent: boolean;
  paymentLinkUrl?: string;
  recordingUrl?: string;
  nextFollowUpDate?: string;
}

export interface ReminderRule {
  id: string;
  name: string;
  triggerType: 'BEFORE_DUE' | 'ON_DUE' | 'AFTER_DUE';
  daysOffset: number; // e.g. -3, 0, 1, 3, 7, 15
  channels: ('whatsapp' | 'sms' | 'email' | 'voice')[];
  templateText: string;
  isActive: boolean;
}

export interface ReminderLog {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'voice';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  message: string;
  recipient: string;
  sentAt: string;
}

export interface AIInventoryPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  dailyVelocity: number;
  daysRemaining: number;
  estimatedStockoutDate: string;
  recommendedReorderQuantity: number;
  status: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL_STOCKOUT' | 'OVERSTOCKED';
  confidenceScore: number; // 0-100
}

export interface AISalesForecast {
  period: 'NEXT_7_DAYS' | 'NEXT_30_DAYS' | 'NEXT_QUARTER';
  forecastedRevenue: number;
  historicalComparisonPercent: number; // +18%
  confidenceScore: number;
  trend: 'UPWARD' | 'STABLE' | 'DOWNWARD';
  predictedDailySales: { date: string; expectedSales: number; lowerBound: number; upperBound: number }[];
  keyDrivers: string[];
}

export interface AIAnomalyAlert {
  id: string;
  type: 'EXCESSIVE_DISCOUNT' | 'DUPLICATE_INVOICE' | 'UNUSUAL_REFUND' | 'STOCK_SHRINKAGE' | 'PAYMENT_SPIKE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  referenceId?: string;
  amount?: number;
  detectedAt: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface TelephonySettings {
  provider: 'TWILIO' | 'EXOTEL' | 'PLIVO' | 'SIMULATOR';
  accountSid: string;
  authToken: string;
  callerNumber: string;
  webhookUrl: string;
  defaultLanguage: CallLanguage;
  enableAutoCall: boolean;
  maxCallAttempts: number;
  callTimingStart: string; // "09:00"
  callTimingEnd: string; // "19:00"
}
