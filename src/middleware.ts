import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function buildNonceCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; ");
}

function withNonce(res: ReturnType<typeof NextResponse.next>, csp: string) {
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export async function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildNonceCsp(nonce);

  // Forward nonce to server components via a request header
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);

  const { pathname } = req.nextUrl;

  // Allow public files, SEO routes, invite pages, blog, and marketing pages without auth
  if (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/google") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/invoice") ||
    pathname.startsWith("/blog") ||
    pathname === "/pricing" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password")
  ) {
    return withNonce(NextResponse.next({ request: { headers: reqHeaders } }), csp);
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // الصفحة الرئيسية — المسوّق يراها دائماً؛ المسجّل دخول يُوجَّه للداشبورد
  if (pathname === "/") {
    if (token) return NextResponse.redirect(new URL("/dashboard", req.url));
    return withNonce(NextResponse.next({ request: { headers: reqHeaders } }), csp);
  }

  // صفحات المصادقة — لو مسجّل دخول وجّهه للـ dashboard أو الـ onboarding
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      const dest = token.onboardingCompleted ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return withNonce(NextResponse.next({ request: { headers: reqHeaders } }), csp);
  }

  // المسارات المحمية — لو غير مسجّل وجّهه لصفحة الدخول
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // لو مسجّل دخول ولكن لم يكمل الـ onboarding — وجّهه للمعالج
  if (!token.onboardingCompleted && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // لو أكمل الـ onboarding وحاول فتح صفحته مجددًا
  if (token.onboardingCompleted && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Trial expiry paywall — redirect expired FREE_TRIAL users to /pricing
  // Allow /pricing, /settings, /api/* so they can upgrade or manage account
  const PAYWALL_EXEMPT = ["/pricing", "/settings", "/currency", "/chat", "/onboarding", "/invite"];
  const isPaywallable = !PAYWALL_EXEMPT.some((p) => pathname.startsWith(p));
  if (isPaywallable && token.plan === "FREE_TRIAL" && token.trialEndsAt) {
    const expired = new Date() > new Date(token.trialEndsAt as string);
    if (expired) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }
  }

  return withNonce(NextResponse.next({ request: { headers: reqHeaders } }), csp);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
