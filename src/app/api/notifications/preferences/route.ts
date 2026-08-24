import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMAIL_PREF_DEFAULTS, type EmailPrefKey } from "@/lib/email-prefs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailPreferences: true, role: true },
  });

  const stored = (user?.emailPreferences ?? {}) as Record<string, boolean | undefined>;

  // Merge with defaults — missing keys are treated as true
  const prefs: Record<EmailPrefKey, boolean> = { ...EMAIL_PREF_DEFAULTS };
  for (const key of Object.keys(EMAIL_PREF_DEFAULTS) as EmailPrefKey[]) {
    if (stored[key] === false) prefs[key] = false;
  }

  return NextResponse.json({ prefs, role: user?.role ?? session.user.role });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  // Only accept known keys with boolean values
  const updates: Record<string, boolean> = {};
  for (const key of Object.keys(EMAIL_PREF_DEFAULTS) as EmailPrefKey[]) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key] as boolean;
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailPreferences: updates },
  });

  return NextResponse.json({ ok: true });
}
