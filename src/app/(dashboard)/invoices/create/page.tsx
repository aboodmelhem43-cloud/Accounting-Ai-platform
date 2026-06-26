"use client";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLang } from "@/components/LanguageProvider";
import { buildZatcaQr } from "@/lib/zatca";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface BusinessInfo {
  name: string;
  country: string;
  baseCurrency: string;
  taxNumber: string | null;
  address: string | null;
  phone: string | null;
}

interface CountryCompliance {
  vatRate: number;
  vatName: string;
  vatNameEn: string;
  vatShortName: string;
  currency: string;
  currencySymbol: string;
  eInvoiceSystem: string | null;
  eInvoiceNoteAr: string;
  eInvoiceNoteEn: string;
  invoiceTitleAr: string;
  invoiceTitleEn: string;
  taxIdLabel: string;
  taxIdLabelEn: string;
  showQr: boolean;
}

const COMPLIANCE: Record<string, CountryCompliance> = {
  JO: {
    vatRate: 0.16, vatName: "ضريبة المبيعات العامة", vatNameEn: "General Sales Tax",
    vatShortName: "GST", currency: "JOD", currencySymbol: "JD",
    eInvoiceSystem: "JoFotara",
    eInvoiceNoteAr: "وفقاً لنظام JoFotara، هذه الفاتورة إلزامية لكل عملية بيع بقيمة دينار أردني أو أكثر.",
    eInvoiceNoteEn: "Per JoFotara system, this invoice is mandatory for all sales of 1 JOD or more.",
    invoiceTitleAr: "فاتورة ضريبة مبيعات", invoiceTitleEn: "Sales Tax Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "Tax Number", showQr: false,
  },
  EG: {
    vatRate: 0.14, vatName: "ضريبة القيمة المضافة", vatNameEn: "Value Added Tax",
    vatShortName: "VAT", currency: "EGP", currencySymbol: "ج.م",
    eInvoiceSystem: "ETA",
    eInvoiceNoteAr: "وفقاً لمنظومة الفاتورة الإلكترونية (ETA)، يجب تقديم هذه الفاتورة إلكترونياً عبر بوابة الضرائب المصرية.",
    eInvoiceNoteEn: "Per Egypt Tax Authority (ETA) e-invoice system, this invoice must be submitted electronically.",
    invoiceTitleAr: "فاتورة ضريبية", invoiceTitleEn: "Tax Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "Tax Number", showQr: false,
  },
  SA: {
    vatRate: 0.15, vatName: "ضريبة القيمة المضافة", vatNameEn: "Value Added Tax",
    vatShortName: "VAT", currency: "SAR", currencySymbol: "ر.س",
    eInvoiceSystem: "ZATCA",
    eInvoiceNoteAr: "وفقاً لنظام فاتورة (ZATCA)، يجب إصدار هذه الفاتورة إلكترونياً وتضمين رمز QR الضريبي.",
    eInvoiceNoteEn: "Per ZATCA e-invoice mandate, this invoice must be issued electronically with a QR code.",
    invoiceTitleAr: "فاتورة ضريبية", invoiceTitleEn: "Tax Invoice",
    taxIdLabel: "الرقم الضريبي (15 رقماً)", taxIdLabelEn: "VAT Number (15 digits)", showQr: true,
  },
  AE: {
    vatRate: 0.05, vatName: "ضريبة القيمة المضافة", vatNameEn: "Value Added Tax",
    vatShortName: "VAT", currency: "AED", currencySymbol: "د.إ",
    eInvoiceSystem: null, eInvoiceNoteAr: "", eInvoiceNoteEn: "",
    invoiceTitleAr: "فاتورة ضريبية", invoiceTitleEn: "Tax Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "TRN", showQr: false,
  },
  KW: {
    vatRate: 0, vatName: "", vatNameEn: "", vatShortName: "",
    currency: "KWD", currencySymbol: "د.ك",
    eInvoiceSystem: null, eInvoiceNoteAr: "", eInvoiceNoteEn: "",
    invoiceTitleAr: "فاتورة", invoiceTitleEn: "Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "Tax Number", showQr: false,
  },
  BH: {
    vatRate: 0.10, vatName: "ضريبة القيمة المضافة", vatNameEn: "Value Added Tax",
    vatShortName: "VAT", currency: "BHD", currencySymbol: "د.ب",
    eInvoiceSystem: null, eInvoiceNoteAr: "", eInvoiceNoteEn: "",
    invoiceTitleAr: "فاتورة ضريبية", invoiceTitleEn: "Tax Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "TIN", showQr: false,
  },
  QA: {
    vatRate: 0, vatName: "", vatNameEn: "", vatShortName: "",
    currency: "QAR", currencySymbol: "ر.ق",
    eInvoiceSystem: null, eInvoiceNoteAr: "", eInvoiceNoteEn: "",
    invoiceTitleAr: "فاتورة", invoiceTitleEn: "Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "Tax Number", showQr: false,
  },
  OM: {
    vatRate: 0.05, vatName: "ضريبة القيمة المضافة", vatNameEn: "Value Added Tax",
    vatShortName: "VAT", currency: "OMR", currencySymbol: "ر.ع",
    eInvoiceSystem: null, eInvoiceNoteAr: "", eInvoiceNoteEn: "",
    invoiceTitleAr: "فاتورة ضريبية", invoiceTitleEn: "Tax Invoice",
    taxIdLabel: "الرقم الضريبي", taxIdLabelEn: "TIN", showQr: false,
  },
};

