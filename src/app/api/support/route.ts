import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(30),
  message: z.string().min(1).max(2000),
  lang: z.enum(["ar", "en"]).default("ar"),
});

const PLATFORM_KNOWLEDGE = `
== MohasabAi Platform — Full Feature Guide ==

NAVIGATION & PAGES:
- /dashboard — Overview: revenue chart, recent invoices, quick stats
- /invoices — Invoice list (all uploaded & created invoices)
- /invoices/upload — Upload invoice image or PDF; AI extracts data automatically
- /invoices/create — Create a sales invoice manually and print/download it
- /journal — Journal entry list (double-entry ledger)
- /journal/new — Create a manual journal entry (debit + credit lines must balance)
- /accounts — Chart of Accounts (add/edit account codes, types: ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE)
- /reports — Reports hub
- /reports/income — Income Statement (Profit & Loss)
- /reports/balance-sheet — Balance Sheet
- /reports/trial-balance — Trial Balance
- /reports/ledger — General Ledger (per account)
- /reports/cashflow — Cash Flow Statement
- /reports/aging — Accounts Receivable Aging
- /bank-accounts — Manage bank accounts (add name, bank, IBAN, opening balance)
- /bank-reconciliation — Upload bank statement CSV/Excel; match transactions to journal entries
- /contacts — Customers and vendors (CUSTOMER / VENDOR types)
- /currency — Currency converter (live exchange rates)
- /chat — AI financial assistant (ask financial questions, get analysis, ask about your own data)
- /settings — Business profile, personal profile, password change
- /settings/team — Team management (invite accountants, manage seats)
- /settings/clients — Practice Clients page (for accounting firms managing multiple clients)
- /pricing — Subscription plans and upgrade

SUBSCRIPTION PLANS:
- FREE_TRIAL: 35-day free trial, all features, 1 user
- STARTER ($69/mo): Unlimited invoices, 1 user, all core features
- PRO ($149/mo): Everything in Starter + 3 team users + priority support email
- BUSINESS ($199/mo): Everything in Pro + 10 team users + VIP WhatsApp/email support

TEAM MANAGEMENT (PRO & BUSINESS plans):
- Owner can invite accountants via email from /settings/team
- Invited users set their own password via the invite link
- PRO: up to 3 total users. BUSINESS: up to 10 total users
- External Bookkeepers section: invite external accountants who access via their own login (no seat used)

PRACTICE / ACCOUNTING FIRM MODEL (like Xero):
- Create a main practice account (your firm)
- Add client businesses from /settings/clients — each client is fully isolated with its own data and subscription
- Switch between clients using the sidebar dropdown — all your staff see all clients
- Each client has their own independent subscription and billing
- Works like Xero Practice Manager

BOOKKEEPER ACCESS (individual):
- From /settings/team → "External Bookkeepers" section
- Send an invite to an external bookkeeper's email
- They accept via their own login — no seat is consumed
- They see your business in their sidebar switcher
- You can revoke access anytime

AI FEATURES:
- Invoice OCR: upload a photo or PDF of a purchase/sales invoice → AI extracts: vendor, date, amount, tax, line items → you review and confirm → journal entry is auto-created
- Financial Chat (/chat): ask "what were my expenses last month?" or "which customer owes the most?" → AI queries your actual data and answers
- Support AI (this widget): answers how-to questions and guides you through the platform

HOW TO DO COMMON TASKS:
- Upload invoice: /invoices/upload → choose file → AI reads it → review screen → confirm → entry posted
- Create journal entry: /journal/new → pick date + description → add lines (at least one debit, one credit, must balance) → save
- Add a bank account: /bank-accounts → "Add Account" → fill name, bank, IBAN, opening balance
- Reconcile bank statement: /bank-reconciliation → upload CSV from bank → match each transaction to a journal entry or create new ones
- Add a contact: /contacts → "New Contact" → choose Customer or Vendor → fill details
- View income report: /reports/income → select date range → see revenue vs expenses vs net profit
- Print an invoice: /invoices/create → fill form → "Preview & Print" button
- Change business info: /settings → "Business" tab → edit name, country, tax number → save
- Change password: /settings → "Security" tab
- Upgrade plan: /pricing → choose plan → checkout
- Cancel subscription: /settings (for Lemon Squeezy managed subscriptions)

COMMON ISSUES & SOLUTIONS:
- "AI didn't read my invoice correctly" → Go back to /invoices, find the invoice, click Edit, correct the extracted data manually, then confirm
- "Journal entry is unbalanced" → Total debits must equal total credits. Check that you haven't missed a line
- "Can't see team members option" → Team management requires PRO or BUSINESS plan. Upgrade from /pricing
- "Forgot password" → On the login page, request a new OTP via your email (passwordless login is also supported)
- "How to delete an account from Chart of Accounts" → System accounts (is_system=true) cannot be deleted. Custom accounts can be deleted if they have no journal lines
- "Bank statement upload failed" → Ensure the file is CSV format. Most banks let you export CSV from internet banking
- "Report shows wrong numbers" → All reports pull from journal entries. Check that your entries have the correct account codes and dates

BILLING & SUBSCRIPTIONS:
- Billing is handled via Lemon Squeezy (card payments)
- To upgrade: /pricing → choose plan → Lemon Squeezy checkout → automatic activation
- Subscription renews monthly automatically
- To cancel: contact support or manage via Lemon Squeezy customer portal
- Trial is 35 days from registration date

SUPPORTED COUNTRIES: Egypt (EGP), Saudi Arabia (SAR), UAE (AED), Jordan (JOD), Kuwait (KWD), Bahrain (BHD), Qatar (QAR), Oman (OMR)

DOUBLE-ENTRY ACCOUNTING BASICS (for users who are not accountants):
- Every transaction must have equal debits and credits
- Common accounts: Cash (ASSET), Accounts Receivable (ASSET), Accounts Payable (LIABILITY), Revenue (REVENUE), Salaries Expense (EXPENSE)
- Example — recording a sale: Debit Accounts Receivable, Credit Revenue
- Example — paying rent: Debit Rent Expense, Credit Cash
`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { messages, message, lang } = parsed.data;

  const [business, invoiceCount, pendingCount, entryCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: { name: true, country: true, plan: true },
    }),
    prisma.invoice.count({ where: { businessId: session.user.businessId } }),
    prisma.invoice.count({ where: { businessId: session.user.businessId, status: "PENDING_REVIEW" } }),
    prisma.journalEntry.count({ where: { businessId: session.user.businessId } }),
  ]);

  const systemPrompt = lang === "ar"
    ? `أنت مساعد دعم ذكي لمنصة "MohasabAi" — منصة محاسبة للأعمال الصغيرة. متاح 24/7.
تتحدث مع "${session.user.name ?? session.user.email}" — صاحب منشأة "${business?.name}" في ${business?.country}، خطة: ${business?.plan ?? "FREE_TRIAL"}.

إحصائيات الحساب:
- إجمالي الفواتير: ${invoiceCount} | تنتظر المراجعة: ${pendingCount}
- إجمالي قيود اليومية: ${entryCount}

${PLATFORM_KNOWLEDGE}

قواعد الرد:
- أجب دائماً بالعربية بأسلوب ودود ومبسط
- إذا ذكرت صفحة، اذكر المسار بين قوسين هكذا: [/invoices]
- إذا كانت المشكلة تقنية ولا يمكن حلها هنا، وجّه المستخدم لإرسال بريد عبر تبويب "راسلنا" أو على support@mohasabai.com
- لا تخترع أرقاماً مالية تفصيلية — وجّه لصفحة التقارير
- كن موجزاً: أجب في 2-4 جمل ما لم يطلب تفصيلاً أكثر`
    : `You are an intelligent 24/7 support assistant for "MohasabAi" — a small business accounting platform.
You are talking with "${session.user.name ?? session.user.email}" — owner of "${business?.name}" in ${business?.country}, plan: ${business?.plan ?? "FREE_TRIAL"}.

Account stats:
- Total invoices: ${invoiceCount} | Pending review: ${pendingCount}
- Total journal entries: ${entryCount}

${PLATFORM_KNOWLEDGE}

Response rules:
- Always reply in English in a friendly, clear tone
- When mentioning a page, include its path in brackets like: [/invoices]
- If the issue is technical and can't be resolved here, suggest emailing support@mohasabai.com or using the "Email Us" tab
- Don't fabricate detailed financial figures — direct to the reports pages
- Be concise: 2-4 sentences unless more detail is asked`;

  // Stream the response
  const stream = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    stream: true,
    system: systemPrompt,
    messages: [
      ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
      } catch (err) {
        console.error("[support stream]", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
