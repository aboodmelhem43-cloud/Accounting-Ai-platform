/**
 * Generates a ZATCA-compliant Base64 TLV QR string.
 * Spec: ZATCA e-invoicing TLV encoding (Phase 1 simplified)
 * Tags: 1=SellerName, 2=VATRegNum, 3=Timestamp, 4=TotalWithVAT, 5=VATAmount
 */
export function buildZatcaQr(
  sellerName: string,
  vatNumber: string,
  invoiceDate: string,
  grandTotal: number,
  vatAmount: number
): string {
  function tlv(tag: number, value: string): Uint8Array {
    const encoded = new TextEncoder().encode(value);
    const out = new Uint8Array(2 + encoded.length);
    out[0] = tag;
    out[1] = encoded.length;
    out.set(encoded, 2);
    return out;
  }

  const parts = [
    tlv(1, sellerName),
    tlv(2, vatNumber),
    tlv(3, new Date(invoiceDate).toISOString()),
    tlv(4, grandTotal.toFixed(2)),
    tlv(5, vatAmount.toFixed(2)),
  ];

  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    merged.set(p, offset);
    offset += p.length;
  }

  return btoa(String.fromCharCode(...merged));
}
