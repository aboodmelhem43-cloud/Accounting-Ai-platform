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

  try {
    const result = await computeCashFlow(session.user.businessId, from, to);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
