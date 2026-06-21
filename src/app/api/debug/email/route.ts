import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) return NextResponse.json({ error: "أضف ?to=your@email.com" }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY غير موجود في environment variables" }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject: "اختبار OTP — محاسبي",
      html: "<p>رمز الاختبار: <strong>123456</strong></p>",
    });

    if (result.error) {
      return NextResponse.json({
        ok: false,
        from: fromEmail,
        to,
        resendError: result.error,
        hint: result.error.message?.includes("domain") || result.error.message?.includes("verified")
          ? "Domain not verified. Set FROM_EMAIL=onboarding@resend.dev in Vercel temporarily."
          : "Check Resend dashboard for details.",
      }, { status: 422 });
    }

    return NextResponse.json({ ok: true, from: fromEmail, to, id: result.data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, from: fromEmail }, { status: 500 });
  }
}
