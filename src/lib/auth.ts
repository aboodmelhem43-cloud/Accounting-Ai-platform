import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { business: true },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          businessId: user.businessId,
          businessName: user.business.name,
          country: user.business.country,
          currency: user.business.baseCurrency,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { businessId: string; businessName: string; country: string; currency: string; role: string };
        token.businessId = u.businessId;
        token.businessName = u.businessName;
        token.country = u.country;
        token.currency = u.currency;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.businessId = token.businessId as string;
        session.user.businessName = token.businessName as string;
        session.user.country = token.country as string;
        session.user.currency = token.currency as string;
        session.user.role = token.role as string;
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

// توسعة session type
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
    };
  }
}
