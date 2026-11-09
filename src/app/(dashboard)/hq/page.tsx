import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import HQClient from "./HQClient";

export default async function HQPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    redirect("/dashboard");
  }
  return <HQClient />;
}
