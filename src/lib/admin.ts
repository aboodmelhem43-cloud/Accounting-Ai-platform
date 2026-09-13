import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { DEFAULT_CHART_OF_ACCOUNTS } from "./accounts";

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

// Creates a minimal admin user+business on first login — no registration required.
export async function ensureAdminAccount(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return;

  // Random password hash — admin always logs in via OTP, not password
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const adminCountry = process.env.ADMIN_COUNTRY ?? "SA";
  const adminCurrency = process.env.ADMIN_CURRENCY ?? "SAR";

  await prisma.business.create({
    data: {
      name: "Platform Admin",
      country: adminCountry,
      baseCurrency: adminCurrency,
      onboardingCompleted: true,
      plan: "BUSINESS",
      users: {
        create: {
          email: email.toLowerCase(),
          passwordHash,
          name: "Admin",
          role: "OWNER",
        },
      },
      accounts: {
        create: DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
          code: a.code,
          name: a.name,
          nameAr: a.nameAr,
          type: a.type,
          isSystem: true,
        })),
      },
    },
  });
}
