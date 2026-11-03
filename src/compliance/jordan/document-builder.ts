import type { JoFotaraInvoice, JoFotaraLineItem } from "./types";

interface BuildParams {
  invoice: {
    id: string;
    invoiceNumber: string | null;
    documentType: string;
    createdAt: Date;
    extractedData: unknown;
  };
  business: {
    name: string;
    taxNumber: string | null;
    address: string | null;
    country: string;
  };
  contact: {
    name: string;
    taxNumber: string | null;
    address: string | null;
    type: string;
  } | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceJOD: number;
    discountAmount?: number;
    gstRate?: number; // default 0.16
  }>;
  /** SHA-256 hash of previous invoice; "0" for first invoice in chain */
  previousInvoiceHash?: string;
  invoiceCounter?: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildJoFotaraInvoice(params: BuildParams): JoFotaraInvoice {
  const {
    invoice,
    business,
    contact,
    lineItems,
    previousInvoiceHash = "0",
    invoiceCounter = 1,
  } = params;

  const issuedAt = invoice.createdAt;

  const builtLines: JoFotaraLineItem[] = lineItems.map((item, idx) => {
    const gstRate = item.gstRate ?? 0.16;
    const salesTotal = round2(item.quantity * item.unitPriceJOD);
    const discountAmount = round2(item.discountAmount ?? 0);
    const netAmount = round2(salesTotal - discountAmount);
    const taxAmount = round2(netAmount * gstRate);
    const grossAmount = round2(netAmount + taxAmount);

    return {
      lineNumber: idx + 1,
      itemDescription: item.description,
      quantity: item.quantity,
      unitPrice: round2(item.unitPriceJOD),
      discountAmount,
      netAmount,
      taxCategory: "S",
      taxRate: gstRate,
      taxAmount,
      grossAmount,
    };
  });

  const totalNetAmount = round2(builtLines.reduce((s, l) => s + l.netAmount, 0));
  const totalTaxAmount = round2(builtLines.reduce((s, l) => s + l.taxAmount, 0));
  const totalGrossAmount = round2(totalNetAmount + totalTaxAmount);
  const totalDiscountAmount = round2(builtLines.reduce((s, l) => s + l.discountAmount, 0));

  const isBusiness = !!(contact?.taxNumber);

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber ?? invoice.id,
    invoiceStatus: "0",
    invoiceDate: issuedAt.toISOString().split("T")[0],
    invoiceTime: issuedAt.toISOString().split("T")[1].substring(0, 8),
    paymentMethod: "01",
    invoiceCurrency: "JOD",
    invoiceCounterValue: invoiceCounter,
    previousInvoiceHash,
    seller: {
      TIN: business.taxNumber ?? "000000000",
      name: business.name,
    },
    buyer: {
      type: isBusiness ? "1" : "0",
      TIN: contact?.taxNumber ?? undefined,
      name: contact?.name ?? "مستهلك",
    },
    invoiceLinesCount: builtLines.length,
    lineItems: builtLines,
    totalNetAmount,
    totalTaxAmount,
    totalGrossAmount,
    totalDiscountAmount,
  };
}
