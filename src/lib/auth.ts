import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyOtp } from "./otp";

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
        if (!credentials?.email || !credentials?.password || !credentials?.otp) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { business: true },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        const otpValid = await verifyOtp(credentials.email, credentials.otp, "login");
        if (!otpValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          businessId: user.businessId,
          businessName: user.business.name,
          country: user.business.country,
          currency: user.business.baseCurrency,
          role: user.role,
          onboardingCompleted: user.business.onboardingCompleted,
          plan: user.business.plan,
          trialEndsAt: user.business.trialEndsAt?.toISOString() ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "update") {
        const business = await prisma.business.findUnique({
          where: { id: token.businessId as string },
          select: { onboardingCompleted: true },
        });
        if (business) token.onboardingCompleted = business.onboardingCompleted;
      }
      if (user) {
        const u = user as unknown as { businessId: string; businessName: string; country: string; currency: string; role: string; onboardingCompleted: boolean; plan: string; trialEndsAt: string | null };
        token.businessId = u.businessId;
        token.businessName = u.businessName;
        token.country = u.country;
        token.currency = u.currency;
        token.role = u.role;
        token.onboardingCompleted = u.onboardingCompleted;
        token.plan = u.plan;
        token.trialEndsAt = u.trialEndsAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.businessId = token.businessId as string;
        session.user.businessName = token.businessName as string;
        session.user.country = token.country as string;
        session.user.currency = token.currency as string;
        session.user.role = token.role as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.plan = token.plan as string;
        session.user.trialEndsAt = token.trialEndsAt as string | null;
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
      businessName: string;
      country: string;
      currency: string;
      role: string;
      onboardingCompleted: boolean;
      plan: string;
      trialEndsAt: string | null;
    };
  }
}
