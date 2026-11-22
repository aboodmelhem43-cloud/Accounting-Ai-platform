import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { computeIncomeStatement } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;
  if (toParam) to.setHours(23, 59, 59, 999);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية" }, { status: 400 });
  }
  const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > TEN_YEARS_MS) {
    return NextResponse.json({ error: "نطاق التاريخ لا يمكن أن يتجاوز 10 سنوات" }, { status: 400 });
  }

  try {
    const statement = await computeIncomeStatement(token.businessId, from, to);
    return NextResponse.json(statement);
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "";
    const isDbError = name.includes("Prisma") || (err instanceof Error && (err.message.includes("prisma") || /^P\d{4}/.test(err.message)));
    const message = isDbError ? "خطأ في الخادم" : (err instanceof Error ? err.message : "خطأ في الخادم");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
