import type {
  JoFotaraClientConfig,
  JoFotaraSubmissionPayload,
  JoFotaraSubmissionResult,
  JoFotaraStatusResult,
} from "./types";

const ENDPOINTS = {
  production: "https://backend.jofotara.gov.jo/core/invoices",
  sandbox: "https://backend.jofotara.gov.jo/core/invoices",
} as const;

export class JoFotaraClient {
  private baseUrl: string;

  constructor(private config: JoFotaraClientConfig) {
    this.baseUrl = ENDPOINTS[config.env];
  }

  private headers(): Record<string, string> {
    return {
      "Client-Id": this.config.clientId,
      "Secret-Key": this.config.secretKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`JoFotara API error ${res.status} ${method} ${path}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  /** Submit a single invoice to JoFotara. */
  async submitInvoice(payload: JoFotaraSubmissionPayload): Promise<JoFotaraSubmissionResult> {
    return this.request<JoFotaraSubmissionResult>("POST", "/", payload);
  }

  /** Get the status of a submitted invoice by its JoFotara UUID. */
  async getInvoiceStatus(uuid: string): Promise<JoFotaraStatusResult> {
    return this.request<JoFotaraStatusResult>("GET", `/${uuid}`);
  }

  /** Cancel a submitted invoice. */
  async cancelInvoice(uuid: string): Promise<void> {
    await this.request<unknown>("PUT", `/${uuid}/cancel`, { status: "1" });
  }
}
