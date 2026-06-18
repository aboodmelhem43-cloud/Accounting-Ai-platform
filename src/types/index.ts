import type { Account, AccountType, InvoiceStatus, InvoiceType, JournalSourceType, UserRole } from "@prisma/client";

// بيانات الفاتورة المستخرجة بالذكاء الاصطناعي
export interface ExtractedInvoiceData {
  vendorName: string | null;
  vendorTaxId: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;       // ISO date string
  dueDate: string | null;
  currency: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  taxRate: number | null;           // e.g. 0.15
  totalAmount: number | null;
  lineItems: InvoiceLineItem[];
  invoiceType: "purchase" | "sales" | null;
  notes: string | null;
  confidence: number;               // 0–1 — مدى ثقة النموذج في الاستخراج
}

export interface InvoiceLineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  taxRate: number | null;
}

// اقتراح قيد محاسبي من الذكاء الاصطناعي
export interface SuggestedJournalEntry {
  description: string;
  date: string;
  lines: SuggestedJournalLine[];
}

export interface SuggestedJournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

// ملخص قائمة الدخل
export interface IncomeStatement {
  period: { from: string; to: string };
  revenue: AccountBalance[];
  expenses: AccountBalance[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  currency: string;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr: string | null;
  balance: number;
  type: AccountType;
}

// إعادة تصدير أنواع Prisma المستخدمة في الواجهة
export type { Account, AccountType, InvoiceStatus, InvoiceType, JournalSourceType, UserRole };
