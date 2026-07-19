"use client";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

type ContactType = "CUSTOMER" | "VENDOR";

interface Contact {
  id: string;
  type: ContactType;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  notes: string | null;
  createdAt: string;
}

interface ContactForm {
  type: ContactType;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  notes: string;
}

interface ContactInvoice {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  total: number;
  paid: number;
  outstanding: number;
  paymentStatus: string;
  invoiceType: string;
}

interface ContactHistory {
  contact: Contact;
  invoices: ContactInvoice[];
  summary: { totalBilled: number; totalPaid: number; outstanding: number; currency: string };
}

const emptyForm = (): ContactForm => ({
  type: "CUSTOMER",
  name: "",
  email: "",
  phone: "",
  address: "",
  taxNumber: "",
  notes: "",
});

const paymentStatusLabels: Record<string, { ar: string; en: string; color: string }> = {
  UNPAID: { ar: "غير مدفوعة", en: "Unpaid", color: "text-yellow-700 bg-yellow-100" },
  PARTIALLY_PAID: { ar: "جزئي", en: "Partial", color: "text-blue-700 bg-blue-100" },
  PAID: { ar: "مدفوعة", en: "Paid", color: "text-green-700 bg-green-100" },
  VOIDED: { ar: "ملغاة", en: "Voided", color: "text-gray-500 bg-gray-100" },
};

