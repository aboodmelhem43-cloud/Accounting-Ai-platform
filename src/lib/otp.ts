import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const OTP_EXPIRY_MINUTES = 10;

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(email: string, purpose: string): Promise<string> {
  await prisma.otpCode.deleteMany({ where: { email: email.toLowerCase(), purpose } });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { email: email.toLowerCase(), code: codeHash, purpose, expiresAt },
  });

  return code;
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
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
  }

  return isValid;
}
