/**
 * Verify a file's true type by inspecting its magic bytes rather than trusting
 * the client-supplied MIME type header. Returns the detected MIME type when
 * the bytes match a known signature, or null when they don't.
 */

const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  // JPEG — FF D8 FF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG — 89 50 4E 47 0D 0A 1A 0A
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP — RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // checked together with webp marker below
  // PDF — %PDF
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

function matchesSignature(buf: Buffer, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  return sig.every((b, i) => buf[offset + i] === b);
}

export function detectMimeType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (sig.mime === "image/webp") {
      // WebP: RIFF at 0 AND WEBP at 8
      if (
        matchesSignature(buffer, [0x52, 0x49, 0x46, 0x46]) &&
        buffer.length >= 12 &&
        buffer.slice(8, 12).toString("ascii") === "WEBP"
      ) {
        return "image/webp";
      }
      continue;
    }
    if (matchesSignature(buffer, sig.bytes, sig.offset ?? 0)) return sig.mime;
  }
  return null;
}
