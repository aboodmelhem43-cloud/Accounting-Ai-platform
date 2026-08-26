"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";

interface StoredDocument {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  createdAt: string;
}

function typeBadge(type: string, isAr: boolean) {
  switch (type) {
    case "INVOICE_PDF":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {isAr ? "فاتورة PDF" : "Invoice PDF"}
        </span>
      );
    case "REPORT":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {isAr ? "تقرير" : "Report"}
        </span>
      );
    case "RECEIPT":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          {isAr ? "إيصال" : "Receipt"}
        </span>
      );
    case "CONTRACT":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          {isAr ? "عقد" : "Contract"}
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {isAr ? "أخرى" : "Other"}
        </span>
      );
  }
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "")) return "🖼️";
  if (["xlsx", "xls", "csv"].includes(ext ?? "")) return "📊";
  if (["doc", "docx"].includes(ext ?? "")) return "📝";
  return "📎";
}

export default function DocumentsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("OTHER");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadDocuments() {
    setLoading(true);
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadDocuments(); }, []);

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile, selectedFile.name);
      fd.append("name", uploadName || selectedFile.name);
      fd.append("type", uploadType);
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setSelectedFile(null);
      setUploadName("");
      setUploadType("OTHER");
      loadDocuments();
    } catch {
      alert(isAr ? "فشل رفع الملف" : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `business-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(isAr ? "فشل تصدير البيانات" : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? "هل تريد حذف هذا المستند؟" : "Delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert(isAr ? "فشل حذف المستند" : "Failed to delete document");
    }
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "المستندات والملفات" : "Documents & Files"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr
              ? "رفع وحفظ وتنزيل جميع مستنداتك في السحابة"
              : "Upload, save, and download all your documents to cloud storage"}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2"
        >
          {exporting ? "⏳" : "📥"}{" "}
          {isAr ? "تصدير جميع البيانات (Excel)" : "Export All Data (Excel)"}
        </button>
      </div>

      {/* Upload Area */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {isAr ? "رفع مستند جديد" : "Upload New Document"}
        </h2>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />
          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-3xl">{fileIcon(selectedFile.name)}</p>
              <p className="font-medium text-gray-800">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
              <button
                className="text-xs text-red-500 hover:underline mt-1"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadName(""); }}
              >
                {isAr ? "إزالة" : "Remove"}
              </button>
            </div>
          ) : (
            <>
              <p className="text-3xl mb-2">☁️</p>
              <p className="text-gray-500 text-sm">
                {isAr
                  ? "اسحب الملف هنا أو انقر للاختيار"
                  : "Drag a file here or click to browse"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isAr ? "PDF، صور، Excel، Word — حتى 10 ميجابايت" : "PDF, images, Excel, Word — up to 10 MB"}
              </p>
            </>
          )}
        </div>

        {/* Upload form fields */}
        {selectedFile && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {isAr ? "اسم المستند" : "Document name"}
              </label>
              <input
                className="input"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder={isAr ? "اسم المستند..." : "Document name..."}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {isAr ? "نوع المستند" : "Document type"}
              </label>
              <select
                className="input"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <option value="OTHER">{isAr ? "أخرى" : "Other"}</option>
                <option value="RECEIPT">{isAr ? "إيصال" : "Receipt"}</option>
                <option value="CONTRACT">{isAr ? "عقد" : "Contract"}</option>
                <option value="INVOICE_PDF">{isAr ? "فاتورة PDF" : "Invoice PDF"}</option>
                <option value="REPORT">{isAr ? "تقرير" : "Report"}</option>
              </select>
            </div>
          </div>
        )}

        {selectedFile && (
          <button
            className="btn-primary mt-4 w-full"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading
              ? (isAr ? "جارٍ الرفع..." : "Uploading...")
              : (isAr ? "رفع المستند" : "Upload Document")}
          </button>
        )}
      </div>

      {/* Documents List */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {isAr ? "المستندات المحفوظة" : "Saved Documents"}
          {documents.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({documents.length})
            </span>
          )}
        </h2>

        {loading && (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin text-2xl mb-2">⚙️</div>
            <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📂</p>
            <p className="text-gray-500 text-sm">
              {isAr
                ? "لا توجد مستندات محفوظة بعد — ارفع أول مستند أعلاه"
                : "No saved documents yet — upload your first document above"}
            </p>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{fileIcon(doc.name)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {typeBadge(doc.type, isAr)}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    {isAr ? "تحميل" : "Download"}
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50"
                    title={isAr ? "حذف" : "Delete"}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
