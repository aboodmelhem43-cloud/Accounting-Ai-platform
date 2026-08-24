"use client";
import { useState, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";

type Tab = "contacts" | "journal";

// ─── Contacts tab ─────────────────────────────────────────────────────────────

interface ContactPreview {
  name: string;
  type: "CUSTOMER" | "VENDOR";
  email: string;
  phone: string;
  taxNumber: string;
}

interface ContactPreviewResult {
  preview: ContactPreview[];
  total: number;
}

interface ContactImportResult {
  imported: number;
  skipped: number;
  total: number;
}

function ContactsImport({ isAr }: { isAr: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ContactPreviewResult | null>(null);
  const [result, setResult] = useState<ContactImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "preview");
      const res = await fetch("/api/import/contacts", { method: "POST", body: fd });
      const data = await res.json() as ContactPreviewResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "import");
      const res = await fetch("/api/import/contacts", { method: "POST", body: fd });
      const data = await res.json() as ContactImportResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      setResult(data);
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-1">
          {isAr ? "استيراد جهات الاتصال من CSV" : "Import Contacts from CSV"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {isAr
            ? "يدعم النظام تلقائياً أعمدة: Name، Type (Customer/Vendor)، Email، Phone، Address، Tax Number"
            : "Auto-detects columns: Name, Type (Customer/Vendor), Email, Phone, Address, Tax Number"}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            {isAr ? "مثال على تنسيق CSV:" : "Example CSV format:"}
          </p>
          <code className="text-xs text-gray-700 font-mono block whitespace-pre">
{`Name,Type,Email,Phone,Tax Number
Acme Corp,Customer,info@acme.com,+966501234567,310000000
Al-Noor Supplies,Vendor,,+9661234567,`}
          </code>
        </div>

        <form onSubmit={handlePreview} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">{isAr ? "ملف CSV" : "CSV File"}</label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setResult(null); }}
              className="input"
            />
          </div>
          <button type="submit" disabled={!file || loading} className="btn-primary whitespace-nowrap">
            {loading ? "..." : (isAr ? "معاينة" : "Preview")}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          <p className="font-semibold mb-1">
            {isAr ? "✓ اكتمل الاستيراد" : "✓ Import complete"}
          </p>
          <ul className="space-y-0.5 text-xs">
            <li>{isAr ? `تم استيراد: ${result.imported}` : `Imported: ${result.imported}`}</li>
            {result.skipped > 0 && (
              <li className="text-amber-700">
                {isAr ? `تم تخطي (مكرر): ${result.skipped}` : `Skipped (duplicate): ${result.skipped}`}
              </li>
            )}
          </ul>
        </div>
      )}

      {preview && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                {isAr ? "معاينة الاستيراد" : "Import Preview"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAr
                  ? `${preview.total} سجل سيتم استيراده${preview.total > 10 ? ` · يعرض أول 10` : ""}`
                  : `${preview.total} record${preview.total !== 1 ? "s" : ""} to import${preview.total > 10 ? " · showing first 10" : ""}`}
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "..." : (isAr ? `استيراد ${preview.total}` : `Import ${preview.total}`)}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start px-3 py-2 font-medium text-gray-600">{isAr ? "الاسم" : "Name"}</th>
                  <th className="text-start px-3 py-2 font-medium text-gray-600">{isAr ? "النوع" : "Type"}</th>
                  <th className="text-start px-3 py-2 font-medium text-gray-600">{isAr ? "البريد" : "Email"}</th>
                  <th className="text-start px-3 py-2 font-medium text-gray-600">{isAr ? "الهاتف" : "Phone"}</th>
                  <th className="text-start px-3 py-2 font-medium text-gray-600">{isAr ? "الرقم الضريبي" : "Tax No."}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.preview.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-800 font-medium">{c.name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
                        c.type === "CUSTOMER"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {c.type === "CUSTOMER" ? (isAr ? "عميل" : "Customer") : (isAr ? "مورد" : "Vendor")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{c.email || "—"}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{c.phone || "—"}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{c.taxNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Journal Entries tab ──────────────────────────────────────────────────────

interface JEPreviewLine {
  accountCode: string;
  debit: number;
  credit: number;
}

interface JEPreviewEntry {
  date: string;
  description: string;
  lines: JEPreviewLine[];
  balanced: boolean;
  totalDebit: number;
  totalCredit: number;
}

interface JEPreviewResult {
  preview: JEPreviewEntry[];
  total: number;
  balancedCount: number;
  unbalancedCount: number;
}

interface JEImportResult {
  imported: number;
  skipped: number;
  unbalancedSkipped: number;
  total: number;
}

function JournalImport({ isAr }: { isAr: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<JEPreviewResult | null>(null);
  const [result, setResult] = useState<JEImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "preview");
      const res = await fetch("/api/import/journal-entries", { method: "POST", body: fd });
      const data = await res.json() as JEPreviewResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "import");
      const res = await fetch("/api/import/journal-entries", { method: "POST", body: fd });
      const data = await res.json() as JEImportResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      setResult(data);
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-1">
          {isAr ? "استيراد قيود اليومية من CSV" : "Import Journal Entries from CSV"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {isAr
            ? "كل صف يمثل سطراً في القيد. صفوف بنفس التاريخ والبيان تُجمَّع في قيد واحد. يجب أن يكون كل قيد متوازناً (مدين = دائن)."
            : "Each row is one journal line. Rows with the same Date + Description are grouped into one entry. Each entry must balance (Debit = Credit)."}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            {isAr ? "مثال على تنسيق CSV:" : "Example CSV format:"}
          </p>
          <code className="text-xs text-gray-700 font-mono block whitespace-pre">
{`Date,Description,Account Code,Debit,Credit
2024-01-15,Sales invoice #001,1100,5000,0
2024-01-15,Sales invoice #001,4100,0,5000
2024-01-16,Rent expense,5200,1500,0
2024-01-16,Rent expense,1100,0,1500`}
          </code>
        </div>

        <form onSubmit={handlePreview} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">{isAr ? "ملف CSV" : "CSV File"}</label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setResult(null); }}
              className="input"
            />
          </div>
          <button type="submit" disabled={!file || loading} className="btn-primary whitespace-nowrap">
            {loading ? "..." : (isAr ? "معاينة" : "Preview")}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          <p className="font-semibold mb-1">
            {isAr ? "✓ اكتمل الاستيراد" : "✓ Import complete"}
          </p>
          <ul className="space-y-0.5 text-xs">
            <li>{isAr ? `تم استيراد: ${result.imported} قيد` : `Imported: ${result.imported} entries`}</li>
            {result.unbalancedSkipped > 0 && (
              <li className="text-red-700">
                {isAr
                  ? `تم تخطي (غير متوازن): ${result.unbalancedSkipped}`
                  : `Skipped (unbalanced): ${result.unbalancedSkipped}`}
              </li>
            )}
            {result.skipped > 0 && (
              <li className="text-amber-700">
                {isAr
                  ? `تم تخطي (رمز حساب غير موجود): ${result.skipped}`
                  : `Skipped (account code not found): ${result.skipped}`}
              </li>
            )}
          </ul>
        </div>
      )}

      {preview && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-gray-800">
                {isAr ? "معاينة القيود" : "Entry Preview"}
              </h3>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-green-700 font-medium">
                  ✓ {preview.balancedCount} {isAr ? "متوازن" : "balanced"}
                </span>
                {preview.unbalancedCount > 0 && (
                  <span className="text-red-600 font-medium">
                    ✗ {preview.unbalancedCount} {isAr ? "غير متوازن — سيتم تخطيه" : "unbalanced — will be skipped"}
                  </span>
                )}
                {preview.total > 10 && (
                  <span className="text-gray-400">
                    {isAr ? `يعرض أول 10 من ${preview.total}` : `showing first 10 of ${preview.total}`}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleImport}
              disabled={loading || preview.balancedCount === 0}
              className="btn-primary"
            >
              {loading
                ? "..."
                : (isAr
                  ? `استيراد ${preview.balancedCount} قيد`
                  : `Import ${preview.balancedCount} entries`)}
            </button>
          </div>

          <div className="space-y-3">
            {preview.preview.map((entry, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${
                  entry.balanced
                    ? "border-gray-200 bg-white"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2 text-sm">
                  <div className="flex gap-3">
                    <span className="text-gray-400 font-mono text-xs">{entry.date}</span>
                    <span className="font-medium text-gray-800 truncate max-w-xs">{entry.description}</span>
                  </div>
                  {entry.balanced ? (
                    <span className="text-xs text-green-600 font-medium">✓ {isAr ? "متوازن" : "Balanced"}</span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">
                      ✗ {isAr ? `فرق: ${fmt(Math.abs(entry.totalDebit - entry.totalCredit))}` : `Diff: ${fmt(Math.abs(entry.totalDebit - entry.totalCredit))}`}
                    </span>
                  )}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-start py-0.5">{isAr ? "رمز الحساب" : "Account Code"}</th>
                      <th className="text-end py-0.5">{isAr ? "مدين" : "Debit"}</th>
                      <th className="text-end py-0.5">{isAr ? "دائن" : "Credit"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines.map((l, j) => (
                      <tr key={j} className="font-mono">
                        <td className="py-0.5 text-gray-700">{l.accountCode}</td>
                        <td className="py-0.5 text-end text-gray-800">{l.debit > 0 ? fmt(l.debit) : ""}</td>
                        <td className="py-0.5 text-end text-gray-800">{l.credit > 0 ? fmt(l.credit) : ""}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200 font-semibold">
                      <td className="pt-1 text-gray-500">{isAr ? "الإجمالي" : "Total"}</td>
                      <td className="pt-1 text-end">{fmt(entry.totalDebit)}</td>
                      <td className="pt-1 text-end">{fmt(entry.totalCredit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [tab, setTab] = useState<Tab>("contacts");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "استيراد البيانات" : "Data Import"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "استيراد جهات الاتصال أو قيود اليومية من ملف CSV"
            : "Import contacts or journal entries from a CSV file"}
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(["contacts", "journal"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t === "contacts"
              ? (isAr ? "👥 جهات الاتصال" : "👥 Contacts")
              : (isAr ? "📒 قيود اليومية" : "📒 Journal Entries")}
          </button>
        ))}
      </div>

      {tab === "contacts" ? <ContactsImport isAr={isAr} /> : <JournalImport isAr={isAr} />}
    </div>
  );
}
