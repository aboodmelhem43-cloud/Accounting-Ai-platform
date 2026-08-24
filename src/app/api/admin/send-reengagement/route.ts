import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendReEngagementEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // Find all FREE_TRIAL businesses with zero journal entries and zero invoices
  const inactive = await prisma.business.findMany({
    where: {
      plan: "FREE_TRIAL",
      journalEntries: { none: {} },
      invoices: { none: {} },
    },
    select: {
      id: true,
      name: true,
      users: {
        where: { role: "OWNER" },
        select: { email: true, name: true },
        take: 1,
      },
    },
  });

  // Optional: allow passing specific business IDs to target a subset
  let { ids }: { ids?: string[] } = {};
  try { ({ ids } = await req.json()); } catch { /* no body — send to all inactive */ }

  const targets = ids?.length
    ? inactive.filter((b) => ids!.includes(b.id))
    : inactive;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const biz of targets) {
    const owner = biz.users[0];
    if (!owner) continue;
    try {
      await sendReEngagementEmail({
        email: owner.email,
        name: owner.name ?? owner.email,
        businessName: biz.name,
      });
      sent++;
    } catch (e) {
      failed++;
      errors.push(`${owner.email}: ${e}`);
      console.error(`[re-engagement] failed for ${owner.email}:`, e);
    }
  }

  return NextResponse.json({ ok: true, total: targets.length, sent, failed, errors });
}