export default function ContactsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [activeTab, setActiveTab] = useState<ContactType>("CUSTOMER");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyContact, setHistoryContact] = useState<ContactHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?type=${activeTab}`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditContact(null);
    setForm({ ...emptyForm(), type: activeTab });
    setError(null);
    setShowModal(true);
  }

  function openEdit(c: Contact) {
    setEditContact(c);
    setForm({
      type: c.type,
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      taxNumber: c.taxNumber ?? "",
      notes: c.notes ?? "",
    });
    setError(null);
    setShowModal(true);
  }

  async function openHistory(contactId: string) {
    setHistoryLoading(true);
    setHistoryContact(null);
    try {
      const res = await fetch(`/api/contacts/${contactId}/transactions`);
      if (res.ok) {
        const data = await res.json() as ContactHistory;
        setHistoryContact(data);
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        taxNumber: form.taxNumber || null,
        notes: form.notes || null,
      };
      const url = editContact ? `/api/contacts/${editContact.id}` : "/api/contacts";
      const method = editContact ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Error");
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const fmt = (n: number, currency: string) =>
    `${n.toLocaleString(isAr ? "ar-EG" : "en-US", { minimumFractionDigits: 2 })} ${currency}`;

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "العملاء والموردون" : "Contacts"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr ? "إدارة عملاء وموردي منشأتك" : "Manage your customers and vendors"}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          + {isAr ? "إضافة" : "Add New"}
        </button>
      </div>

      {/* التبويبات */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["CUSTOMER", "VENDOR"] as ContactType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "CUSTOMER"
              ? (isAr ? "العملاء" : "Customers")
              : (isAr ? "الموردون" : "Vendors")}
          </button>
        ))}
      </div>

      {/* الجدول */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin text-2xl mb-2">⚙️</div>
            <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500 font-medium">
              {isAr
                ? `لا يوجد ${activeTab === "CUSTOMER" ? "عملاء" : "موردون"} بعد`
                : `No ${activeTab === "CUSTOMER" ? "customers" : "vendors"} yet`}
            </p>
            <button onClick={openAdd} className="mt-4 btn-primary text-sm">
              + {isAr ? "إضافة أول" : "Add First"}{" "}
              {activeTab === "CUSTOMER" ? (isAr ? "عميل" : "Customer") : (isAr ? "مورد" : "Vendor")}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "الاسم" : "Name"}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "البريد" : "Email"}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "الهاتف" : "Phone"}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "الرقم الضريبي" : "Tax No."}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.taxNumber ?? "—"}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button
                      onClick={() => openHistory(c.id)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {isAr ? "السجل" : "History"}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {isAr ? "تعديل" : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      {isAr ? "حذف" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History modal */}
      {(historyLoading || historyContact) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {historyContact
                  ? (isAr ? `سجل: ${historyContact.contact.name}` : `History: ${historyContact.contact.name}`)
                  : (isAr ? "جاري التحميل..." : "Loading...")}
              </h2>
              <button onClick={() => setHistoryContact(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            {historyLoading && (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin text-2xl mb-2">⚙️</div>
              </div>
            )}

            {historyContact && !historyLoading && (
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-gray-800">
                      {fmt(historyContact.summary.totalBilled, historyContact.summary.currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{isAr ? "إجمالي الفواتير" : "Total Billed"}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-green-700">
                      {fmt(historyContact.summary.totalPaid, historyContact.summary.currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{isAr ? "المدفوع" : "Paid"}</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${historyContact.summary.outstanding > 0 ? "bg-red-50" : "bg-green-50"}`}>
                    <div className={`text-lg font-bold ${historyContact.summary.outstanding > 0 ? "text-red-700" : "text-green-700"}`}>
                      {fmt(historyContact.summary.outstanding, historyContact.summary.currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{isAr ? "المتبقي" : "Outstanding"}</div>
                  </div>
                </div>

                {/* Invoices */}
                {historyContact.invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>{isAr ? "لا توجد فواتير مرتبطة" : "No linked invoices yet"}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{isAr ? "الفواتير" : "Invoices"}</h3>
                    <div className="space-y-2">
                      {historyContact.invoices.map((inv) => {
                        const ps = paymentStatusLabels[inv.paymentStatus] ?? paymentStatusLabels.UNPAID;
                        return (
                          <div key={inv.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 text-sm hover:bg-gray-50">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">
                                {inv.invoiceNumber ? `#${inv.invoiceNumber}` : `#${inv.id.slice(-6).toUpperCase()}`}
                              </span>
                              {inv.invoiceDate && (
                                <span className="text-gray-400 text-xs mx-2">
                                  {new Date(inv.invoiceDate).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-800">
                                {fmt(inv.total, historyContact.summary.currency)}
                              </div>
                              {inv.outstanding > 0 && (
                                <div className="text-xs text-red-600">
                                  {isAr ? "متبقي:" : "Due:"} {fmt(inv.outstanding, historyContact.summary.currency)}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${ps.color}`}>
                              {isAr ? ps.ar : ps.en}
                            </span>
                            <a
                              href={`/invoices/${inv.id}/view`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {isAr ? "عرض" : "View"}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isAr ? "حذف الاتصال؟" : "Delete Contact?"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isAr
                  ? "سيتم حذف هذا الاتصال نهائيًا. هذا الإجراء لا يمكن التراجع عنه."
                  : "This contact will be permanently deleted. This cannot be undone."}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {isAr ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال الإضافة/التعديل */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editContact
                  ? (isAr ? "تعديل الاتصال" : "Edit Contact")
                  : (isAr ? "إضافة اتصال جديد" : "Add New Contact")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* النوع */}
              <div>
                <label className="label">{isAr ? "النوع" : "Type"}</label>
                <div className="flex gap-3">
                  {(["CUSTOMER", "VENDOR"] as ContactType[]).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={() => setForm((f) => ({ ...f, type: t }))}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">
                        {t === "CUSTOMER" ? (isAr ? "عميل" : "Customer") : (isAr ? "مورد" : "Vendor")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{isAr ? "الاسم *" : "Name *"}</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="input"
                    placeholder={isAr ? "اسم العميل أو المورد" : "Full name"}
                  />
                </div>
                <div>
                  <label className="label">{isAr ? "البريد الإلكتروني" : "Email"}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="input"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="label">{isAr ? "الهاتف" : "Phone"}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="input"
                    placeholder="+20..."
                  />
                </div>
                <div>
                  <label className="label">{isAr ? "الرقم الضريبي" : "Tax Number"}</label>
                  <input
                    type="text"
                    value={form.taxNumber}
                    onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value }))}
                    className="input"
                    placeholder={isAr ? "اختياري" : "Optional"}
                  />
                </div>
              </div>

              <div>
                <label className="label">{isAr ? "العنوان" : "Address"}</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="input"
                  placeholder={isAr ? "اختياري" : "Optional"}
                />
              </div>

              <div>
                <label className="label">{isAr ? "ملاحظات" : "Notes"}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input"
                  rows={2}
                  placeholder={isAr ? "اختياري" : "Optional"}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
