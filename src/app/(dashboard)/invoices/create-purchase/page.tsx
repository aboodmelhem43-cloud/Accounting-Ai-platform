"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { useSession } from "next-auth/react";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
}

export default function CreatePurchaseInvoicePage() {
  const router = useRouter();
  const { lang } = useLang();
  const { data: session } = useSession();
  const isAr = lang === "ar";

  const today = new Date().toISOString().split("T")[0];

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierTaxNumber, setSupplierTaxNumber] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(15);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = session?.user?.currency ?? "SAR";

  // Load expense accounts for the debit side of the journal entry
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: Account[]) => {
        const expenses = (data ?? []).filter((a) => a.type === "EXPENSE");
        setExpenseAccounts(expenses);
        if (expenses.length > 0) setSelectedExpenseAccountId(expenses[0].id);
      })
      .catch(() => {});
  }, []);

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const updateLine = useCallback((index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((li, i) => i === index ? { ...li, [field]: value } : li));
  }, []);

  function addLine() {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeLine(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const fmt = (n: number) => n.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleSave(asDraft = false) {
    if (!supplierName.trim()) {
      setError(isAr ? "اسم المورّد مطلوب" : "Supplier name is required");
      return;
    }
    if (!invoiceNumber.trim()) {
      setError(isAr ? "رقم الفاتورة مطلوب" : "Invoice number is required");
      return;
    }
    if (lineItems.every((li) => !li.description.trim())) {
      setError(isAr ? "أضف بنداً واحداً على الأقل" : "Add at least one line item");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices/save-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          invoiceDate,
          dueDate: dueDate || null,
          supplierName,
          supplierTaxNumber: supplierTaxNumber || null,
          supplierAddress: supplierAddress || null,
          lineItems: lineItems.filter((li) => li.description.trim()),
          subtotal,
          taxRate,
          taxAmount,
          grandTotal,
          currency,
          notes: notes || null,
          expenseAccountId: selectedExpenseAccountId || null,
          status: asDraft ? "DRAFT" : "CONFIRMED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isAr ? "حدث خطأ" : "An error occurred"));
        return;
      }
      router.push(`/invoices/${data.invoiceId}/view`);
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {isAr ? "فاتورة شراء" : "Purchase Invoice"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "إنشاء فاتورة شراء" : "Create Purchase Invoice"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAr ? "فاتورة واردة من مورّد — تُقيَّد في الذمم الدائنة" : "Inbound invoice from a supplier — posted to Accounts Payable"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-secondary">
            {isAr ? "حفظ مسودة" : "Save Draft"}
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary">
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "💾 تأكيد وحفظ" : "💾 Save & Confirm")}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Invoice meta */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">{isAr ? "تفاصيل الفاتورة" : "Invoice Details"}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{isAr ? "رقم فاتورة المورّد" : "Supplier Invoice #"}</label>
              <input className="input font-mono" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g. SI-2026-001" />
            </div>
            <div>
              <label className="label">{isAr ? "تاريخ الفاتورة" : "Invoice Date"}</label>
              <input type="date" className="input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{isAr ? "تاريخ الاستحقاق" : "Due Date"}</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="label">{isAr ? "نسبة الضريبة %" : "Tax Rate %"}</label>
              <input type="number" className="input" value={taxRate} min={0} max={100} onChange={(e) => setTaxRate(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="label">{isAr ? "حساب المصروف (يُدان)" : "Expense Account (debit)"}</label>
            <select className="input" value={selectedExpenseAccountId} onChange={(e) => setSelectedExpenseAccountId(e.target.value)}>
              <option value="">{isAr ? "— اختر حساب —" : "— Select account —"}</option>
              {expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {isAr && acc.nameAr ? acc.nameAr : acc.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {isAr ? "القيد: مدين حساب المصروف + ضريبة مدخلات، دائن ذمم دائنة" : "Entry: Dr Expense + VAT Input, Cr Accounts Payable"}
            </p>
          </div>
        </div>

        {/* Supplier info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">{isAr ? "بيانات المورّد" : "Supplier Information"}</h2>
          <div>
            <label className="label">{isAr ? "اسم المورّد *" : "Supplier Name *"}</label>
            <input className="input" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder={isAr ? "اسم الشركة أو الفرد" : "Company or individual name"} />
          </div>
          <div>
            <label className="label">{isAr ? "الرقم الضريبي" : "Tax Number (VAT)"}</label>
            <input className="input font-mono" value={supplierTaxNumber} onChange={(e) => setSupplierTaxNumber(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="label">{isAr ? "العنوان" : "Address"}</label>
            <input className="input" value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="label">{isAr ? "ملاحظات" : "Notes"}</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: "vertical" }} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">{isAr ? "بنود الفاتورة" : "Line Items"}</h2>
          <button onClick={addLine} className="btn-secondary text-xs py-1 px-3">
            + {isAr ? "إضافة بند" : "Add Item"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "الوصف" : "Description"}</th>
                <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs w-24">{isAr ? "الكمية" : "Qty"}</th>
                <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs w-36">{isAr ? "سعر الوحدة" : "Unit Price"}</th>
                <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs w-32">{isAr ? "الإجمالي" : "Total"}</th>
                <th className="w-8 py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={idx} className="border-t border-gray-50">
                  <td className="py-2 px-4">
                    <input
                      className="w-full border-none outline-none bg-transparent text-gray-800 placeholder:text-gray-300"
                      value={li.description}
                      onChange={(e) => updateLine(idx, "description", e.target.value)}
                      placeholder={isAr ? "وصف المنتج أو الخدمة" : "Product or service description"}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      className="w-full border-none outline-none bg-transparent text-end tabular-nums text-gray-800"
                      value={li.quantity}
                      min={0}
                      onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      className="w-full border-none outline-none bg-transparent text-end tabular-nums text-gray-800"
                      value={li.unitPrice}
                      min={0}
                      step={0.01}
                      onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 px-4 text-end tabular-nums text-gray-700 font-medium">
                    {fmt(li.quantity * li.unitPrice)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLine(idx)} className="text-gray-300 hover:text-red-400 text-base leading-none">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-1.5 flex flex-col items-end">
          <div className="flex gap-12 text-sm">
            <span className="text-gray-500">{isAr ? "المجموع قبل الضريبة" : "Subtotal"}</span>
            <span className="tabular-nums text-gray-700 min-w-[100px] text-end">{currency} {fmt(subtotal)}</span>
          </div>
          <div className="flex gap-12 text-sm">
            <span className="text-gray-500">{isAr ? `ضريبة ${taxRate}%` : `VAT ${taxRate}%`}</span>
            <span className="tabular-nums text-gray-700 min-w-[100px] text-end">{currency} {fmt(taxAmount)}</span>
          </div>
          <div className="flex gap-12 text-sm border-t border-gray-200 pt-2 mt-1 font-bold">
            <span className="text-gray-800">{isAr ? "الإجمالي الكلي" : "Grand Total"}</span>
            <span className="tabular-nums text-gray-900 min-w-[100px] text-end text-base">{currency} {fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Journal preview */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">{isAr ? "معاينة القيد المحاسبي" : "Journal Entry Preview"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isAr ? "سيُنشأ تلقائياً عند الحفظ" : "Will be posted automatically on save"}</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
            {isAr ? "متوازن ✓" : "Balanced ✓"}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "الحساب" : "Account"}</th>
              <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "البيان" : "Description"}</th>
              <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "مدين" : "Debit"}</th>
              <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "دائن" : "Credit"}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-50">
              <td className="py-2 px-4 text-gray-500 text-xs">
                {isAr ? "حساب المصروف المختار" : "Selected Expense Account"}
              </td>
              <td className="py-2 px-4 text-gray-500 text-xs">{supplierName || (isAr ? "المورّد" : "Supplier")}</td>
              <td className="py-2 px-4 text-end tabular-nums text-green-700 font-medium">{currency} {fmt(subtotal)}</td>
              <td className="py-2 px-4 text-end text-gray-300">—</td>
            </tr>
            {taxAmount > 0 && (
              <tr className="border-t border-gray-50">
                <td className="py-2 px-4 text-gray-500 text-xs">{isAr ? "ضريبة مدخلات (VAT مستحق)" : "VAT Input (Recoverable)"}</td>
                <td className="py-2 px-4 text-gray-500 text-xs">{isAr ? `ضريبة ${taxRate}%` : `VAT ${taxRate}%`}</td>
                <td className="py-2 px-4 text-end tabular-nums text-green-700 font-medium">{currency} {fmt(taxAmount)}</td>
                <td className="py-2 px-4 text-end text-gray-300">—</td>
              </tr>
            )}
            <tr className="border-t border-gray-50">
              <td className="py-2 px-4 text-gray-500 text-xs">{isAr ? "ذمم دائنة — الموردون" : "Accounts Payable"}</td>
              <td className="py-2 px-4 text-gray-500 text-xs">{supplierName || (isAr ? "المورّد" : "Supplier")}</td>
              <td className="py-2 px-4 text-end text-gray-300">—</td>
              <td className="py-2 px-4 text-end tabular-nums text-blue-700 font-medium">{currency} {fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
