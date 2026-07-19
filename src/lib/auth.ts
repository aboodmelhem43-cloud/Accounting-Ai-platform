import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyOtp } from "./otp";
import { isSuperAdmin } from "./admin";

interface ClientBusiness {
  id: string;
  name: string;
  country: string;
  currency: string;
}

function effectiveTrialEnd(trialEndsAt: Date | null, createdAt: Date): Date {
  const fromCreated = new Date(createdAt);
  fromCreated.setDate(fromCreated.getDate() + 35);
  if (!trialEndsAt) return fromCreated;
  return new Date(trialEndsAt) > fromCreated ? new Date(trialEndsAt) : fromCreated;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
        otp: { label: "رمز التحقق", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            business: {
              select: {
                id: true, name: true, country: true, baseCurrency: true,
                onboardingCompleted: true, plan: true, trialEndsAt: true,
                createdAt: true,
              },
            },
            bookkeeperAccesses: {
              where: { status: "ACTIVE" },
              include: {
                business: {
                  select: { id: true, name: true, country: true, baseCurrency: true },
                },
              },
            },
          },
        });

        if (!user) return null;

        // Super-admins always use OTP-only; regular users verify password if supplied
        if (!isSuperAdmin(credentials.email) && credentials.password && credentials.password.trim()) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;
        }

        const otpValid = await verifyOtp(credentials.email, credentials.otp, "login");
        if (!otpValid) return null;

        const trialEnd = effectiveTrialEnd(
          user.business.trialEndsAt ?? null,
          user.business.createdAt,
        );

        const clientBusinesses: ClientBusiness[] = user.bookkeeperAccesses.map((a) => ({
          id: a.business.id,
          name: a.business.name,
          country: a.business.country,
          currency: a.business.baseCurrency,
        }));

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          businessId: user.businessId,
          primaryBusinessId: user.businessId,
          businessName: user.business.name,
          country: user.business.country,
          currency: user.business.baseCurrency,
          role: user.role,
          onboardingCompleted: user.business.onboardingCompleted,
          plan: user.business.plan,
          trialEndsAt: trialEnd.toISOString(),
          clientBusinesses,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        // Business switcher: bookkeeper switches to a client business
        if (session.activeBusinessId) {
          const targetId = session.activeBusinessId as string;
          const primaryId = (token.primaryBusinessId ?? token.businessId) as string;

          // Allow switching to own business or to an active client business
          const isOwn = targetId === primaryId;
          const isClient = (token.clientBusinesses as ClientBusiness[] ?? []).some(
            (b) => b.id === targetId,
          );

          if (isOwn || isClient) {
            const biz = await prisma.business.findUnique({
              where: { id: targetId },
              select: {
                name: true, country: true, baseCurrency: true,
                onboardingCompleted: true, plan: true, trialEndsAt: true, createdAt: true,
              },
            });
            if (biz) {
              // For a client business, look up the client owner's role for context
              let role = token.role as string;
              if (!isOwn) {
                role = "ACCOUNTANT";
              } else {
                // Switching back to own business — restore original role
                const ownUser = await prisma.user.findUnique({
                  where: { id: token.sub as string },
                  select: { role: true },
                });
                if (ownUser) role = ownUser.role;
              }

              const trialEnd = effectiveTrialEnd(biz.trialEndsAt ?? null, biz.createdAt);
              token.businessId = targetId;
              token.businessName = biz.name;
              token.country = biz.country;
              token.currency = biz.baseCurrency;
              token.onboardingCompleted = biz.onboardingCompleted;
              token.plan = biz.plan;
              token.trialEndsAt = trialEnd.toISOString();
              token.role = role;
            }
          }
        } else {
          // Regular profile/session refresh
          const business = await prisma.business.findUnique({
            where: { id: token.businessId as string },
            select: { name: true, country: true, baseCurrency: true, onboardingCompleted: true },
          });
          if (business) {
            token.businessName = business.name;
            token.country = business.country;
            token.currency = business.baseCurrency;
            token.onboardingCompleted = business.onboardingCompleted;
          }
        }
      }
      if (user) {
        const u = user as unknown as {
          businessId: string; primaryBusinessId: string; businessName: string;
          country: string; currency: string; role: string; onboardingCompleted: boolean;
          plan: string; trialEndsAt: string | null; clientBusinesses: ClientBusiness[];
        };
        token.businessId = u.businessId;
        token.primaryBusinessId = u.primaryBusinessId;
        token.businessName = u.businessName;
        token.country = u.country;
        token.currency = u.currency;
        token.role = u.role;
        token.onboardingCompleted = u.onboardingCompleted;
        token.plan = u.plan;
        token.trialEndsAt = u.trialEndsAt;
        token.clientBusinesses = u.clientBusinesses;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.businessId = token.businessId as string;
        session.user.primaryBusinessId = token.primaryBusinessId as string;
        session.user.businessName = token.businessName as string;
        session.user.country = token.country as string;
        session.user.currency = token.currency as string;
        session.user.role = token.role as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.plan = token.plan as string;
        session.user.trialEndsAt = token.trialEndsAt as string | null;
        session.user.clientBusinesses = (token.clientBusinesses ?? []) as ClientBusiness[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      businessId: string;
      primaryBusinessId: string;
      businessName: string;
      country: string;
      currency: string;
      role: string;
      onboardingCompleted: boolean;
      plan: string;
      trialEndsAt: string | null;
      clientBusinesses: ClientBusiness[];
    };
  }
}
