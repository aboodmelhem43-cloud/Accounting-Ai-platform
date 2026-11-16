"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Session } from "next-auth";

function SessionExpiredRedirect() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect from protected (dashboard) pages, not from /login itself
    if (status === "unauthenticated" && !pathname.startsWith("/login") && !pathname.startsWith("/register") && !pathname.startsWith("/forgot-password") && !pathname.startsWith("/reset-password") && !pathname.startsWith("/blog")) {
      router.push("/login?expired=1");
    }
  }, [status, pathname, router]);

  return null;
}

export default function SessionProviderWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <SessionExpiredRedirect />
      {children}
    </SessionProvider>
  );
}
