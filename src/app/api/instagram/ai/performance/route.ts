import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { summary, topPosts, avgEngagementByDow } = await req.json();

  const prompt = `أنت محلل تسويق رقمي متخصص في إنستغرام. حلل بيانات الأداء التالية وقدم توصيات عملية قابلة للتنفيذ.

بيانات الأداء:
- إجمالي المنشورات: ${summary.totalPublished}
- المنشورات التي لديها بيانات: ${summary.withInsights}
- الوصول الكلي: ${summary.totalReach}
- التفاعل الكلي: ${summary.totalEngagement}
- معدل التفاعل المتوسط: ${summary.avgEngagementRate}%
- الانطباعات: ${summary.totalImpressions}
- المحفوظات: ${summary.totalSaved}

أفضل أيام النشر (مؤشر التفاعل لكل يوم، الأحد=0):
${avgEngagementByDow.map((v: number, i: number) => {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return `${days[i]}: ${v}`;
}).join(", ")}

أفضل 3 منشورات:
${topPosts.slice(0, 3).map((p: { caption?: string; engagement: number; reach: number; engagementRate: number }, i: number) =>
  `${i + 1}. التفاعل: ${p.engagement} | الوصول: ${p.reach} | معدل التفاعل: ${p.engagementRate}% | الوصف: ${p.caption?.slice(0, 80) || "بدون وصف"}`
).join("\n")}

قدم تحليلاً موجزاً (200-300 كلمة) يشمل:
1. ملخص الأداء الحالي
2. أفضل وقت للنشر بناءً على البيانات
3. ثلاثة توصيات محددة لتحسين التفاعل
4. ما الذي يميز المنشورات الأفضل أداءً

اكتب باللغة العربية بأسلوب مهني وواضح.`;

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
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
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
