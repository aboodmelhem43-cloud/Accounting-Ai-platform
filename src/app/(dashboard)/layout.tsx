import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

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
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </SessionProviderWrapper>
  );
}
