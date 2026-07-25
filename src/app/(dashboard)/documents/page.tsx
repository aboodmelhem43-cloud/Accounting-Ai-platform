"use client";
import { useEffect, useState } from "react";
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
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {isAr ? "أخرى" : "Other"}
        </span>
      );
  }
}

export default function DocumentsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "المستندات المحفوظة" : "Saved Documents"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "الفواتير والتقارير المحفوظة في السحابة"
            : "Invoices and reports saved to cloud storage"}
        </p>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">📄</p>
          <p className="text-gray-500 text-sm">
            {isAr
              ? "لا توجد مستندات محفوظة — قم بتحميل تقرير أو فاتورة PDF لحفظها هنا"
              : "No saved documents yet — download a report or invoice PDF to save it here"}
          </p>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="card divide-y divide-gray-100">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">📄</span>
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
              <div className="flex items-center gap-3 flex-shrink-0">
                {typeBadge(doc.type, isAr)}
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1 px-3"
                >
                  {isAr ? "تحميل" : "Download"}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
