import { prisma } from "./prisma";

export type EmailPrefKey =
  | "jvSubmitted"   // owner: someone submitted a JV for my review
  | "jvApproved"    // accountant: my JV was approved
  | "jvRejected"    // accountant: my JV was rejected
  | "trialWarning"  // trial expiring soon
  | "trialExpired"; // trial has ended

export const EMAIL_PREF_DEFAULTS: Record<EmailPrefKey, boolean> = {
  jvSubmitted: true,
  jvApproved: true,
  jvRejected: true,
  trialWarning: true,
  trialExpired: true,
};

// Returns true if the user has this notification enabled (default: true for all keys).
export async function isEmailEnabled(userId: string, key: EmailPrefKey): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailPreferences: true },
  });
  if (!user) return true;
  const prefs = (user.emailPreferences ?? {}) as Record<string, boolean | undefined>;
  return prefs[key] !== false;
}

// Check prefs by email address instead of userId (used in cron where we only have email).
export async function isEmailEnabledByEmail(email: string, key: EmailPrefKey): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailPreferences: true },
  });
  if (!user) return true;
  const prefs = (user.emailPreferences ?? {}) as Record<string, boolean | undefined>;
  return prefs[key] !== false;
}
