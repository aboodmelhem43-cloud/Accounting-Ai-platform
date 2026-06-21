import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { chat } from "@/lib/ai/chatbot";

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
    console.error("[chat]", error);
    return NextResponse.json({ error: "فشل في معالجة الرسالة" }, { status: 500 });
  }
}
