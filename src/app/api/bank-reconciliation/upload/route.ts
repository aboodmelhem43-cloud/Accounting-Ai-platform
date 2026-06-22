import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });

  return { headers, rows };
}

function findColumn(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => k.toLowerCase() === c.toLowerCase());
    if (key && row[key]) return row[key];
  }
  return "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const bankAccountId = formData.get("bankAccountId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
  }

  // التحقق من ملكية حساب البنك
  if (bankAccountId) {
    const bankAcc = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, businessId: session.user.businessId },
    });
    if (!bankAcc) return NextResponse.json({ error: "حساب البنك غير موجود" }, { status: 404 });
  }

  const text = await file.text();
  const { rows } = parseCSV(text);

  // إنشاء كشف الحساب
  const statement = await prisma.bankStatement.create({
    data: {
      businessId: session.user.businessId,
      bankAccountId: bankAccountId || null,
      fileName: file.name,
      transactions: {
        create: rows.map((row) => {
          const dateStr = findColumn(row, ["Date", "date", "التاريخ"]);
          const description = findColumn(row, ["Description", "description", "البيان", "Narration"]);
          const debit = parseFloat(findColumn(row, ["Debit", "debit", "مدين"]) || "0") || 0;
          const credit = parseFloat(findColumn(row, ["Credit", "credit", "دائن"]) || "0") || 0;
          const amount = findColumn(row, ["Amount", "amount", "المبلغ"]);
          const balance = parseFloat(findColumn(row, ["Balance", "balance", "الرصيد"]) || "0") || 0;
          const reference = findColumn(row, ["Reference", "reference", "مرجع", "Ref"]);

          let txAmount = 0;
          let txType = "DEBIT";

          if (amount) {
            txAmount = Math.abs(parseFloat(amount) || 0);
            txType = parseFloat(amount) >= 0 ? "CREDIT" : "DEBIT";
          } else if (credit > 0) {
            txAmount = credit;
            txType = "CREDIT";
          } else {
            txAmount = debit;
            txType = "DEBIT";
          }

          return {
            date: dateStr ? new Date(dateStr) : new Date(),
            description: description || "No description",
            amount: txAmount,
            transactionType: txType,
            balance: balance || null,
            reference: reference || null,
          };
        }),
      },
    },
    include: { transactions: true },
  });

  return NextResponse.json(statement, { status: 201 });
}
