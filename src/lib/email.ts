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
    ? (isAr ? "رمز التحقق لإنشاء حسابك في محاسبي" : "Verify your email — MohasabAi")
    : (isAr ? "رمز التحقق لتسجيل الدخول في محاسبي" : "Your login code — MohasabAi");

  const heading = isAr ? "MohasabAi — منصة المحاسبة الذكية" : "MohasabAi — Smart Accounting";
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
    ? `دعوة للانضمام إلى ${businessName} على محاسب اي`
    : `You're invited to join ${businessName} on MohasabAi`;

  const heading = isAr ? "MohasabAi — منصة المحاسبة الذكية" : "MohasabAi — Smart Accounting";
  const intro = isAr
    ? `تمت دعوتك للانضمام إلى منشأة <strong>${businessName}</strong> على منصة محاسب اي.`
    : `You've been invited to join <strong>${businessName}</strong> on MohasabAi.`;
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

// ── JV Workflow Notifications (submit / approve / reject) ────────────────────

function jvEmailWrapper(dir: string, lang: string, body: string) {
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:20px;font-weight:bold">MohasabAi · محاسب اي</div>
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

// ── Trial Lifecycle Emails ────────────────────────────────────────────────────

export async function sendTrialWarningEmail({
  email,
  name,
  daysLeft,
  lang = "ar",
}: {
  email: string;
  name: string;
  daysLeft: number;
  lang?: "ar" | "en";
}): Promise<void> {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const upgradeUrl = `${APP_URL}/pricing`;

  const subject = isAr
    ? `⏳ تبقى ${daysLeft} أيام فقط في تجربتك المجانية — محاسب اي`
    : `⏳ ${daysLeft} days left in your free trial — MohasabAi`;

  const body = isAr ? `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً ${name}،</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      تبقّى <strong>${daysLeft} أيام</strong> فقط على انتهاء تجربتك المجانية في منصة محاسب اي.
      بعد انتهائها لن تتمكن من الوصول إلى بياناتك أو إضافة فواتير جديدة.
    </p>
    <div style="background:#fffbeb;border-right:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:14px;color:#92400e;font-weight:600">لا تفقد بياناتك — اشترك الآن واستمر من حيث توقفت</div>
    </div>
    <a href="${upgradeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px">
      ترقية الحساب الآن
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:0">إذا كان لديك أي سؤال، راسلنا على ${SUPPORT_EMAIL}</p>
  ` : `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">Hi ${name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      You have <strong>${daysLeft} days</strong> left in your MohasabAi free trial.
      After it ends, you won't be able to access your data or add new invoices.
    </p>
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:14px;color:#92400e;font-weight:600">Don't lose your data — subscribe now and pick up where you left off</div>
    </div>
    <a href="${upgradeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px">
      Upgrade Now
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:0">Questions? Email us at ${SUPPORT_EMAIL}</p>
  `;

  const html = jvEmailWrapper(dir, isAr ? "ar" : "en", body);

  if (!resend) {
    console.log(`[TRIAL_WARNING] → ${email} | daysLeft: ${daysLeft}`);
    return;
  }
  const r = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (r.error) console.error("[email] Trial warning error:", r.error);
}

export async function sendTrialExpiredEmail({
  email,
  name,
  lang = "ar",
}: {
  email: string;
  name: string;
  lang?: "ar" | "en";
}): Promise<void> {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const upgradeUrl = `${APP_URL}/pricing`;

  const subject = isAr
    ? `انتهت تجربتك المجانية في محاسب اي`
    : `Your MohasabAi free trial has ended`;

  const body = isAr ? `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً ${name}،</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      انتهت فترة تجربتك المجانية في منصة <strong>محاسب اي</strong>.
      بياناتك محفوظة — فقط قم بالاشتراك لاستعادة الوصول الكامل.
    </p>
    <div style="background:#fef2f2;border-right:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:14px;color:#991b1b;font-weight:600">حسابك موقوف مؤقتاً — اشترك لاستعادة الوصول</div>
    </div>
    <a href="${upgradeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px">
      اشترك الآن
    </a>
    <p style="color:#6b7280;font-size:13px;margin:0 0 8px">خططنا تبدأ من $69/شهر وتشمل جميع الميزات.</p>
    <p style="color:#9ca3af;font-size:12px;margin:0">أي سؤال؟ راسلنا على ${SUPPORT_EMAIL}</p>
  ` : `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">Hi ${name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      Your <strong>MohasabAi</strong> free trial has ended.
      Your data is safe — just subscribe to regain full access.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:14px;color:#991b1b;font-weight:600">Your account is paused — subscribe to restore access</div>
    </div>
    <a href="${upgradeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px">
      Subscribe Now
    </a>
    <p style="color:#6b7280;font-size:13px;margin:0 0 8px">Plans start at $69/month and include all features.</p>
    <p style="color:#9ca3af;font-size:12px;margin:0">Questions? Email us at ${SUPPORT_EMAIL}</p>
  `;

  const html = jvEmailWrapper(dir, isAr ? "ar" : "en", body);

  if (!resend) {
    console.log(`[TRIAL_EXPIRED] → ${email}`);
    return;
  }
  const r = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (r.error) console.error("[email] Trial expired error:", r.error);
}

// ── Invoice Overdue Reminder ─────────────────────────────────────────────────

export async function sendInvoiceOverdueEmail({
  email,
  contactName,
  businessName,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  lang = "ar",
}: {
  email: string;
  contactName: string;
  businessName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  lang?: "ar" | "en";
}): Promise<void> {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const dueDateStr = new Date(dueDate).toLocaleDateString(isAr ? "ar" : "en", {
    year: "numeric", month: "long", day: "numeric",
  });
  const fmtAmount = amount > 0
    ? amount.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency
    : "";

  const subject = isAr
    ? `تذكير: فاتورة متأخرة من ${businessName} — #${invoiceNumber}`
    : `Payment reminder: overdue invoice from ${businessName} — #${invoiceNumber}`;

  const body = isAr ? `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً ${contactName}،</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      نودّ تذكيرك بأن الفاتورة التالية من <strong>${businessName}</strong> قد تجاوزت تاريخ استحقاقها ولم يتم سدادها بعد.
    </p>
    <div style="background:#fef2f2;border-right:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#6b7280">رقم الفاتورة</span>
        <span style="font-size:14px;font-weight:600;color:#374151">#${invoiceNumber}</span>
      </div>
      ${fmtAmount ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#6b7280">المبلغ المستحق</span>
        <span style="font-size:14px;font-weight:600;color:#dc2626">${fmtAmount}</span>
      </div>` : ""}
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:13px;color:#6b7280">تاريخ الاستحقاق</span>
        <span style="font-size:14px;font-weight:600;color:#dc2626">${dueDateStr}</span>
      </div>
    </div>
    <p style="color:#374151;font-size:14px;margin:0 0 20px">
      يرجى التواصل مع <strong>${businessName}</strong> لتسوية هذه الفاتورة في أقرب وقت ممكن.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:0">إذا كنت قد سددت هذه الفاتورة مسبقاً، يرجى تجاهل هذا البريد.</p>
  ` : `
    <p style="color:#374151;font-size:16px;margin:0 0 16px">Dear ${contactName},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      This is a friendly reminder that the following invoice from <strong>${businessName}</strong> is now past due and remains unpaid.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#6b7280">Invoice number</span>
        <span style="font-size:14px;font-weight:600;color:#374151">#${invoiceNumber}</span>
      </div>
      ${fmtAmount ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#6b7280">Amount due</span>
        <span style="font-size:14px;font-weight:600;color:#dc2626">${fmtAmount}</span>
      </div>` : ""}
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:13px;color:#6b7280">Due date</span>
        <span style="font-size:14px;font-weight:600;color:#dc2626">${dueDateStr}</span>
      </div>
    </div>
    <p style="color:#374151;font-size:14px;margin:0 0 20px">
      Please contact <strong>${businessName}</strong> to settle this invoice at your earliest convenience.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:0">If you have already made this payment, please disregard this email.</p>
  `;

  const html = jvEmailWrapper(dir, isAr ? "ar" : "en", body);

  if (!resend) {
    console.log(`[INVOICE_OVERDUE] → ${email} | invoice: ${invoiceNumber}`);
    return;
  }
  const r = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (r.error) console.error("[email] Invoice overdue reminder error:", r.error);
}

// ── Re-engagement Email ───────────────────────────────────────────────────────

export async function sendReEngagementEmail({
  email,
  name,
  businessName,
}: {
  email: string;
  name: string;
  businessName: string;
  lang?: "ar" | "en"; // kept for API compatibility, email is always bilingual
}): Promise<void> {
  const loginUrl = `${APP_URL}/login`;
  const feedbackEmail = SUPPORT_EMAIL;

  const subject = `كيف يمكننا مساعدتك؟ / How can we help you get started? — MohasabAi`;

  // Bilingual email — Arabic section followed by English section
  const body = `
    <!-- Arabic Section -->
    <div dir="rtl" style="margin-bottom:32px;padding-bottom:32px;border-bottom:1px solid #e5e7eb">
      <p style="color:#374151;font-size:16px;margin:0 0 16px">مرحباً ${name}،</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">
        لاحظنا أنك سجّلت في <strong>محاسب اي</strong> ولكنك لم تبدأ باستخدام المنصة بعد،
        ونحن نقدر وقتك ونريد أن نتأكد أنك حصلت على كل ما تحتاجه.
      </p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        هل واجهت أي صعوبة في البدء؟ هل هناك شيء ينقص في المنصة؟
        رأيك يهمنا كثيراً ويساعدنا على التحسين.
      </p>
      <div style="background:#eff6ff;border-right:4px solid #1d4ed8;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:14px;color:#1e40af;font-weight:600;margin-bottom:8px">ما يمكنك فعله في محاسب اي:</div>
        <ul style="color:#374151;font-size:14px;margin:0;padding-right:20px;line-height:2">
          <li>رفع الفواتير وقراءتها تلقائياً بالذكاء الاصطناعي</li>
          <li>تتبع المصروفات والإيرادات بسهولة</li>
          <li>إصدار قوائم مالية احترافية (دخل، ميزانية)</li>
          <li>إدارة العملاء والموردين</li>
        </ul>
      </div>
      <a href="${loginUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:16px">
        ابدأ الآن — مجاناً
      </a>
      <p style="color:#6b7280;font-size:14px;margin:16px 0 8px">
        أو راسلنا مباشرة وأخبرنا ما الذي يمنعك من البدء، وسنساعدك خطوة بخطوة:
      </p>
      <a href="mailto:${feedbackEmail}?subject=ملاحظاتي على محاسب اي — ${encodeURIComponent(businessName)}" style="color:#1d4ed8;font-size:14px;font-weight:600">${feedbackEmail}</a>
      <p style="color:#9ca3af;font-size:12px;margin:20px 0 0">شكراً لثقتك بنا.</p>
    </div>

    <!-- English Section -->
    <div dir="ltr">
      <p style="color:#374151;font-size:16px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">
        We noticed you signed up for <strong>MohasabAi</strong> but haven't had a chance to try it yet.
        We want to make sure you have everything you need to get started.
      </p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        Did you run into any trouble? Is something missing from the platform?
        Your feedback means a lot and helps us improve.
      </p>
      <div style="background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:14px;color:#1e40af;font-weight:600;margin-bottom:8px">What you can do with MohasabAi:</div>
        <ul style="color:#374151;font-size:14px;margin:0;padding-left:20px;line-height:2">
          <li>Upload invoices and have AI extract the data automatically</li>
          <li>Track expenses and revenue with ease</li>
          <li>Generate professional financial reports (P&amp;L, Balance Sheet)</li>
          <li>Manage customers and vendors</li>
        </ul>
      </div>
      <a href="${loginUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:16px">
        Get Started — It's Free
      </a>
      <p style="color:#6b7280;font-size:14px;margin:16px 0 8px">
        Or email us directly and let us know what's holding you back — we'll help you step by step:
      </p>
      <a href="mailto:${feedbackEmail}?subject=Feedback on MohasabAi — ${encodeURIComponent(businessName)}" style="color:#1d4ed8;font-size:14px;font-weight:600">${feedbackEmail}</a>
      <p style="color:#9ca3af;font-size:12px;margin:20px 0 0">Thank you for giving us a try.</p>
    </div>
  `;

  // Use ltr wrapper but content handles its own direction per section
  const html = jvEmailWrapper("ltr", "ar", body);

  if (!resend) {
    console.log(`[RE_ENGAGEMENT] → ${email} | business: ${businessName}`);
    return;
  }
  const r = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (r.error) console.error("[email] Re-engagement error:", r.error);
}
