import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: "register" | "login",
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const isAr = lang === "ar";

  const subject = purpose === "register"
    ? (isAr ? "رمز التحقق لإنشاء حسابك في محاسبي" : "Verify your email — Mohasabai")
    : (isAr ? "رمز التحقق لتسجيل الدخول في محاسبي" : "Your login code — Mohasabai");

  const heading = isAr ? "Mohasabai — منصة المحاسبة الذكية" : "Mohasabai — Smart Accounting";
  const intro = purpose === "register"
    ? (isAr ? "أدخل الرمز التالي لإكمال إنشاء حسابك:" : "Enter this code to complete your registration:")
    : (isAr ? "أدخل الرمز التالي لتسجيل الدخول:" : "Enter this code to sign in:");
  const expiry = isAr ? "هذا الرمز صالح لمدة 10 دقائق فقط." : "This code is valid for 10 minutes.";
  const ignore = isAr
    ? "إذا لم تطلب هذا الرمز، تجاهل هذا البريد."
    : "If you didn't request this, please ignore this email.";

  const html = `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:20px;font-weight:bold">${heading}</div>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:16px;margin:0 0 20px">${intro}</p>
      <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1d4ed8">${code}</span>
      </div>
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px">${expiry}</p>
      <p style="color:#9ca3af;font-size:12px;margin:0">${ignore}</p>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    // في البيئة المحلية بدون مفتاح Resend، اطبع الرمز في الـ console
    console.log(`[OTP] ${email} → ${code} (purpose: ${purpose})`);
    return;
  }

  const result = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (result.error) {
    console.error("[email] Resend error:", JSON.stringify(result.error));
    throw new Error(`Email send failed: ${result.error.message}`);
  }
}

export async function sendInviteEmail(
  email: string,
  inviteUrl: string,
  businessName: string,
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const isAr = lang === "ar";

  const subject = isAr
    ? `دعوة للانضمام إلى ${businessName} على محاسباي`
    : `You're invited to join ${businessName} on Mohasabai`;

  const heading = isAr ? "Mohasabai — منصة المحاسبة الذكية" : "Mohasabai — Smart Accounting";
  const intro = isAr
    ? `تمت دعوتك للانضمام إلى منشأة <strong>${businessName}</strong> على منصة محاسباي.`
    : `You've been invited to join <strong>${businessName}</strong> on Mohasabai.`;
  const btnLabel = isAr ? "قبول الدعوة" : "Accept Invitation";
  const expiry = isAr ? "هذه الدعوة صالحة لمدة 7 أيام." : "This invitation expires in 7 days.";
  const ignore = isAr
    ? "إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد."
    : "If you weren't expecting this invitation, you can safely ignore this email.";

  const html = `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:20px;font-weight:bold">${heading}</div>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:16px;margin:0 0 24px">${intro}</p>
      <a href="${inviteUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:24px">${btnLabel}</a>
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px">${expiry}</p>
      <p style="color:#9ca3af;font-size:12px;margin:0">${ignore}</p>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    console.log(`[INVITE] ${email} → ${inviteUrl}`);
    return;
  }

  const result = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (result.error) {
    console.error("[email] Resend error:", JSON.stringify(result.error));
    throw new Error(`Email send failed: ${result.error.message}`);
  }
}
