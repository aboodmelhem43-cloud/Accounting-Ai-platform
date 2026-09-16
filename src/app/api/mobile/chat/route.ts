import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { buildFinancialContext, buildSystemPrompt } from "@/lib/ai/chatbot";
import { checkAiLimit } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(50),
  message: z.string().min(1).max(4000),
  lang: z.enum(["ar", "en"]).optional(),
});

function jsonError(reply: string, status: number) {
  return NextResponse.json({ error: "error", reply }, { status });
}

export async function POST(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return jsonError("غير مصرح", 401);

  try {
    const limitCheck = await checkAiLimit(token.businessId);
    if (!limitCheck.allowed) {
      return jsonError(
        limitCheck.limit === 0
          ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار."
          : `وصلت للحد الأقصى (${limitCheck.limit} سؤال/شهر). يرجى الترقية.`,
        403,
      );
    }

    const body = await req.json();
    const data = schema.parse(body);
    const lang = data.lang ?? "ar";

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonError("⚠️ المساعد الذكي غير متاح حالياً — يرجى التواصل مع الدعم.", 500);
    }

    let financialContext: string;
    try {
      financialContext = await buildFinancialContext(token.businessId);
    } catch {
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

    const businessId = token.businessId;
    const userMessage = data.message;

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        const encoder = new TextEncoder();
        try {
          for await (const event of anthropicStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const chunk = event.delta.text;
              fullText += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          }
        } catch (err) {
          console.error("[mobile/chat] stream error:", err);
          const fallback =
            lang === "ar"
              ? "عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى بعد قليل."
              : "Sorry, a server error occurred. Please try again.";
          if (!fullText) {
            controller.enqueue(encoder.encode(fallback));
            fullText = fallback;
          }
        } finally {
          try {
            await prisma.chatMessage.createMany({
              data: [
                { businessId, role: "user", content: userMessage },
                { businessId, role: "assistant", content: fullText },
              ],
            });
          } catch (dbErr) {
            console.error("[mobile/chat] persistence error:", dbErr);
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
    console.error("[mobile/chat] error:", error);
    return jsonError("عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى بعد قليل.", 500);
  }
}
