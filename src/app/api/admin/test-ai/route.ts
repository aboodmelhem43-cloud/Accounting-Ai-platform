import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const keyConfigured = !!process.env.ANTHROPIC_API_KEY;

  if (!keyConfigured) {
    return NextResponse.json({ ok: false, step: "env", keyConfigured, error: "ANTHROPIC_API_KEY is not set in Vercel environment variables" });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 20,
      messages: [{ role: "user", content: "Say: OK" }],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "(no text)";
    return NextResponse.json({ ok: true, step: "api_call", keyConfigured, response: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : "UnknownError";
    return NextResponse.json({ ok: false, step: "api_call", keyConfigured, errorType: name, error: msg });
  }
}
