"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadInvoicePage() {
  const router = useRouter();
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
        setError(data.error ?? "فشل في رفع الفاتورة");
        setStatus("error");
        return;
      }

      setStatus("done");
      router.push(`/invoices/${data.invoiceId}/review`);
    } catch {
      setError("حدث خطأ في الاتصال");
      setStatus("error");
    }
  }

  const isLoading = status === "uploading" || status === "extracting";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">رفع فاتورة جديدة</h1>
        <p className="text-gray-500 text-sm mt-1">
          الذكاء الاصطناعي سيستخرج البيانات تلقائيًا — ستتمكن من مراجعتها قبل الحفظ
        </p>
      </div>

      {/* نوع الفاتورة */}
      <div className="card">
        <label className="label">نوع الفاتورة</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {(["purchase", "sales"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setInvoiceType(t)}
              className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                invoiceType === t
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {t === "purchase" ? "🛒 فاتورة مشتريات" : "💼 فاتورة مبيعات"}
            </button>
          ))}
        </div>
      </div>

      {/* منطقة رفع الملف */}
      <div className="card">
        <label className="label">ملف الفاتورة</label>
        <div
          className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="معاينة" className="max-h-48 mx-auto rounded-lg object-contain" />
          ) : file ? (
            <div className="text-gray-600">
              <div className="text-3xl mb-2">📄</div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-gray-400">
              <div className="text-4xl mb-3">⬆️</div>
              <p className="font-medium text-gray-600">اضغط لاختيار ملف أو اسحبه هنا</p>
              <p className="text-xs mt-1">JPG، PNG، WebP، PDF — حتى 10 ميجابايت</p>
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
            ملف PDF — سيُرسل للذكاء الاصطناعي للقراءة مباشرة
          </p>
        )}
      </div>

      {/* حالة المعالجة */}
      {isLoading && (
        <div className="card bg-blue-50 border-blue-200 text-center py-6">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
          <p className="text-blue-700 font-medium">
            {status === "uploading" ? "جاري رفع الملف..." : "الذكاء الاصطناعي يقرأ الفاتورة..."}
          </p>
          <p className="text-blue-500 text-sm mt-1">قد يستغرق ذلك 10-30 ثانية</p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? "جاري المعالجة..." : "رفع وتحليل الفاتورة"}
        </button>
        <button
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={isLoading}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
