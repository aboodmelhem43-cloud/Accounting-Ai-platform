import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // صفحات المصادقة — لو مسجّل دخول وجّهه للـ dashboard
  if (pathname === "/login" || pathname === "/register") {
    if (token) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  // الصفحة الرئيسية
  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/dashboard" : "/login", req.url));
  }

  // المسارات المحمية — لو غير مسجّل وجّهه لصفحة الدخول
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
