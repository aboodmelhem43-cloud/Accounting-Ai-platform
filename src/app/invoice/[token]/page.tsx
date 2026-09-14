import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { ExtractedInvoiceData } from "@/types";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { viewToken: token },
    include: {
      business: { select: { name: true, phone: true, address: true, taxNumber: true, baseCurrency: true } },
      contact: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!invoice) return notFound();

  const extracted = invoice.extractedData as ExtractedInvoiceData | null;
  const currency = invoice.business.baseCurrency;
  const invoiceNumber = extracted?.invoiceNumber ?? invoice.id.slice(-8).toUpperCase();
  const invoiceDate = extracted?.invoiceDate ?? invoice.createdAt.toISOString().split("T")[0];
  const totalAmount = extracted?.totalAmount ?? 0;
  const taxAmount = extracted?.taxAmount ?? 0;
  const subtotal = extracted?.subtotal ?? (totalAmount - taxAmount);
  const dueDate = invoice.dueDate?.toISOString().split("T")[0] ?? "";

  const party = invoice.invoiceType === "PURCHASE"
    ? (extracted?.vendorName ?? "—")
    : (invoice.contact?.name ?? extracted?.customerName ?? "—");

  const statusColors: Record<string, string> = {
    PENDING_REVIEW: "#f59e0b",
    CONFIRMED: "#16a34a",
    REJECTED: "#dc2626",
  };
  const statusLabels: Record<string, string> = {
    PENDING_REVIEW: "قيد المراجعة",
    CONFIRMED: "مؤكدة",
    REJECTED: "مرفوضة",
  };
  const statusColor = statusColors[invoice.status] ?? "#6b7280";
  const statusLabel = statusLabels[invoice.status] ?? invoice.status;

  const paymentLabels: Record<string, string> = {
    UNPAID: "غير مدفوعة",
    PARTIALLY_PAID: "مدفوعة جزئياً",
    PAID: "مدفوعة",
    VOIDED: "ملغية",
  };

  const fmt = (n: number) =>
    n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ background: "#1d4ed8", padding: "28px 32px" }}>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {invoice.business.name}
          </div>
          {invoice.business.phone && (
            <div style={{ color: "#bfdbfe", fontSize: 13 }}>{invoice.business.phone}</div>
          )}
          {invoice.business.address && (
            <div style={{ color: "#bfdbfe", fontSize: 13 }}>{invoice.business.address}</div>
          )}
          {invoice.business.taxNumber && (
            <div style={{ color: "#bfdbfe", fontSize: 13 }}>الرقم الضريبي: {invoice.business.taxNumber}</div>
          )}
        </div>

        <div style={{ padding: "28px 32px" }}>
          {/* Invoice meta */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 2 }}>رقم الفاتورة</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>#{invoiceNumber}</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <span
                style={{
                  background: statusColor + "22",
                  color: statusColor,
                  border: `1px solid ${statusColor}55`,
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Details table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <tbody>
              <Row label="التاريخ" value={invoiceDate} />
              {dueDate && <Row label="تاريخ الاستحقاق" value={dueDate} />}
              <Row
                label={invoice.invoiceType === "PURCHASE" ? "المورد" : "العميل"}
                value={party}
              />
              <Row label="حالة الدفع" value={paymentLabels[invoice.paymentStatus] ?? invoice.paymentStatus} />
              <Row label="نوع الفاتورة" value={invoice.invoiceType === "PURCHASE" ? "مشتريات" : "مبيعات"} />
            </tbody>
          </table>

          {/* Amounts */}
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            {subtotal > 0 && (
              <AmountRow label="المبلغ قبل الضريبة" value={fmt(subtotal)} />
            )}
            {taxAmount > 0 && (
              <AmountRow label="ضريبة القيمة المضافة" value={fmt(taxAmount)} />
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 20px",
                background: "#eff6ff",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#1e40af", fontSize: 15 }}>المبلغ الإجمالي</span>
              <span style={{ color: "#1d4ed8", fontSize: 18 }}>{fmt(totalAmount)}</span>
            </div>
          </div>

          <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", margin: 0 }}>
            هذه وثيقة إلكترونية صادرة من منصة محاسب اي — mohasabai.com
          </p>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        style={{
          padding: "10px 0",
          borderBottom: "1px solid #f3f4f6",
          color: "#6b7280",
          fontSize: 14,
          width: "45%",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "10px 0",
          borderBottom: "1px solid #f3f4f6",
          color: "#111827",
          fontSize: 14,
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <span style={{ color: "#6b7280", fontSize: 14 }}>{label}</span>
      <span style={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
