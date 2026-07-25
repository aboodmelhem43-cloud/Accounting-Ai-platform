"use client";
import { useState } from "react";

interface Props {
  label: string;
  invoiceNumber?: string;
  invoiceId?: string;
}

export default function PrintButton({ label, invoiceNumber, invoiceId }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const el = document.getElementById("invoice-print");
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      let remaining = imgH;
      let yPos = 0;
      pdf.addImage(imgData, "PNG", 0, yPos, pageW, imgH);
      remaining -= pageH;

      while (remaining > 0) {
        yPos -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, yPos, pageW, imgH);
        remaining -= pageH;
      }

      pdf.save(`invoice-${invoiceNumber ?? "doc"}.pdf`);

      // رفع PDF إلى السحابة بشكل غير متزامن — لا يعطّل التحميل المحلي
      const pdfBytes = pdf.output("arraybuffer");
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const fd = new FormData();
      fd.append("file", blob, `invoice-${invoiceNumber ?? "doc"}.pdf`);
      fd.append("name", `Invoice ${invoiceNumber ?? ""}`);
      fd.append("type", "INVOICE_PDF");
      if (invoiceId) fd.append("invoiceId", invoiceId);
      fetch("/api/documents/upload", { method: "POST", body: fd }).catch(() => {/* non-blocking */});
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadPdf}
        disabled={downloading}
        className="btn-primary"
      >
        {downloading ? "⏳ جارٍ التحميل…" : "⬇️ تحميل PDF"}
      </button>
      <button
        onClick={() => window.print()}
        className="btn-secondary"
      >
        {label}
      </button>
    </div>
  );
}