const EINVOICE_COLORS: Record<string, string> = {
  ZATCA: "bg-green-100 text-green-800 border-green-200",
  ETA: "bg-blue-100 text-blue-800 border-blue-200",
  JoFotara: "bg-purple-100 text-purple-800 border-purple-200",
};

const today = new Date().toISOString().split("T")[0];

import { useRouter } from "next/navigation";

export default function CreateInvoicePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();

  const [view, setView] = useState<"form" | "preview">("form");
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Invoice fields
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${today.replace(/-/g, "")}`);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState("");

  // Seller info (auto-filled from business, editable)
  const [sellerName, setSellerName] = useState("");
  const [sellerTaxNumber, setSellerTaxNumber] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");

  // Buyer info
  const [customerName, setCustomerName] = useState("");
  const [customerTaxNumber, setCustomerTaxNumber] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");

  const compliance = COMPLIANCE[business?.country ?? ""] ?? COMPLIANCE["EG"];

  // Load business info on mount
  useEffect(() => {
    fetch("/api/settings/business-info")
      .then((r) => r.json())
      .then((data: BusinessInfo) => {
        setBusiness(data);
        setSellerName(data.name ?? "");
        setSellerTaxNumber(data.taxNumber ?? "");
        setSellerAddress(data.address ?? "");
        const c = COMPLIANCE[data.country ?? ""] ?? COMPLIANCE["EG"];
        setTaxRate(Math.round(c.vatRate * 100));
      })
      .catch(() => {});
  }, []);

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const fmt = (n: number) =>
    n.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currencyDisplay = compliance.currencySymbol;

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  const buildZatcaQrData = () =>
    buildZatcaQr(sellerName, sellerTaxNumber, invoiceDate, grandTotal, taxAmount);

  async function saveInvoice() {
    if (saving || saved) return;
    setSaving(true);
    try {
      const res = await fetch("/api/invoices/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber, invoiceDate, dueDate,
          sellerName, sellerTaxNumber, sellerAddress,
          customerName, customerTaxNumber, customerAddress, customerPhone, customerEmail,
          lineItems,
          subtotal, taxRate, taxAmount, grandTotal,
          currency: compliance.currency,
          currencySymbol: compliance.currencySymbol,
          notes,
          country: business?.country ?? "",
          eInvoiceSystem: compliance.eInvoiceSystem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        setTimeout(() => router.push("/invoices"), 1200);
      } else {
        const err = await res.json();
        alert(err.message ?? (isAr ? "فشل الحفظ" : "Save failed"));
      }
    } finally {
      setSaving(false);
    }
  }

  if (view === "preview") {
    const qrData = compliance.showQr && sellerTaxNumber ? buildZatcaQrData() : null;
    return (
      <div className="space-y-4">
        <div className="flex gap-3 print:hidden">
          <button onClick={() => setView("form")} className="btn-secondary">
            {isAr ? "← رجوع" : "← Back"}
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            🖨️ {isAr ? "طباعة / PDF" : "Print / PDF"}
          </button>
          <button
            onClick={saveInvoice}
            disabled={saving || saved}
            className="btn-primary"
          >
            {saved
              ? (isAr ? "✅ تم الحفظ!" : "✅ Saved!")
              : saving
                ? (isAr ? "جاري الحفظ..." : "Saving...")
                : (isAr ? "💾 حفظ الفاتورة" : "💾 Save Invoice")}
          </button>
        </div>

        {/* Printable invoice */}
        <div id="invoice-print" className="bg-white border border-gray-200 rounded-xl p-8 max-w-3xl mx-auto print:border-0 print:rounded-none print:p-6">

          {/* E-invoice badge */}
          {compliance.eInvoiceSystem && (
            <div className={`flex items-center justify-between mb-6 px-3 py-2 rounded-lg border text-xs font-medium ${EINVOICE_COLORS[compliance.eInvoiceSystem] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
              <span>⚡ {compliance.eInvoiceSystem} — {isAr ? "فاتورة إلكترونية" : "E-Invoice"}</span>
              <span className="text-xs opacity-70">{isAr ? compliance.eInvoiceNoteAr : compliance.eInvoiceNoteEn}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {compliance.invoiceTitleAr}
              </h1>
              <p className="text-gray-500 font-medium mt-0.5">{compliance.invoiceTitleEn}</p>
              <p className="text-gray-400 text-sm mt-1">#{invoiceNumber}</p>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">{isAr ? "التاريخ:" : "Date:"}</span> {invoiceDate}</p>
              {dueDate && <p><span className="font-medium">{isAr ? "الاستحقاق:" : "Due:"}</span> {dueDate}</p>}
            </div>
          </div>

          {/* Seller & Buyer info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {isAr ? "المورد / البائع" : "Seller / Supplier"}
              </p>
              <p className="font-bold text-gray-900 text-base">{sellerName || "—"}</p>
              {sellerTaxNumber && (
                <p className="text-gray-600 text-sm mt-1">
                  {isAr ? compliance.taxIdLabel : compliance.taxIdLabelEn}: {sellerTaxNumber}
                </p>
              )}
              {sellerAddress && <p className="text-gray-500 text-sm mt-0.5">{sellerAddress}</p>}
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {isAr ? "العميل / المشتري" : "Customer / Buyer"}
              </p>
              <p className="font-bold text-gray-900 text-base">{customerName || "—"}</p>
              {customerTaxNumber && (
                <p className="text-gray-600 text-sm mt-1">
                  {isAr ? compliance.taxIdLabel : compliance.taxIdLabelEn}: {customerTaxNumber}
                </p>
              )}
              {customerAddress && <p className="text-gray-500 text-sm mt-0.5">{customerAddress}</p>}
              {customerPhone && <p className="text-gray-500 text-sm">{customerPhone}</p>}
              {customerEmail && <p className="text-gray-500 text-sm">{customerEmail}</p>}
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2 font-semibold text-gray-700 w-5/12">
                  {isAr ? "الوصف / Description" : "Description"}
                </th>
                <th className="text-right py-2 font-semibold text-gray-700 w-2/12">
                  {isAr ? "الكمية" : "Qty"}
                </th>
                <th className="text-right py-2 font-semibold text-gray-700 w-2/12">
                  {isAr ? "سعر الوحدة" : "Unit Price"}
                </th>
                <th className="text-right py-2 font-semibold text-gray-700 w-3/12">
                  {isAr ? "الإجمالي" : "Total"}
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-800">{item.description || "—"}</td>
                  <td className="py-2 text-right font-mono text-gray-600">{item.quantity}</td>
                  <td className="py-2 text-right font-mono text-gray-600">
                    {fmt(item.unitPrice)} {currencyDisplay}
                  </td>
                  <td className="py-2 text-right font-mono text-gray-800 font-medium">
                    {fmt(item.quantity * item.unitPrice)} {currencyDisplay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals + QR */}
          <div className="flex justify-between items-end">
            {/* QR code for Saudi Arabia */}
            {qrData ? (
              <div className="text-center">
                <div className="w-28 h-28 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white p-1.5">
                  <QRCodeSVG value={qrData} size={100} level="M" />
                </div>
                <p className="text-xs text-gray-400 mt-1">ZATCA QR Code</p>
              </div>
            ) : <div />}

            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{isAr ? "المجموع قبل الضريبة" : "Subtotal"}</span>
                <span className="font-mono">{fmt(subtotal)} {currencyDisplay}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>
                    {isAr ? compliance.vatName : compliance.vatNameEn} ({taxRate}%)
                  </span>
                  <span className="font-mono">{fmt(taxAmount)} {currencyDisplay}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-800 pt-2 font-bold text-base text-gray-900">
                <span>{isAr ? "الإجمالي شامل الضريبة" : "Total incl. Tax"}</span>
                <span className="font-mono">{fmt(grandTotal)} {currencyDisplay}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {isAr ? "ملاحظات" : "Notes"}
              </p>
              <p className="text-gray-600 text-sm">{notes}</p>
            </div>
          )}

          {/* Footer notice */}
          {compliance.eInvoiceSystem && (
            <div className="mt-6 pt-4 border-t border-dashed border-gray-200 text-xs text-gray-400 text-center">
              {isAr ? compliance.eInvoiceNoteAr : compliance.eInvoiceNoteEn}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Form view ──
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "إنشاء فاتورة" : "Create Invoice"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "أدخل تفاصيل الفاتورة ثم اطبعها أو احفظها كـ PDF"
            : "Enter invoice details then print or save as PDF"}
        </p>
      </div>

      {/* E-invoice notice */}
      {compliance.eInvoiceSystem && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${EINVOICE_COLORS[compliance.eInvoiceSystem] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
          <span className="text-lg mt-0.5">⚡</span>
          <div>
            <p className="font-semibold">{compliance.eInvoiceSystem} — {isAr ? "فاتورة إلكترونية إلزامية" : "E-Invoice Required"}</p>
            <p className="text-xs mt-0.5 opacity-80">{isAr ? compliance.eInvoiceNoteAr : compliance.eInvoiceNoteEn}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoice info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{isAr ? "معلومات الفاتورة" : "Invoice Info"}</h2>
          <div>
            <label className="label">{isAr ? "رقم الفاتورة" : "Invoice Number"}</label>
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{isAr ? "تاريخ الفاتورة" : "Invoice Date"}</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{isAr ? "تاريخ الاستحقاق (اختياري)" : "Due Date (optional)"}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">
              {isAr
                ? `نسبة الضريبة — ${compliance.vatName || "لا ضريبة"} (${taxRate}%)`
                : `Tax Rate — ${compliance.vatNameEn || "No Tax"} (${taxRate}%)`}
            </label>
            <input
              type="number" min="0" max="100" step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </div>
        </div>

        {/* Seller info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{isAr ? "بيانات البائع (منشأتك)" : "Seller Info (Your Business)"}</h2>
          <div>
            <label className="label">{isAr ? "اسم المنشأة" : "Business Name"}</label>
            <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} className="input" />
          </div>
          {compliance.eInvoiceSystem && (
            <div>
              <label className="label">
                {isAr ? compliance.taxIdLabel : compliance.taxIdLabelEn}
              </label>
              <input
                type="text" value={sellerTaxNumber}
                onChange={(e) => setSellerTaxNumber(e.target.value)}
                placeholder={isAr ? "الرقم الضريبي للمنشأة" : "Your business tax/VAT number"}
                className="input"
              />
            </div>
          )}
          <div>
            <label className="label">{isAr ? "العنوان" : "Address"}</label>
            <input
              type="text" value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder={isAr ? "عنوان المنشأة (اختياري)" : "Business address (optional)"}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Buyer info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">{isAr ? "بيانات العميل / المشتري" : "Customer / Buyer Details"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{isAr ? "اسم العميل / الشركة" : "Customer / Company Name"}</label>
            <input
              type="text" value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={isAr ? "اسم العميل أو الشركة" : "Customer or company name"}
              className="input"
            />
          </div>
          {compliance.eInvoiceSystem && (
            <div>
              <label className="label">
                {isAr ? `${compliance.taxIdLabel} (للعميل — B2B)` : `${compliance.taxIdLabelEn} (Buyer — B2B)`}
              </label>
              <input
                type="text" value={customerTaxNumber}
                onChange={(e) => setCustomerTaxNumber(e.target.value)}
                placeholder={isAr ? "الرقم الضريبي للعميل (مطلوب B2B)" : "Buyer tax number (required B2B)"}
                className="input"
              />
            </div>
          )}
          <div>
            <label className="label">{isAr ? "العنوان" : "Address"}</label>
            <input
              type="text" value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder={isAr ? "العنوان (اختياري)" : "Address (optional)"}
              className="input"
            />
          </div>
          <div>
            <label className="label">{isAr ? "رقم الهاتف" : "Phone"}</label>
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={isAr ? "اختياري" : "Optional"} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{isAr ? "البريد الإلكتروني" : "Email"}</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder={isAr ? "اختياري" : "Optional"} className="input" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{isAr ? "بنود الفاتورة" : "Line Items"}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-5/12">{isAr ? "الوصف" : "Description"}</th>
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">{isAr ? "الكمية" : "Qty"}</th>
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">{isAr ? "السعر" : "Unit Price"}</th>
                <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">{isAr ? "الإجمالي" : "Total"}</th>
                <th className="pb-2 w-1/12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lineItems.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 pe-2">
                    <input type="text" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder={isAr ? "وصف البند..." : "Item description..."} className="input text-sm" />
                  </td>
                  <td className="py-2 pe-2">
                    <input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)} className="input text-sm font-mono" />
                  </td>
                  <td className="py-2 pe-2">
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)} placeholder="0.00" className="input text-sm font-mono" />
                  </td>
                  <td className="py-2 pe-2 text-right font-mono text-sm text-gray-700">
                    {fmt(item.quantity * item.unitPrice)} {currencyDisplay}
                  </td>
                  <td className="py-2">
                    <button type="button" onClick={() => setLineItems((p) => p.filter((_, j) => j !== i))} disabled={lineItems.length <= 1} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setLineItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }])} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
          + {isAr ? "إضافة بند" : "Add Item"}
        </button>

        {/* Totals summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{isAr ? "المجموع قبل الضريبة" : "Subtotal"}</span>
              <span className="font-mono">{fmt(subtotal)} {currencyDisplay}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{isAr ? compliance.vatName : compliance.vatNameEn} ({taxRate}%)</span>
                <span className="font-mono">{fmt(taxAmount)} {currencyDisplay}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-2">
              <span>{isAr ? "الإجمالي" : "Grand Total"}</span>
              <span className="font-mono">{fmt(grandTotal)} {currencyDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <label className="label">{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={isAr ? "شروط الدفع، تعليمات خاصة..." : "Payment terms, special instructions..."} className="input resize-none" />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setView("preview")} className="btn-primary">
          👁️ {isAr ? "معاينة وطباعة" : "Preview & Print"}
        </button>
      </div>
    </div>
  );
}
