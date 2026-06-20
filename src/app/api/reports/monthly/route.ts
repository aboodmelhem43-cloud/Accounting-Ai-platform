import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeIncomeStatement } from "@/lib/ledger";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { businessId } = session.user;
  const now = new Date();

  // بناء مصفوفة آخر 6 أشهر
  const months = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i; // من الأقدم إلى الأحدث
    const year = now.getMonth() - offset < 0
      ? now.getFullYear() - 1
      : now.getFullYear();
    const month = ((now.getMonth() - offset) % 12 + 12) % 12;
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59);
    return { from, to, month, year };
  });

  const statements = await Promise.all(
    months.map(({ from, to }) => computeIncomeStatement(businessId, from, to))
  );

  const result = statements.map((stmt, i) => ({
    month: MONTHS_AR[months[i].month],
    monthEn: MONTHS_EN[months[i].month],
    revenue: stmt.totalRevenue,
    expenses: stmt.totalExpenses,
    net: stmt.netProfit,
  }));

  return NextResponse.json(result);
}
