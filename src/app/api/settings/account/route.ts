import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  password: z.string().min(1, "Password required"),
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

// DELETE — permanently deletes the user's account and all associated business data.
// Only the business OWNER can initiate this. Requires current password + typed confirmation.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "مسموح لصاحب الحساب فقط" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return NextResponse.json({ error: "wrong_password" }, { status: 400 });

  // Delete the business — Prisma cascades handle all child records (invoices,
  // journal entries, contacts, accounts, etc.) via onDelete: Cascade in the schema.
  // The user record is also deleted via the cascade from Business → User.
  await prisma.business.delete({ where: { id: session.user.businessId } });

  return NextResponse.json({ ok: true, deleted: true });
}
