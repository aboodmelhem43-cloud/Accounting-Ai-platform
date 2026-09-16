// Shared types mirrored from src/types/index.ts in the web platform

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type InvoiceStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'POSTED';
export type InvoiceType = 'PURCHASE' | 'SALES';
export type JournalEntryStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'POSTED';
export type JournalSourceType = 'MANUAL' | 'AI_INVOICE' | 'AI_SALES' | 'RECURRING';
export type UserRole = 'OWNER' | 'ACCOUNTANT';
export type Plan = 'FREE_TRIAL' | 'STARTER' | 'PRO' | 'BUSINESS';

export interface MobileSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  businessId: string;
  businessName: string;
  country: string;
  currency: string;
  role: UserRole;
  plan?: Plan;
  trialEndsAt?: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface ExtractedInvoiceData {
  vendorName?: string;
  vendorTaxNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  currency?: string;
  lineItems: InvoiceLineItem[];
}

export interface SuggestedJournalLine {
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface SuggestedJournalEntry {
  description: string;
  lines: SuggestedJournalLine[];
  totalDebits: number;
  totalCredits: number;
}

export interface DashboardStats {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  pendingInvoices: number;
  pendingJournalEntries: number;
  currency: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string | null;
  vendorName: string | null;
  total: number | null;
  currency: string;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  invoiceDate: string | null;
  createdAt: string;
  extractedData?: Record<string, any> | null;
  suggestedEntry?: {
    lines: Array<{ accountName: string; accountCode: string; debit: number; credit: number }>;
  } | null;
}

export interface JournalEntryListItem {
  id: string;
  description: string;
  reference?: string | null;
  entryDate?: string | null;
  status: JournalEntryStatus;
  sourceType: JournalSourceType;
  totalDebits: number;
  currency: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
