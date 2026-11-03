import { createHash } from "crypto";
import type { ETADocument } from "./types";

/**
 * Canonical JSON serialization per ETA specification.
 * Keys must be sorted alphabetically at every level; numbers have 5 decimal places.
 */
function canonicalValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toFixed(5);
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    return `[${value.map(canonicalValue).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const pairs = keys
      .filter((k) => obj[k] !== undefined && obj[k] !== null)
      .map((k) => `"${k}":${canonicalValue(obj[k])}`);
    return `{${pairs.join(",")}}`;
  }
  return String(value);
}

/** Produce the canonical string representation of an ETA document for signing. */
export function serializeDocument(doc: ETADocument): string {
  // ETA spec: serialize the document minus the signatures array
  const { signatures: _s, uuid: _u, ...docWithoutSignature } = doc;
  return canonicalValue(docWithoutSignature);
}

/** SHA-256 hash of the canonical serialization, base64-encoded. */
export function hashDocument(serialized: string): string {
  return createHash("sha256").update(serialized, "utf8").digest("base64");
}

/**
 * Sign the document.
 *
 * ⚠️  PRODUCTION NOTE: ETA requires a valid PKI signature using the taxpayer's
 * registered certificate (typically a USB hardware token issued by ITIDA or
 * another accredited CA). The signature must be a CAdES-BES detached signature
 * over the canonical serialization.
 *
 * For SANDBOX / MVP: we attach the SHA-256 hash as the signature value. The ETA
 * sandbox accepts this for development purposes. Replace the `value` field with
 * the actual CAdES-BES signature before going to production.
 */
export function signDocument(doc: ETADocument, _privateKey?: string): ETADocument {
  const serialized = serializeDocument(doc);
  const hash = hashDocument(serialized);

  return {
    ...doc,
    signatures: [
      {
        signatureType: "I",
        // Sandbox: use hash. Production: replace with CAdES-BES signature.
        value: hash,
      },
    ],
  };
}
