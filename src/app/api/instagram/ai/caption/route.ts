import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  brief: z.string().min(5).max(800),
  tone:  z.enum(["professional", "casual", "witty", "promotional"]),
  lang:  z.enum(["ar", "en"]).optional().default("ar"),
});

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { brief, tone, lang } = parsed.data;

  const toneGuide: Record<string, string> = {
    professional: lang === "ar" ? "احترافي وموضوعي" : "professional and authoritative",
    casual:       lang === "ar" ? "ودود وعفوي مع إيموجي" : "friendly and conversational, include emojis",
    witty:        lang === "ar" ? "طريف وخفيف مع لمسة من الفكاهة" : "witty with a touch of humor",
    promotional:  lang === "ar" ? "تسويقي مشوّق يحثّ على الشراء" : "promotional and persuasive, strong CTA",
  };

  const systemPrompt = lang === "ar"
    ? `أنت كاتب محتوى محترف لوسائل التواصل الاجتماعي. اكتب تسمية توضيحية لمنشور إنستغرام باللغة العربية.
الأسلوب المطلوب: ${toneGuide[tone]}.
القواعد:
- لا تتجاوز 2200 حرف
- لا تضع هاشتاقات داخل التسمية
- اختم بدعوة واضحة للتفاعل أو الشراء
- لا تستخدم إيموجي إلا إذا كان الأسلوب ودوداً أو طريفاً`
    : `You are a professional social media copywriter. Write an Instagram caption in English.
Tone: ${toneGuide[tone]}.
Rules:
- Stay under 2,200 characters
- No hashtags in the caption body
- End with a clear call-to-action
- Use emojis only for casual or witty tone`;

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      { role: "user", content: lang === "ar" ? `الموضوع: ${brief}` : `Brief: ${brief}` },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
