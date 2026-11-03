import { randomUUID } from "crypto";
import type {
  ETADocument,
  ETADocumentType,
  ETAInvoiceLine,
  ETATaxTotal,
} from "./types";

type InvoiceDocumentType = "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";

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
  /** Line items derived from extractedData or journal lines */
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceEGP: number;
    discountAmount?: number;
    vatRate?: number; // default 0.14
  }>;
  activityCode?: string;
}

function toETADocumentType(type: string): ETADocumentType {
  if (type === "CREDIT_NOTE") return "C";
  if (type === "DEBIT_NOTE") return "D";
  return "I";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Parse an Egyptian address string into ETA address fields (best-effort). */
function parseEgyptianAddress(raw: string | null) {
  return {
    country: "EGY",
    regionCity: raw ?? "Cairo",
    street: raw ?? "",
    buildingNumber: "1",
    postalCode: "",
  };
}

export function buildETADocument(params: BuildParams): ETADocument {
  const { invoice, business, contact, lineItems, activityCode = "4741" } = params;

  const docType = toETADocumentType(
    (invoice.documentType ?? "INVOICE") as InvoiceDocumentType
  );

  // Build invoice lines
  const invoiceLines: ETAInvoiceLine[] = lineItems.map((item, idx) => {
    const vatRate = item.vatRate ?? 0.14;
    const salesTotal = round2(item.quantity * item.unitPriceEGP);
    const discountAmount = round2(item.discountAmount ?? 0);
    const netTotal = round2(salesTotal - discountAmount);
    const vatAmount = round2(netTotal * vatRate);
    const total = round2(netTotal + vatAmount);

    return {
      description: item.description,
      itemType: "FREE_TEXT",
      itemCode: `ITEM-${String(idx + 1).padStart(3, "0")}`,
      unitType: "EA",
      quantity: item.quantity,
      internalCode: `ITEM-${String(idx + 1).padStart(3, "0")}`,
      salesTotal,
      total,
      netTotal,
      itemsDiscount: discountAmount,
      discount: discountAmount > 0 ? { amount: discountAmount } : undefined,
      unitValue: {
        currencySold: "EGP",
        amountEGP: round2(item.unitPriceEGP),
      },
      taxableItems: vatAmount > 0
        ? [{ taxType: "T1", amount: vatAmount, subType: "V009", rate: vatRate * 100 }]
        : [],
    };
  });

  // Aggregate totals
  const totalSalesAmount = round2(invoiceLines.reduce((s, l) => s + l.salesTotal, 0));
  const totalDiscountAmount = round2(invoiceLines.reduce((s, l) => s + (l.itemsDiscount ?? 0), 0));
  const netAmount = round2(totalSalesAmount - totalDiscountAmount);
  const taxAmount = round2(invoiceLines.reduce(
    (s, l) => s + l.taxableItems.reduce((ts, ti) => ts + ti.amount, 0),
    0
  ));
  const totalAmount = round2(netAmount + taxAmount);

  // Tax totals grouped by type (only T1/VAT for now)
  const taxTotals: ETATaxTotal[] = taxAmount > 0
    ? [{ taxType: "T1", amount: taxAmount }]
    : [];

  const issuerAddress = parseEgyptianAddress(business.address);
  const receiverAddress = contact
    ? parseEgyptianAddress(contact.address)
    : { country: "EGY", regionCity: "Cairo", street: "", buildingNumber: "1", postalCode: "" };

  return {
    issuer: {
      address: issuerAddress,
      type: "B",
      id: business.taxNumber ?? "000000000",
      name: business.name,
    },
    receiver: {
      address: receiverAddress,
      type: contact?.taxNumber ? "B" : "P",
      id: contact?.taxNumber ?? undefined,
      name: contact?.name ?? "مستهلك",
    },
    documentType: docType,
    documentTypeVersion: "1.0",
    dateTimeIssued: invoice.createdAt.toISOString(),
    taxpayerActivityCode: activityCode,
    internalID: invoice.invoiceNumber ?? invoice.id,
    invoiceLines,
    taxTotals,
    totalSalesAmount,
    totalDiscountAmount,
    netAmount,
    taxAmount,
    totalAmount,
    extraDiscountAmount: 0,
    totalItemsDiscountAmount: totalDiscountAmount,
    uuid: randomUUID(),
  };
}
