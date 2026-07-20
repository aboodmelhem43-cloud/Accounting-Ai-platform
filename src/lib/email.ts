import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://mohasabai.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@mohasabai.com";

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

// ── JV Workflow Notifications ────────────────────────────────────────────────

function jvEmailWrapper(dir: string, lang: string, body: string) {
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:20px;font-weight:bold">Mohasabai · محاسباي</div>
    </div>
    <div style="padding:32px">${body}</div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
      ${SUPPORT_EMAIL}
    </div>
  </div>
</body>
</html>`;
}

/** Notify owner when an accountant submits a JV for review */
export async function sendJvSubmittedEmail({
  ownerEmail,
  accountantName,
  entryDescription,
  entryId,
  businessName,
  lang = "ar",
}: {
  ownerEmail: string;
  accountantName: string;
  entryDescription: string;
  entryId: string;
  businessName: string;
  lang?: "ar" | "en";
}): Promise<void> {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const reviewUrl = `${APP_URL}/journal/${entryId}`;

  const subject = isAr
    ? `قيد يومية بانتظار موافقتك — ${businessName}`
    : `Journal entry awaiting your approval — ${businessName}`;

  const body = isAr ? `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً،</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      قدّم <strong>${accountantName}</strong> قيداً يومياً جديداً يحتاج إلى موافقتك قبل ترحيله في دفتر الأستاذ.
    </p>
    <div style="background:#eff6ff;border-right:4px solid #1d4ed8;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">بيان القيد</div>
      <div style="font-size:16px;font-weight:600;color:#1e40af">${entryDescription}</div>
    </div>
    <a href="${reviewUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:20px">
      مراجعة القيد والموافقة
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:0">إذا لم تتوقع هذا الإشعار، تجاهل هذا البريد.</p>
  ` : `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      <strong>${accountantName}</strong> has submitted a journal entry that requires your approval before it can be posted to the ledger.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">Entry description</div>
      <div style="font-size:16px;font-weight:600;color:#1e40af">${entryDescription}</div>
    </div>
    <a href="${reviewUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:20px">
      Review &amp; Approve Entry
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:0">If you weren't expecting this notification, you can safely ignore this email.</p>
  `;

  const html = jvEmailWrapper(dir, isAr ? "ar" : "en", body);

  if (!resend) {
    console.log(`[JV_SUBMITTED] → ${ownerEmail} | entry: ${entryId}`);
    return;
  }
  const result = await resend.emails.send({ from: FROM_EMAIL, to: ownerEmail, subject, html });
  if (result.error) console.error("[email] JV submitted notification error:", result.error);
}

/** Notify accountant when their JV is approved */
export async function sendJvApprovedEmail({
  accountantEmail,
  ownerName,
  entryDescription,
  entryId,
  businessName,
  lang = "ar",
}: {
  accountantEmail: string;
  ownerName: string;
  entryDescription: string;
  entryId: string;
  businessName: string;
  lang?: "ar" | "en";
}): Promise<void> {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const viewUrl = `${APP_URL}/journal/${entryId}`;

  const subject = isAr
    ? `✅ تمت الموافقة على قيدك وترحيله — ${businessName}`
    : `✅ Your journal entry was approved & posted — ${businessName}`;

  const body = isAr ? `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً،</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      وافق <strong>${ownerName}</strong> على قيدك اليومي وتم ترحيله في دفتر الأستاذ.
    </p>
    <div style="background:#f0fdf4;border-right:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">بيان القيد</div>
      <div style="font-size:16px;font-weight:600;color:#15803d">${entryDescription}</div>
    </div>
    <a href="${viewUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">
      عرض القيد
    </a>
  ` : `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      <strong>${ownerName}</strong> has approved your journal entry and it has been posted to the ledger.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">Entry description</div>
      <div style="font-size:16px;font-weight:600;color:#15803d">${entryDescription}</div>
    </div>
    <a href="${viewUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">
      View Entry
    </a>
  `;

  const html = jvEmailWrapper(dir, isAr ? "ar" : "en", body);

  if (!resend) {
    console.log(`[JV_APPROVED] → ${accountantEmail} | entry: ${entryId}`);
    return;
  }
  const result = await resend.emails.send({ from: FROM_EMAIL, to: accountantEmail, subject, html });
  if (result.error) console.error("[email] JV approved notification error:", result.error);
}

/** Notify accountant when their JV is rejected */
export async function sendJvRejectedEmail({
  accountantEmail,
  ownerName,
  entryDescription,
  entryId,
  rejectionReason,
  businessName,
  lang = "ar",
}: {
  accountantEmail: string;
  ownerName: string;
  entryDescription: string;
  entryId: string;
  rejectionReason: string;
  businessName: string;
  lang?: "ar" | "en";
}): Promise<void> {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const editUrl = `${APP_URL}/journal/${entryId}`;

  const subject = isAr
    ? `❌ تم رفض قيدك — ${businessName}`
    : `❌ Your journal entry was rejected — ${businessName}`;

  const body = isAr ? `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً،</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      رفض <strong>${ownerName}</strong> قيدك اليومي. يرجى مراجعة سبب الرفض وتصحيح القيد وإعادة تقديمه.
    </p>
    <div style="background:#fef2f2;border-right:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:16px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">بيان القيد</div>
      <div style="font-size:15px;font-weight:600;color:#374151;margin-bottom:12px">${entryDescription}</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">سبب الرفض</div>
      <div style="font-size:14px;color:#dc2626;font-weight:500">${rejectionReason}</div>
    </div>
    <a href="${editUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">
      تعديل وإعادة التقديم
    </a>
  ` : `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      <strong>${ownerName}</strong> has rejected your journal entry. Please review the reason below, correct the entry, and resubmit.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:16px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">Entry description</div>
      <div style="font-size:15px;font-weight:600;color:#374151;margin-bottom:12px">${entryDescription}</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">Rejection reason</div>
      <div style="font-size:14px;color:#dc2626;font-weight:500">${rejectionReason}</div>
    </div>
    <a href="${editUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">
      Edit &amp; Resubmit
    </a>
  `;

  const html = jvEmailWrapper(dir, isAr ? "ar" : "en", body);

  if (!resend) {
    console.log(`[JV_REJECTED] → ${accountantEmail} | entry: ${entryId} | reason: ${rejectionReason}`);
    return;
  }
  const result = await resend.emails.send({ from: FROM_EMAIL, to: accountantEmail, subject, html });
  if (result.error) console.error("[email] JV rejected notification error:", result.error);
}
