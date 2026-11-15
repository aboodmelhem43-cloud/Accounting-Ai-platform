import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeCashFlow } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const now = new Date();
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toStr ? new Date(toStr) : now;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية" }, { status: 400 });
  }
  const MAX_RANGE_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > MAX_RANGE_MS) {
    return NextResponse.json({ error: "نطاق التاريخ يتجاوز الحد الأقصى (10 سنوات)" }, { status: 400 });
  }

  try {
    const result = await computeCashFlow(session.user.businessId, from, to);
    return NextResponse.json(result);
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "";
    const isDbError = name.includes("Prisma") || (err instanceof Error && (err.message.includes("prisma") || /^P\d{4}/.test(err.message)));
    const message = isDbError ? "خطأ في الخادم" : (err instanceof Error ? err.message : "خطأ في الخادم");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
