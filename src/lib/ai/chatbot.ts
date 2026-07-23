import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getComplianceModule } from "@/compliance";

async function buildFinancialContext(businessId: string): Promise<string> {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const compliance = getComplianceModule(business.country);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthLines = await prisma.journalLine.findMany({
    where: {
      journalEntry: {
        businessId,
        date: { gte: startOfMonth },
      },
      account: { type: { in: ["REVENUE", "EXPENSE"] } },
    },
    include: { account: true },
  });

  const balances: Record<string, { name: string; nameEn: string; type: string; balance: number }> = {};
  for (const line of monthLines) {
    const key = line.accountId;
    if (!balances[key]) {
      balances[key] = {
        name: line.account.nameAr ?? line.account.name,
        nameEn: line.account.name,
        type: line.account.type,
        balance: 0,
      };
    }
    if (line.account.type === "REVENUE") {
      balances[key].balance += Number(line.credit) - Number(line.debit);
    } else {
      balances[key].balance += Number(line.debit) - Number(line.credit);
    }
  }

  const revenue = Object.values(balances).filter((b) => b.type === "REVENUE");
  const expenses = Object.values(balances).filter((b) => b.type === "EXPENSE");
  const totalRevenue = revenue.reduce((s, b) => s + b.balance, 0);
  const totalExpenses = expenses.reduce((s, b) => s + b.balance, 0);

  const recentEntries = await prisma.journalEntry.findMany({
    where: { businessId },
    orderBy: { date: "desc" },
    take: 5,
    include: { lines: { include: { account: true } } },
  });

  const invoiceCount = await prisma.invoice.count({ where: { businessId, status: "CONFIRMED" } });
  const pendingCount = await prisma.invoice.count({ where: { businessId, status: "PENDING_REVIEW" } });

  const accounts = await prisma.account.findMany({
    where: { businessId },
    orderBy: { code: "asc" },
    select: { code: true, name: true, nameAr: true, type: true },
  });

  const fmt = (n: number) => `${n.toLocaleString()} ${compliance.currency}`;

  return `
== BUSINESS DATA: ${business.name} ==
Country: ${compliance.countryNameEn} | Currency: ${compliance.currency}
Date: ${now.toISOString().split("T")[0]}

== CURRENT MONTH FINANCIALS ==
Total Revenue: ${fmt(totalRevenue)}
Revenue Breakdown: ${revenue.map((r) => `${r.nameEn} (${r.name}): ${fmt(r.balance)}`).join(" | ") || "None"}

Total Expenses: ${fmt(totalExpenses)}
Expense Breakdown: ${expenses.map((e) => `${e.nameEn} (${e.name}): ${fmt(e.balance)}`).join(" | ") || "None"}

Net Profit This Month: ${fmt(totalRevenue - totalExpenses)}

== RECENT JOURNAL ENTRIES (last 5) ==
${recentEntries.map((e) => `- ${new Date(e.date).toISOString().split("T")[0]}: ${e.description}`).join("\n") || "No entries yet"}

== INVOICES ==
Confirmed: ${invoiceCount} | Pending Review: ${pendingCount}

== CHART OF ACCOUNTS ==
${accounts.map((a) => `${a.code} | ${a.name} | ${a.nameAr ?? ""} | ${a.type}`).join("\n")}
`.trim();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chat(params: {
  businessId: string;
  messages: ChatMessage[];
  newMessage: string;
  lang?: "ar" | "en";
}): Promise<string> {
  const { businessId, messages, newMessage, lang = "ar" } = params;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set — API key missing");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let financialContext: string;
  try {
    financialContext = await buildFinancialContext(businessId);
  } catch (err) {
    console.error("[chatbot] buildFinancialContext error:", err);
    financialContext = lang === "ar"
      ? "(تعذّر تحميل البيانات المالية)"
      : "(financial data unavailable)";
  }

  const isAr = lang === "ar";

  const systemPrompt = isAr ? `أنت مساعد مالي ومحاسبي خبير ومتكامل تعمل ضمن منصة "MohasabAi" (محاسب اي) للمحاسبة.

## خبرتك الشاملة تشمل:
- **المحاسبة العامة**: القيد المزدوج، دليل الحسابات، اليومية، الأستاذ، الميزانية، قائمة الدخل، التدفقات النقدية
- **المحاسبة التطبيقية**: تسجيل الفواتير، المصروفات، الإيرادات، الرواتب، القروض، الإهلاك، المخزون
- **التحليل المالي**: نسب السيولة، الربحية، الرفع المالي، نقطة التعادل، تحليل التكاليف
- **الضرائب**: ضريبة القيمة المضافة (VAT)، ضريبة الدخل، الالتزامات الضريبية
- **التمويل**: التخطيط المالي، التدفق النقدي، الميزانية التقديرية، قرارات الاستثمار
- **المحاسبة الإدارية**: تكاليف الإنتاج، التسعير، تحليل الربحية لكل منتج/خدمة
- **المعايير المحاسبية**: IFRS، المعايير المحاسبية للدول العربية
- **استخدام المنصة**: رفع الفواتير، إنشاء القيود، عرض التقارير، المساعد الذكي

## قواعد الإجابة:
1. أجب بالعربية دائماً بأسلوب واضح ومبسط لأصحاب الأعمال
2. للأسئلة عن بيانات المستخدم: استخدم البيانات الفعلية المقدمة أدناه فقط، ولا تخترع أرقاماً
3. للأسئلة العامة في المحاسبة والمالية: أجب من خبرتك الكاملة مع أمثلة عملية
4. اذكر الأرقام دائماً مع رمز العملة
5. قدّم أمثلة بالأرقام عند شرح القيود المحاسبية
6. اذكر كيفية تنفيذ العملية في المنصة عند الاقتضاء
7. إذا كان السؤال خارج نطاق المالية والمحاسبة تماماً، اعتذر بأدب

## بيانات المستخدم الفعلية:
${financialContext}`
  : `You are an expert financial and accounting AI assistant integrated into "MohasabAi" accounting platform.

## Your comprehensive expertise includes:
- **General Accounting**: Double-entry bookkeeping, chart of accounts, journal entries, ledger, balance sheet, income statement, cash flow
- **Applied Accounting**: Recording invoices, expenses, revenue, payroll, loans, depreciation, inventory
- **Financial Analysis**: Liquidity ratios, profitability, leverage, break-even analysis, cost analysis
- **Taxation**: VAT, income tax, zakat, tax compliance for MENA region
- **Finance**: Financial planning, cash flow management, budgeting, investment decisions
- **Management Accounting**: Production costs, pricing strategy, product/service profitability
- **Accounting Standards**: IFRS, local GAAP for Arab countries
- **Platform Usage**: Uploading invoices, creating journal entries, viewing reports, using AI features

## Response Rules:
1. Always respond in clear, simple English suitable for business owners
2. For questions about the user's data: use ONLY the actual data provided below, never invent numbers
3. For general accounting/finance questions: answer from your full expertise with practical examples
4. Always include currency symbol with numbers
5. Provide numbered journal entry examples when explaining accounting concepts
6. Mention how to perform the action in the platform when relevant
7. If the question is completely outside finance/accounting, politely decline

## User's Actual Financial Data:
${financialContext}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: newMessage },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return isAr ? "حدث خطأ في المعالجة، يرجى المحاولة مرة أخرى." : "An error occurred, please try again.";
  }
  return content.text;
}
