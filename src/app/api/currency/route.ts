import { NextRequest, NextResponse } from "next/server";

// كاش بسيط في الذاكرة — يُحدَّث كل ساعة
interface RatesCache { rates: Record<string, number>; base: string; ts: number }
let cachedRates: RatesCache | null = null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? "USD").toUpperCase();

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
