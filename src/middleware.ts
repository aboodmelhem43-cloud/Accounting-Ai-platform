import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // إعادة توجيه الجذر للـ dashboard
    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // حماية جميع المسارات عدا auth والـ API
  matcher: [
    "/",
    "/dashboard/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/chat/:path*",
    "/journal/:path*",
  ],
};
