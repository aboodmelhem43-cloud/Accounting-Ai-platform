import Anthropic from "@anthropic-ai/sdk";
import type { NormalizedSale } from "@/lib/integrations/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AccountOption {
  id: string;
  code: string;
  name: string;
  nameAr?: string | null;
  type: string;
}

export interface SuggestedSaleLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface SuggestedSaleEntry {
  description: string;
  lines: SuggestedSaleLine[];
}

interface AccountOverrides {
  revenueAccountId?: string | null;
  vatAccountId?: string | null;
  cashAccountId?: string | null;
}

function pickAccount(accounts: AccountOption[], id: string | null | undefined) {
  return id ? accounts.find((a) => a.id === id) : undefined;
}

function findRevenue(accounts: AccountOption[]) {
  return accounts.find(
    (a) =>
      a.type === "REVENUE" &&
      (a.code.startsWith("4") ||
        a.name.toLowerCase().includes("sales") ||
        a.name.toLowerCase().includes("revenue") ||
        a.name.includes("مبيعات") ||
        a.name.includes("إيراد"))
  );
}

function findVat(accounts: AccountOption[]) {
  return accounts.find(
    (a) =>
      a.type === "LIABILITY" &&
      (a.name.toLowerCase().includes("vat") ||
        a.name.toLowerCase().includes("tax payable") ||
        a.name.includes("ضريبة القيمة المضافة") ||
        a.name.includes("ضريبة") ||
        a.code === "2200")
  );
}

function findCash(accounts: AccountOption[], paymentMethod: string) {
  const pm = paymentMethod.toLowerCase();
  if (pm === "cash" || pm === "cod") {
    return accounts.find(
      (a) =>
        a.type === "ASSET" &&
        (a.name.toLowerCase().includes("cash") || a.name.includes("نقدية") || a.code === "1010")
    );
  }
  return accounts.find(
    (a) =>
      a.type === "ASSET" &&
      (a.name.toLowerCase().includes("bank") ||
        a.name.toLowerCase().includes("checking") ||
        a.name.includes("بنك") ||
        a.code.startsWith("11"))
  );
}

// اقتراح قيد يومية من بيانات مبيعة مُعيَّنة
export async function mapSaleToJournalEntry(
  sale: NormalizedSale,
  accounts: AccountOption[],
  currency: string,
  overrides?: AccountOverrides
): Promise<SuggestedSaleEntry> {
  const revenueAcc =
    pickAccount(accounts, overrides?.revenueAccountId) ?? findRevenue(accounts);
  const vatAcc =
    pickAccount(accounts, overrides?.vatAccountId) ?? findVat(accounts);
  const cashAcc =
    pickAccount(accounts, overrides?.cashAccountId) ?? findCash(accounts, sale.paymentMethod);

  // Direct mapping when enough accounts found — no AI call needed
  if (revenueAcc && cashAcc) {
    const lines: SuggestedSaleLine[] = [
      {
        accountId: cashAcc.id,
        accountName: cashAcc.name,
        debit: sale.total,
        credit: 0,
        description: `Sale #${sale.orderNumber}`,
      },
    ];

    if (vatAcc && sale.vatAmount > 0) {
      lines.push({
        accountId: vatAcc.id,
        accountName: vatAcc.name,
        debit: 0,
        credit: sale.vatAmount,
        description: `VAT — sale #${sale.orderNumber}`,
      });
    }

    lines.push({
      accountId: revenueAcc.id,
      accountName: revenueAcc.name,
      debit: 0,
      credit: sale.vatAmount > 0 && vatAcc ? sale.subtotal : sale.total,
      description: `Revenue — sale #${sale.orderNumber}`,
    });

    return {
      description: `Sale #${sale.orderNumber}${sale.customerName ? ` — ${sale.customerName}` : ""}`,
      lines,
    };
  }

  // Fall back to AI when chart of accounts is ambiguous
  const accountsList = accounts
    .map((a) => `${a.id} | ${a.code} | ${a.name}${a.nameAr ? ` (${a.nameAr})` : ""} | ${a.type}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an accounting AI. Map this sale to a balanced double-entry journal entry.

SALE:
- Order #${sale.orderNumber}
- Date: ${sale.occurredAt.toISOString().slice(0, 10)}
- Customer: ${sale.customerName ?? "Unknown"}
- Subtotal: ${sale.subtotal} ${currency}
- VAT: ${sale.vatAmount} ${currency}
- Total: ${sale.total} ${currency}
- Payment: ${sale.paymentMethod}
- Items: ${sale.lineItems.map((i) => `${i.description} ×${i.quantity}`).join(", ")}

CHART OF ACCOUNTS (id | code | name | type):
${accountsList}

Return ONLY valid JSON:
{
  "description": "Sale #... — customer name",
  "lines": [
    { "accountId": "...", "accountName": "...", "debit": 0, "credit": 0, "description": "..." }
  ]
}

Rules:
- Total debits must equal total credits exactly
- Debit the cash/bank asset account for the full total received
- Credit a revenue account for the subtotal (before VAT)
- Credit a VAT/tax liability account for the VAT amount (if VAT > 0)
- Use real account IDs from the list above only`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return a valid JSON journal entry for sale mapping");
  }
  return JSON.parse(jsonMatch[0]) as SuggestedSaleEntry;
}
