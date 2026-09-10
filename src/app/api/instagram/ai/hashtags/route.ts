import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  caption: z.string().min(1).max(2200),
  niche:   z.string().max(100).optional().default(""),
  lang:    z.enum(["ar", "en"]).optional().default("ar"),
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

  const { caption, niche, lang } = parsed.data;

  const prompt = lang === "ar"
    ? `بناءً على التسمية التالية${niche ? ` ومجال "${niche}"` : ""}، اقترح هاشتاقات إنستغرام مقسّمة إلى ثلاثة مستويات.
التسمية: ${caption}

أجب فقط بـ JSON بهذا الشكل الدقيق:
{
  "broad": ["هاشتاق1", "هاشتاق2", "هاشتاق3", "هاشتاق4", "هاشتاق5"],
  "niche": ["هاشتاق1", "هاشتاق2", "هاشتاق3", "هاشتاق4", "هاشتاق5", "هاشتاق6", "هاشتاق7", "هاشتاق8", "هاشتاق9", "هاشتاق10"],
  "branded": ["هاشتاق1", "هاشتاق2", "هاشتاق3", "هاشتاق4", "هاشتاق5"]
}
broad: 5 هاشتاقات بانتشار واسع (+1M منشور)
niche: 10 هاشتاقات متوسطة (50K-500K منشور)
branded: 5 هاشتاقات محددة ومتخصصة
بدون رمز # وبدون أي نص خارج JSON.`
    : `Based on this caption${niche ? ` and niche "${niche}"` : ""}, suggest Instagram hashtags in three tiers.
Caption: ${caption}

Reply ONLY with JSON in this exact format:
{
  "broad": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "niche": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "branded": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
broad: 5 high-reach tags (1M+ posts)
niche: 10 mid-range tags (50K-500K posts)
branded: 5 low-volume/specific tags
No # symbol, no text outside the JSON.`;

  const response = await client.messages.create({
    model:      "claude-opus-4-8",
    max_tokens: 400,
    messages:   [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  try {
    // Strip any markdown code fences if present
    const clean = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
    const data = JSON.parse(clean) as { broad: string[]; niche: string[]; branded: string[] };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "parse_error", raw: text }, { status: 500 });
  }
}
