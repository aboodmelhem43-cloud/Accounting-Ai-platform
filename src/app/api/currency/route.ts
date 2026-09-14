import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// كاش بسيط في الذاكرة — يُحدَّث كل ساعة
interface RatesCache { rates: Record<string, number>; base: string; ts: number }
let cachedRates: RatesCache | null = null;

const VALID_CURRENCY = /^[A-Z]{3}$/;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? "USD").toUpperCase();

  if (!VALID_CURRENCY.test(base)) {
    return NextResponse.json({ error: "رمز العملة غير صالح" }, { status: 400 });
  }

  // التحقق من الكاش
  const now = Date.now();
  if (cachedRates && cachedRates.base === base && now - cachedRates.ts < 3600 * 1000) {
    return NextResponse.json({ base, rates: cachedRates.rates, cached: true });
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = await res.json() as { rates: Record<string, number> };
    cachedRates = { rates: data.rates, base, ts: now };
    return NextResponse.json({ base, rates: data.rates });
  } catch {
    return NextResponse.json({ error: "فشل في جلب أسعار الصرف" }, { status: 500 });
  }
}
