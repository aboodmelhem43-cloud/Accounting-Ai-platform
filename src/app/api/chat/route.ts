import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { chat } from "@/lib/ai/chatbot";
import { checkAiLimit } from "@/lib/plans";

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  message: z.string().min(1),
  lang: z.enum(["ar", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const limitCheck = await checkAiLimit(session.user.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: "plan_limit",
        reply: limitCheck.limit === 0
          ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار. /pricing"
          : `وصلت للحد الأقصى (${limitCheck.limit} سؤال/شهر). يرجى الترقية. /pricing`,
      }, { status: 403 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    const reply = await chat({
      businessId: session.user.businessId,
      messages: data.messages,
      newMessage: data.message,
      lang: data.lang ?? "ar",
    });

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.constructor.name : "UnknownError";
    console.error("[chat] error type:", name, "| message:", msg);

    const isAuthError = msg.includes("401") || msg.includes("authentication") || msg.includes("API key") || msg.includes("x-api-key") || name === "AuthenticationError";
    const isBillingError = msg.includes("credit balance") || msg.includes("billing") || msg.includes("quota") || msg.includes("insufficient");
    const isDbError = name.includes("Prisma") || msg.includes("Prisma") || msg.startsWith("P2");
    return NextResponse.json({
      error: "server_error",
      reply: isBillingError
        ? "⚠️ رصيد Anthropic API منتهٍ — يرجى إضافة رصيد من لوحة تحكم Anthropic. (Insufficient API credits)"
        : isAuthError
          ? "⚠️ المساعد الذكي غير متاح حالياً — يرجى التواصل مع الدعم. (API key not configured)"
          : isDbError
            ? "⚠️ خطأ في قاعدة البيانات — يرجى التواصل مع الدعم. (DB error)"
            : "عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى بعد قليل.",
    }, { status: 500 });
  }
}
