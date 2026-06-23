import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import Sidebar from "@/components/Sidebar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import SupportWidget from "@/components/SupportWidget";
import PlanBanner from "@/components/PlanBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SessionProviderWrapper session={session}>
      <div className="flex min-h-screen">
        <Sidebar
          businessName={session.user.businessName}
          country={session.user.country}
          currency={session.user.currency}
          isAdmin={isSuperAdmin(session.user.email)}
        />
        <main className="flex-1 overflow-auto flex flex-col">
          <PlanBanner />
          <div className="max-w-5xl mx-auto p-6 w-full">{children}</div>
        </main>
      </div>
      <SupportWidget />
    </SessionProviderWrapper>
  );
}
