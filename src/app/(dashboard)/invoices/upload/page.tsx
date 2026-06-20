"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

export default function UploadInvoicePage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [invoiceType, setInvoiceType] = useState<"purchase" | "sales">("purchase");
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setError("");
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invoiceType", invoiceType);

      setStatus("extracting");
      const res = await fetch("/api/invoices", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        setStatus("error");
        return;
      }

      setStatus("done");
      router.push(`/invoices/${data.invoiceId}/review`);
    } catch {
      setError(t("common.error"));
      setStatus("error");
    }
  }

  const isLoading = status === "uploading" || status === "extracting";

  const types = [
    { key: "purchase" as const, label: lang === "ar" ? "🛒 فاتورة مشتريات" : "🛒 Purchase Invoice" },
    { key: "sales" as const, label: lang === "ar" ? "💼 فاتورة مبيعات" : "💼 Sales Invoice" },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("invoices.upload.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar"
            ? "الذكاء الاصطناعي سيستخرج البيانات تلقائيًا — ستتمكن من مراجعتها قبل الحفظ"
            : "AI will extract data automatically — you can review it before saving"}
        </p>
      </div>

      <div className="card">
        <label className="label">{lang === "ar" ? "نوع الفاتورة" : "Invoice Type"}</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {types.map((tp) => (
            <button
              key={tp.key}
              type="button"
              onClick={() => setInvoiceType(tp.key)}
              className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                invoiceType === tp.key
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="label">{t("invoices.upload.label")}</label>
        <div
          className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
          ) : file ? (
            <div className="text-gray-600">
              <div className="text-3xl mb-2">📄</div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-gray-400">
              <div className="text-4xl mb-3">⬆️</div>
              <p className="font-medium text-gray-600">
                {lang === "ar" ? "اضغط لاختيار ملف أو اسحبه هنا" : "Click to choose a file or drag it here"}
              </p>
              <p className="text-xs mt-1">{t("invoices.upload.hint")}</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {file && !preview && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            {lang === "ar" ? "ملف PDF — سيُرسل للذكاء الاصطناعي للقراءة مباشرة" : "PDF file — will be sent to AI for direct reading"}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="card bg-blue-50 border-blue-200 text-center py-6">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
          <p className="text-blue-700 font-medium">
            {status === "uploading"
              ? (lang === "ar" ? "جاري رفع الملف..." : "Uploading file...")
              : t("invoices.upload.loading")}
          </p>
          <p className="text-blue-500 text-sm mt-1">
            {lang === "ar" ? "قد يستغرق ذلك 10-30 ثانية" : "This may take 10-30 seconds"}
          </p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? (lang === "ar" ? "جاري المعالجة..." : "Processing...") : t("invoices.upload.submit")}
        </button>
        <button
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={isLoading}
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
