import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getComplianceModule } from "@/compliance";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// جلب ملخص مالي من الـ ledger لإرساله للنموذج كسياق
async function buildFinancialContext(businessId: string): Promise<string> {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const compliance = getComplianceModule(business.country);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // إيرادات ومصروفات الشهر الحالي
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

  // تجميع الأرصدة حسب الحساب
  const balances: Record<string, { name: string; type: string; balance: number }> = {};
  for (const line of monthLines) {
    const key = line.accountId;
    if (!balances[key]) {
      balances[key] = { name: line.account.nameAr ?? line.account.name, type: line.account.type, balance: 0 };
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

  // أحدث 5 قيود
  const recentEntries = await prisma.journalEntry.findMany({
    where: { businessId },
    orderBy: { date: "desc" },
    take: 5,
    include: { lines: { include: { account: true } } },
  });

  // عدد الفواتير
  const invoiceCount = await prisma.invoice.count({ where: { businessId, status: "CONFIRMED" } });

  const fmt = (n: number) => `${n.toLocaleString("ar")} ${compliance.currencySymbol}`;

  const context = `
== البيانات المالية لـ ${business.name} ==
الدولة: ${compliance.countryNameAr} | العملة: ${compliance.currency}
التاريخ: ${now.toLocaleDateString("ar")}

== الشهر الحالي ==
إجمالي الإيرادات: ${fmt(totalRevenue)}
تفاصيل الإيرادات: ${revenue.map((r) => `${r.name}: ${fmt(r.balance)}`).join(" | ") || "لا توجد"}

إجمالي المصروفات: ${fmt(totalExpenses)}
تفاصيل المصروفات: ${expenses.map((e) => `${e.name}: ${fmt(e.balance)}`).join(" | ") || "لا توجد"}

صافي الربح هذا الشهر: ${fmt(totalRevenue - totalExpenses)}

== آخر 5 قيود ==
${recentEntries.map((e) => `- ${new Date(e.date).toLocaleDateString("ar")}: ${e.description}`).join("\n") || "لا توجد قيود"}

عدد الفواتير المؤكدة: ${invoiceCount}
`.trim();

  return context;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// الرد على سؤال مالي بالاعتماد على بيانات الـ ledger الفعلية
export async function chat(params: {
  businessId: string;
  messages: ChatMessage[];
  newMessage: string;
}): Promise<string> {
  const { businessId, messages, newMessage } = params;

  const financialContext = await buildFinancialContext(businessId);

  const systemPrompt = `أنت مساعد محاسبي ذكي متخصص في الإجابة على الأسئلة المالية.
تعمل لدى منشأة تجارية وتمتلك وصولًا كاملًا لبياناتهم المالية الفعلية المقدمة أدناه.

قواعد مهمة:
1. أجب فقط بناءً على البيانات المالية المقدمة، لا تخمّن أو تخترع أرقامًا.
2. إذا لم تجد البيانات الكافية للإجابة، قل ذلك بوضوح.
3. أجب باللغة العربية دائمًا بأسلوب بسيط ومفهوم لأصحاب الأعمال غير المتخصصين.
4. اذكر الأرقام دائمًا مع رمز العملة.
5. إذا كان السؤال خارج نطاق المحاسبة والمالية، اعتذر بأدب.

${financialContext}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: newMessage },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") return "حدث خطأ في المعالجة، يرجى المحاولة مرة أخرى.";
  return content.text;
}
