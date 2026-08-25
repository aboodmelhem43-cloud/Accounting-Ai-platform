import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { buildFinancialContext, buildSystemPrompt } from "@/lib/ai/chatbot";
import { checkAiLimit } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

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

function jsonError(reply: string, status: number) {
  return NextResponse.json({ error: "error", reply }, { status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return jsonError("غير مصرح", 401);

  try {
    const limitCheck = await checkAiLimit(session.user.businessId);
    if (!limitCheck.allowed) {
      return jsonError(
        limitCheck.limit === 0
          ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار. /pricing"
          : `وصلت للحد الأقصى (${limitCheck.limit} سؤال/شهر). يرجى الترقية. /pricing`,
        403
      );
    }

    const body = await req.json();
    const data = schema.parse(body);
    const lang = data.lang ?? "ar";

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonError("⚠️ المساعد الذكي غير متاح حالياً — يرجى التواصل مع الدعم. (API key not configured)", 500);
    }

    let financialContext: string;
    try {
      financialContext = await buildFinancialContext(session.user.businessId);
    } catch (err) {
      console.error("[chat] buildFinancialContext error:", err);
      financialContext = lang === "ar" ? "(تعذّر تحميل البيانات المالية)" : "(financial data unavailable)";
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const systemPrompt = buildSystemPrompt(financialContext, lang);
    const claudeMessages: Anthropic.MessageParam[] = [
      ...data.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: data.message },
    ];

    const anthropicStream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const businessId = session.user.businessId;
    const userMessage = data.message;

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        const encoder = new TextEncoder();
        try {
          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = event.delta.text;
              fullText += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          }
        } catch (err) {
          console.error("[chat] stream error:", err);
          const fallback = lang === "ar"
            ? "عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى بعد قليل."
            : "Sorry, a server error occurred. Please try again.";
          if (!fullText) {
            controller.enqueue(encoder.encode(fallback));
            fullText = fallback;
          }
        } finally {
          // Persist both messages after streaming completes
          try {
            await prisma.chatMessage.createMany({
              data: [
                { businessId, role: "user", content: userMessage },
                { businessId, role: "assistant", content: fullText },
              ],
            });
          } catch (dbErr) {
            console.error("[chat] persistence error:", dbErr);
          }
          controller.close();
        }
      },
      cancel() {
        anthropicStream.abort();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    const msg = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.constructor.name : "UnknownError";
    console.error("[chat] error type:", name, "| message:", msg);

    const isAuthError = msg.includes("401") || msg.includes("authentication") || msg.includes("API key") || msg.includes("x-api-key") || name === "AuthenticationError";
    const isBillingError = msg.includes("credit balance") || msg.includes("billing") || msg.includes("quota") || msg.includes("insufficient");
    const isDbError = name.includes("Prisma") || msg.includes("Prisma") || msg.startsWith("P2");

    return jsonError(
      isBillingError
        ? "⚠️ رصيد Anthropic API منتهٍ — يرجى إضافة رصيد من لوحة تحكم Anthropic. (Insufficient API credits)"
        : isAuthError
          ? "⚠️ المساعد الذكي غير متاح حالياً — يرجى التواصل مع الدعم. (API key not configured)"
          : isDbError
            ? "⚠️ خطأ في قاعدة البيانات — يرجى التواصل مع الدعم. (DB error)"
            : "عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى بعد قليل.",
      500
    );
  }
}
