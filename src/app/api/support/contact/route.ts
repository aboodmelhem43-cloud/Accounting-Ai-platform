import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

const schema = z.object({
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(3000),
});

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@mohasabai.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@mohasabai.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { subject, message } = parsed.data;
  const userName = session.user.name ?? session.user.email;
  const userEmail = session.user.email;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[support/contact] RESEND_API_KEY not set");
    return NextResponse.json({ error: "email_not_configured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  // Email to support team
  const supportHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:18px;font-weight:bold">📬 رسالة دعم جديدة — MohasabAi</div>
    </div>
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px">المرسل:</td><td style="padding:8px 0;color:#111827;font-weight:600">${userName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">البريد:</td><td style="padding:8px 0;color:#1d4ed8"><a href="mailto:${userEmail}" style="color:#1d4ed8">${userEmail}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">الموضوع:</td><td style="padding:8px 0;color:#111827;font-weight:600">${subject}</td></tr>
      </table>
      <div style="background:#f9fafb;border-right:4px solid #1d4ed8;border-radius:4px;padding:16px;margin-bottom:24px">
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
      <a href="mailto:${userEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600">
        ↩ الرد على المستخدم
      </a>
    </div>
  </div>
</body>
</html>`;

  // Confirmation email to user
  const confirmHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:18px;font-weight:bold">MohasabAi — منصة المحاسبة الذكية</div>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:16px;margin:0 0 12px">مرحباً ${userName}،</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        تلقّينا رسالتك بنجاح وسيتواصل معك فريق الدعم خلال <strong>24 ساعة</strong>.
      </p>
      <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#6b7280;font-size:13px;margin:0 0 6px">موضوع الرسالة:</p>
        <p style="color:#1d4ed8;font-weight:600;font-size:15px;margin:0">${subject}</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin:0">
        إذا كان استفساركم عاجلاً، يمكنكم التواصل مباشرة على
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#1d4ed8">${SUPPORT_EMAIL}</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">MohasabAi · www.mohasabai.com</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const [supportResult, confirmResult] = await Promise.all([
      resend.emails.send({
        from: FROM_EMAIL,
        to: SUPPORT_EMAIL,
        replyTo: userEmail,
        subject: `[دعم] ${subject} — من ${userName}`,
        html: supportHtml,
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: `تم استلام رسالتك — ${subject}`,
        html: confirmHtml,
      }),
    ]);

    if (supportResult.error) {
      console.error("[support/contact] support email error:", supportResult.error);
      return NextResponse.json({ error: "send_failed" }, { status: 500 });
    }
    if (confirmResult.error) {
      // Non-fatal: log but don't fail — the main ticket was sent
      console.warn("[support/contact] confirmation email error:", confirmResult.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[support/contact]", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
