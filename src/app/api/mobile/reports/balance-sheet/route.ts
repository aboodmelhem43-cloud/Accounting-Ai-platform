import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { computeBalanceSheet } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const asOfStr = searchParams.get("asOf");
  const asOf = asOfStr ? new Date(asOfStr) : new Date();

  try {
    const result = await computeBalanceSheet(token.businessId, asOf);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
