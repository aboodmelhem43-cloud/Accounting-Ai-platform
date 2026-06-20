import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  message: z.string().min(1),
});

const PLATFORM_GUIDE = `
== دليل منصة محاسبي ==
المنصة تساعد أصحاب الأعمال على:
- رفع الفواتير وقراءتها بالذكاء الاصطناعي (/invoices/upload)
- مراجعة وتأكيد الفواتير (/invoices)
- إنشاء فواتير مبيعات وطباعتها (/invoices/create)
- تسجيل قيود يومية يدوية (/journal/new)
- عرض دفتر اليومية (/journal)
- تقرير الدخل والمصروفات (/reports/income)
- لوحة التحكم مع مخططات بيانية (/dashboard)
- الدردشة المالية مع الذكاء الاصطناعي (/chat)
`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const { messages, message } = parsed.data;

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { name: true, country: true },
  });

  const invoiceCount = await prisma.invoice.count({ where: { businessId: session.user.businessId } });
  const pendingCount = await prisma.invoice.count({ where: { businessId: session.user.businessId, status: "PENDING_REVIEW" } });

  const systemPrompt = `أنت مساعد دعم عملاء ذكي لمنصة "محاسبي" — منصة محاسبة للأعمال الصغيرة.
تتحدث مع صاحب منشأة اسمها "${business?.name}" في ${business?.country}.

مهامك:
1. مساعدة المستخدم في استخدام المنصة وميزاتها
2. الإجابة على أسئلة المحاسبة والمالية بشكل مبسط
3. حل المشاكل التقنية الشائعة

معلومات حساب المستخدم:
- إجمالي الفواتير: ${invoiceCount}
- فواتير تنتظر المراجعة: ${pendingCount}

${PLATFORM_GUIDE}

قواعد:
- أجب بالعربية دائماً بأسلوب ودود ومبسط
- إذا كان المستخدم يواجه مشكلة تقنية لا تستطيع حلها، اقترح عليه التواصل عبر البريد: support@mohasabai.com
- لا تخترع معلومات عن الأرقام المالية التفصيلية (وجّهه لصفحة التقارير أو الدردشة المالية)
- كن إيجابياً ومشجعاً`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
    });

    const content = response.content[0];
    const reply = content.type === "text" ? content.text : "حدث خطأ، يرجى المحاولة مرة أخرى.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[support]", err);
    return NextResponse.json({ error: "فشل الاتصال بالذكاء الاصطناعي" }, { status: 500 });
  }
}
