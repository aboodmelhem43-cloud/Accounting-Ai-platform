import { createHash } from "crypto";
import type { JoFotaraInvoice } from "./types";

/** SHA-256 hash of canonical invoice JSON, hex-encoded. Used as previousInvoiceHash. */
export function hashInvoice(invoice: JoFotaraInvoice): string {
  const { qrCode: _q, ...invoiceWithoutQr } = invoice;
  const canonical = JSON.stringify(invoiceWithoutQr);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Build a TLV (Type-Length-Value) QR code payload per JoFotara specification.
 *
 * TLV tags:
 *   1 = Seller name
 *   2 = Seller TIN
 *   3 = Invoice date (YYYY-MM-DD)
 *   4 = Total gross amount (string, 2 decimal places)
 *   5 = Total tax amount (string, 2 decimal places)
 */
function encodeTlv(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, "utf8");
  const header = Buffer.alloc(2);
  header.writeUInt8(tag, 0);
  header.writeUInt8(valueBytes.length, 1);
  return Buffer.concat([header, valueBytes]);
}

export function buildQrCode(invoice: JoFotaraInvoice): string {
  const tlv = Buffer.concat([
    encodeTlv(1, invoice.seller.name),
    encodeTlv(2, invoice.seller.TIN),
    encodeTlv(3, invoice.invoiceDate),
    encodeTlv(4, invoice.totalGrossAmount.toFixed(2)),
    encodeTlv(5, invoice.totalTaxAmount.toFixed(2)),
  ]);
  return tlv.toString("base64");
}

/** Attach QR code to the invoice and return a new invoice object. */
export function signInvoice(invoice: JoFotaraInvoice): JoFotaraInvoice {
  return {
    ...invoice,
    qrCode: buildQrCode(invoice),
  };
}
