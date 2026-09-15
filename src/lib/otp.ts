import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const MAX_OTP_PER_WINDOW = 3; // حد إنشاء الـ OTP خلال 15 دقيقة

const AUTO_LOGIN_EXPIRY_SECONDS = 90;

export function generateOtpCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

export async function createOtp(email: string, purpose: string): Promise<string> {
  const emailLow = email.toLowerCase();
  const windowStart = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);

  // Reject immediately if there is an active lockout — a locked OTP means the user
  // (or an attacker) has already burned through MAX_ATTEMPTS within the lock window.
  const lockedOtp = await prisma.otpCode.findFirst({
    where: { email: emailLow, purpose, lockedUntil: { gt: new Date() } },
    select: { id: true },
  });
  if (lockedOtp) throw new Error("rate_limited");

  // منع إنشاء أكثر من MAX_OTP_PER_WINDOW خلال 15 دقيقة (مقاومة spam)
  // Count ALL OTPs in the window (including expired ones) so the history is preserved
  // and cannot be reset by triggering more createOtp calls.
  const recentCount = await prisma.otpCode.count({
    where: { email: emailLow, purpose, createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_OTP_PER_WINDOW) {
    throw new Error("rate_limited");
  }

  // Expire (but do NOT delete) existing unlocked OTPs so old codes stop working
  // while the history record is preserved for the rate-limit count above.
  await prisma.otpCode.updateMany({
    where: { email: emailLow, purpose, lockedUntil: null },
    data: { expiresAt: new Date() },
  });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const ttlMs = purpose === "register-autologin"
    ? AUTO_LOGIN_EXPIRY_SECONDS * 1000
    : OTP_EXPIRY_MINUTES * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.otpCode.create({
    data: { email: emailLow, code: codeHash, purpose, expiresAt },
  });

  return code;
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
  const emailLow = email.toLowerCase();

  const record = await prisma.otpCode.findFirst({
    where: { email: emailLow, purpose, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  // تحقق من التأمين المؤقت المخزّن في قاعدة البيانات
  if (record.lockedUntil && record.lockedUntil > new Date()) return false;

  const isValid = await bcrypt.compare(code, record.code);

  if (isValid) {
    await prisma.otpCode.delete({ where: { id: record.id } });
  } else {
    const newAttempts = record.attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      // تأمين مؤقت + حذف الـ OTP لمنع مزيد من المحاولات
      await prisma.otpCode.update({
        where: { id: record.id },
        data: {
          attempts: newAttempts,
          lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        },
      });
    } else {
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: newAttempts },
      });
    }
  }

  return isValid;
}
