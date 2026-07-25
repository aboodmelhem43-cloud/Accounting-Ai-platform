"use client";
import { useState } from "react";

interface Props {
  targetId: string;      // id of the DOM element to capture (e.g. "report-content")
  fileName: string;      // e.g. "income-statement-2024-01.pdf"
  documentName: string;  // human-readable name saved in DB
  label?: string;
  labelAr?: string;
}

export default function SavePdfButton({ targetId, fileName, documentName, label }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const el = document.getElementById(targetId);
      if (!el) { setStatus("error"); return; }

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");
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

      // حفظ محلي أولاً
      pdf.save(fileName);

      // رفع إلى السحابة
      const pdfBytes = pdf.output("arraybuffer");
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const fd = new FormData();
      fd.append("file", blob, fileName);
      fd.append("name", documentName);
      fd.append("type", "REPORT");
      await fetch("/api/documents/upload", { method: "POST", body: fd });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving"}
      className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-60"
    >
      {status === "saving" ? "⏳" : status === "done" ? "✅" : status === "error" ? "❌" : "📥"}
      {status === "done"
        ? "تم الحفظ"
        : status === "saving"
        ? "جارٍ الحفظ..."
        : (label ?? "حفظ PDF")}
    </button>
  );
}
