import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const OTP_EXPIRY_MINUTES = 10;

// Brute-force protection: track failed attempts per email+purpose in memory.
// After MAX_ATTEMPTS failures the OTP record is deleted and the key is locked
// for LOCKOUT_MS. Resets on successful verification or on a new OTP creation.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const otpAttempts = new Map<string, { attempts: number; lockedUntil: number | null }>();

export function generateOtpCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

// Register auto-login tokens expire in 90 seconds — they travel in a response body
// and must be consumed immediately; a short window limits log-capture risk
const AUTO_LOGIN_EXPIRY_SECONDS = 90;

export async function createOtp(email: string, purpose: string): Promise<string> {
  // Clear any lockout state when a fresh OTP is issued
  otpAttempts.delete(`${email.toLowerCase()}:${purpose}`);
  await prisma.otpCode.deleteMany({ where: { email: email.toLowerCase(), purpose } });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const ttlMs = purpose === "register-autologin"
    ? AUTO_LOGIN_EXPIRY_SECONDS * 1000
    : OTP_EXPIRY_MINUTES * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.otpCode.create({
    data: { email: email.toLowerCase(), code: codeHash, purpose, expiresAt },
  });

  return code;
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
  const key = `${email.toLowerCase()}:${purpose}`;
  const now = Date.now();
  const state = otpAttempts.get(key);

  // Reject immediately while locked out
  if (state?.lockedUntil && now < state.lockedUntil) return false;

  const records = await prisma.otpCode.findMany({
    where: {
      email: email.toLowerCase(),
      purpose,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (records.length === 0) return false;

  const record = records[0];
  const isValid = await bcrypt.compare(code, record.code);

  if (isValid) {
    await prisma.otpCode.delete({ where: { id: record.id } });
    otpAttempts.delete(key);
  } else {
    const newAttempts = (state?.attempts ?? 0) + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      // Delete the OTP and lock the key; further guesses are rejected instantly
      await prisma.otpCode.deleteMany({ where: { email: email.toLowerCase(), purpose } });
      otpAttempts.set(key, { attempts: newAttempts, lockedUntil: now + LOCKOUT_MS });
    } else {
      otpAttempts.set(key, { attempts: newAttempts, lockedUntil: null });
    }
  }
  return isValid;
}
