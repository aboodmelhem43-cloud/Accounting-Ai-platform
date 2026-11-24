import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import SupportWidget from "@/components/SupportWidget";
import PlanBanner from "@/components/PlanBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.onboardingCompleted) redirect("/onboarding");

  const sharedProps = {
    businessName: session.user.businessName,
    country: session.user.country,
    currency: session.user.currency,
    isAdmin: isSuperAdmin(session.user.email),
  };

  return (
    <SessionProviderWrapper session={session}>
      {/* Skip navigation — first focusable element for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        تخطي إلى المحتوى الرئيسي / Skip to main content
      </a>
      <div className="dash flex min-h-screen flex-col md:flex-row bg-[#0f172a]">
        <MobileHeader {...sharedProps} />
        <Sidebar {...sharedProps} />
        <main id="main-content" className="flex-1 overflow-auto flex flex-col bg-[#0f172a]" tabIndex={-1}>
          <PlanBanner />
          <div className="max-w-5xl mx-auto p-4 md:p-6 w-full">{children}</div>
        </main>
      </div>
      <SupportWidget />
    </SessionProviderWrapper>
  );
}
