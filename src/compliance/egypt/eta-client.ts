import type {
  ETAClientConfig,
  ETADocument,
  ETADocumentStatus,
  ETASubmissionResult,
  ETATokenResponse,
} from "./types";

const ENDPOINTS = {
  production: "https://api.invoicing.eta.gov.eg",
  sandbox: "https://api.preprod.invoicing.eta.gov.eg",
} as const;

const AUTH_ENDPOINTS = {
  production: "https://id.eta.gov.eg/connect/token",
  sandbox: "https://id.preprod.eta.gov.eg/connect/token",
} as const;

interface CachedToken {
  accessToken: string;
  expiresAt: number; // ms epoch
}

export class ETAClient {
  private baseUrl: string;
  private authUrl: string;
  private token: CachedToken | null = null;

  constructor(private config: ETAClientConfig) {
    this.baseUrl = ENDPOINTS[config.env];
    this.authUrl = AUTH_ENDPOINTS[config.env];
  }

  private async authenticate(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.token && Date.now() < this.token.expiresAt - 60_000) {
      return this.token.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const res = await fetch(this.authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ETA auth failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as ETATokenResponse;
    this.token = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return this.token.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.authenticate();

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ETA API error ${res.status} ${method} ${path}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  /** Submit one or more ETA documents. Returns the submission result. */
  async submitDocuments(docs: ETADocument[]): Promise<ETASubmissionResult> {
    return this.request<ETASubmissionResult>(
      "POST",
      "/api/v1/documents/submissions",
      { documents: docs }
    );
  }

  /** Get the status of a submitted document by its ETA UUID. */
  async getDocumentStatus(uuid: string): Promise<{ status: ETADocumentStatus; longId?: string }> {
    return this.request<{ status: ETADocumentStatus; longId?: string }>(
      "GET",
      `/api/v1/documents/${uuid}`
    );
  }

  /** Cancel a previously submitted document. */
  async cancelDocument(uuid: string, reason: string): Promise<void> {
    await this.request<unknown>(
      "PUT",
      `/api/v1/documents/${uuid}/state`,
      { status: "cancelled", reason }
    );
  }
}
