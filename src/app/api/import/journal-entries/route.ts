import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Expected CSV columns:
// Date, Description, AccountCode (or Account Code), Debit, Credit
// One row per journal line. Rows sharing the same date+description form one entry.

interface RawLine {
  date: string;
  description: string;
  accountCode: string;
  debit: number;
  credit: number;
}

interface EntryGroup {
  date: Date;
  description: string;
  lines: { accountCode: string; debit: number; credit: number }[];
  balanced: boolean;
  totalDebit: number;
  totalCredit: number;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").replace(/^"|"$/g, "").trim(); });
    return row;
  });
}

function col(row: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== "") return row[c];
  }
  return "";
}

function parseRawLines(rows: Record<string, string>[]): RawLine[] {
  return rows.map((row) => ({
    date: col(row, "date", "التاريخ"),
    description: col(row, "description", "البيان", "narration", "memo"),
    accountCode: col(row, "account code", "accountcode", "account", "code", "رمز الحساب", "كود الحساب"),
    debit: Math.abs(parseFloat(col(row, "debit", "مدين", "dr")) || 0),
    credit: Math.abs(parseFloat(col(row, "credit", "دائن", "cr")) || 0),
  })).filter((r) => r.date && r.accountCode && (r.debit > 0 || r.credit > 0));
}

function groupIntoEntries(rawLines: RawLine[]): EntryGroup[] {
  // Group rows that share date+description into one journal entry
  const map = new Map<string, EntryGroup>();
  for (const raw of rawLines) {
    const key = `${raw.date}||${raw.description}`;
    if (!map.has(key)) {
      map.set(key, {
        date: new Date(raw.date),
        description: raw.description || "Imported entry",
        lines: [],
        balanced: false,
        totalDebit: 0,
        totalCredit: 0,
      });
    }
    const entry = map.get(key)!;
    entry.lines.push({ accountCode: raw.accountCode, debit: raw.debit, credit: raw.credit });
    entry.totalDebit += raw.debit;
    entry.totalCredit += raw.credit;
  }
  for (const entry of map.values()) {
    entry.balanced = Math.abs(entry.totalDebit - entry.totalCredit) < 0.005;
  }
  return Array.from(map.values());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { businessId } = session.user;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const mode = (formData.get("mode") as string | null) ?? "preview";

  if (!file) return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الملف يتجاوز 10 ميغابايت" }, { status: 413 });
  }

  const text = await file.text();
  const rows = parseCSV(text);
  const rawLines = parseRawLines(rows);
  const entries = groupIntoEntries(rawLines);

  if (entries.length === 0) {
    return NextResponse.json({ error: "لم يتم العثور على قيود صالحة" }, { status: 400 });
  }

  const balanced = entries.filter((e) => e.balanced);
  const unbalanced = entries.filter((e) => !e.balanced);

  if (mode === "preview") {
    return NextResponse.json({
      preview: entries.slice(0, 10).map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        description: e.description,
        lines: e.lines,
        balanced: e.balanced,
        totalDebit: e.totalDebit,
        totalCredit: e.totalCredit,
      })),
      total: entries.length,
      balancedCount: balanced.length,
      unbalancedCount: unbalanced.length,
    });
  }

  // Import — only import balanced entries
  if (balanced.length === 0) {
    return NextResponse.json({
      error: "جميع القيود غير متوازنة — لا يمكن الاستيراد",
      unbalancedCount: unbalanced.length,
    }, { status: 400 });
  }

  // Load accounts for this business once
  const accounts = await prisma.account.findMany({
    where: { businessId },
    select: { id: true, code: true },
  });
  const accountByCode = new Map(accounts.map((a) => [a.code, a.id]));

  // Fetch a system user for createdById
  const systemUser = await prisma.user.findFirst({ where: { businessId } });
  if (!systemUser) return NextResponse.json({ error: "لم يتم العثور على مستخدم" }, { status: 500 });

  let imported = 0;
  let skipped = 0;

  for (const entry of balanced) {
    const resolvedLines = entry.lines.map((l) => ({
      ...l,
      accountId: accountByCode.get(l.accountCode),
    }));

    if (resolvedLines.some((l) => !l.accountId)) {
      skipped++;
      continue; // skip entry if any account code not found
    }

    await prisma.journalEntry.create({
      data: {
        businessId,
        date: entry.date,
        description: entry.description,
        sourceType: "MANUAL",
        status: "POSTED",
        createdById: systemUser.id,
        lines: {
          create: resolvedLines.map((l) => ({
            accountId: l.accountId!,
            debit: l.debit,
            credit: l.credit,
          })),
        },
      },
    });
    imported++;
  }

  return NextResponse.json({
    imported,
    skipped,
    unbalancedSkipped: unbalanced.length,
    total: entries.length,
  });
}
