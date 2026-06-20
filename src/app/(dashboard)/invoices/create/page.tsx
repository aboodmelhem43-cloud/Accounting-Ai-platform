"use client";
import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

type View = "form" | "preview";

const today = new Date().toISOString().split("T")[0];
const defaultInvoiceNumber = `INV-${today.replace(/-/g, "")}`;

export default function CreateInvoicePage() {
  const { lang } = useLang();

  const [view, setView] = useState<View>("form");

  // حقول الفاتورة
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");

  // حساب الإجماليات
  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const fmt = (n: number) =>
    n.toLocaleString(lang === "ar" ? "ar" : "en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  if (view === "preview") {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 print:hidden">
          <button
            onClick={() => setView("form")}
            className="btn-secondary"
          >
            {lang === "ar" ? "← رجوع" : "← Back"}
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary"
          >
            🖨️ {lang === "ar" ? "طباعة / PDF" : "Print PDF"}
          </button>
        </div>

        {/* الفاتورة القابلة للطباعة */}
        <div
          id="invoice-print"
          className="bg-white border border-gray-200 rounded-xl p-8 max-w-3xl mx-auto"
          dir="ltr"
        >
          {/* الرأس */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">INVOICE / فاتورة</h1>
              <p className="text-gray-500 mt-1">#{invoiceNumber}</p>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Date:</span> {invoiceDate}</p>
              {dueDate && <p><span className="font-medium">Due:</span> {dueDate}</p>}
            </div>
          </div>

          {/* بيانات العميل */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Bill To / فاتورة إلى
            </h2>
            <p className="font-semibold text-gray-800 text-lg">{customerName || "—"}</p>
            {customerAddress && <p className="text-gray-600 text-sm mt-0.5">{customerAddress}</p>}
            {customerPhone && <p className="text-gray-600 text-sm">{customerPhone}</p>}
            {customerEmail && <p className="text-gray-600 text-sm">{customerEmail}</p>}
          </div>

          {/* جدول البنود */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2 font-semibold text-gray-700 w-5/12">
                  Description
                </th>
                <th className="text-right py-2 font-semibold text-gray-700 w-2/12">Qty</th>
                <th className="text-right py-2 font-semibold text-gray-700 w-2/12">Unit Price</th>
                <th className="text-right py-2 font-semibold text-gray-700 w-3/12">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-800">{item.description || "—"}</td>
                  <td className="py-2 text-right font-mono text-gray-600">{item.quantity}</td>
                  <td className="py-2 text-right font-mono text-gray-600">{fmt(item.unitPrice)}</td>
                  <td className="py-2 text-right font-mono text-gray-800 font-medium">
                    {fmt(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* الإجماليات */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal / المجموع</span>
                <span className="font-mono">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax {taxRate}% / ضريبة</span>
                <span className="font-mono">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-2 font-bold text-base">
                <span>Total / الإجمالي</span>
                <span className="font-mono">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          {notes && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Notes / ملاحظات
              </p>
              <p className="text-gray-600 text-sm">{notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // عرض النموذج
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {lang === "ar" ? "إنشاء فاتورة" : "Create Invoice"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar" ? "أدخل تفاصيل الفاتورة ثم اطبعها أو احفظها كـ PDF" : "Enter invoice details then print or save as PDF"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* معلومات الفاتورة */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">
            {lang === "ar" ? "معلومات الفاتورة" : "Invoice Info"}
          </h2>
          <div>
            <label className="label">{lang === "ar" ? "رقم الفاتورة" : "Invoice Number"}</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "تاريخ الفاتورة" : "Invoice Date"}</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "تاريخ الاستحقاق (اختياري)" : "Due Date (optional)"}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "نسبة الضريبة (%)" : "Tax Rate (%)"}</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </div>
        </div>

        {/* معلومات العميل */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">
            {lang === "ar" ? "بيانات العميل" : "Customer Details"}
          </h2>
          <div>
            <label className="label">{lang === "ar" ? "اسم العميل" : "Customer Name"}</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={lang === "ar" ? "اسم العميل أو الشركة" : "Customer or company name"}
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "العنوان" : "Address"}</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder={lang === "ar" ? "العنوان (اختياري)" : "Address (optional)"}
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "رقم الهاتف" : "Phone"}</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder={lang === "ar" ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* بنود الفاتورة */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">
          {lang === "ar" ? "بنود الفاتورة" : "Line Items"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-5/12">
                  {lang === "ar" ? "الوصف" : "Description"}
                </th>
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                  {lang === "ar" ? "الكمية" : "Qty"}
                </th>
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                  {lang === "ar" ? "سعر الوحدة" : "Unit Price"}
                </th>
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                  {lang === "ar" ? "الإجمالي" : "Total"}
                </th>
                <th className="pb-2 w-1/12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lineItems.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 pe-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      placeholder={lang === "ar" ? "وصف البند..." : "Item description..."}
                      className="input text-sm"
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)}
                      className="input text-sm font-mono"
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="input text-sm font-mono"
                    />
                  </td>
                  <td className="py-2 pe-2 text-right font-mono text-sm text-gray-700">
                    {fmt(item.quantity * item.unitPrice)}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeLineItem(i)}
                      disabled={lineItems.length <= 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + {lang === "ar" ? "إضافة بند" : "Add Item"}
        </button>

        {/* إجماليات مباشرة */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{lang === "ar" ? "المجموع قبل الضريبة" : "Subtotal"}</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{lang === "ar" ? `ضريبة ${taxRate}%` : `Tax ${taxRate}%`}</span>
              <span className="font-mono">{fmt(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-2">
              <span>{lang === "ar" ? "الإجمالي" : "Grand Total"}</span>
              <span className="font-mono">{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ملاحظات */}
      <div className="card">
        <label className="label">{lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={lang === "ar" ? "شروط الدفع، تعليمات خاصة..." : "Payment terms, special instructions..."}
          className="input resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setView("preview")}
          className="btn-primary"
        >
          👁️ {lang === "ar" ? "معاينة وطباعة" : "Preview & Print"}
        </button>
      </div>
    </div>
  );
}
