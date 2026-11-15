import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeBalanceSheet } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const asOfStr = searchParams.get("asOf");
  const asOf = asOfStr ? new Date(asOfStr) : new Date();

  if (isNaN(asOf.getTime())) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }

  try {
    const result = await computeBalanceSheet(session.user.businessId, asOf);
    return NextResponse.json(result);
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "";
    const isDbError = name.includes("Prisma") || (err instanceof Error && (err.message.includes("prisma") || /^P\d{4}/.test(err.message)));
    const message = isDbError ? "خطأ في الخادم" : (err instanceof Error ? err.message : "خطأ في الخادم");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
