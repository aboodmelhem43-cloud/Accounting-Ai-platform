import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // الصفحة الرئيسية — المسوّق يراها دائماً؛ المسجّل دخول يُوجَّه للداشبورد
  if (pathname === "/") {
    if (token) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  // صفحات المصادقة — لو مسجّل دخول وجّهه للـ dashboard أو الـ onboarding
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      const dest = token.onboardingCompleted ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
