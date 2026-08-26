import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ContactType = "CUSTOMER" | "VENDOR";

interface ParsedRow {
  name: string;
  type: ContactType;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  notes: string;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    // Handle quoted fields that may contain commas
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
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function col(row: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => k.toLowerCase().trim() === c.toLowerCase());
    if (key !== undefined && row[key]) return row[key].trim();
  }
  return "";
}

function inferType(row: Record<string, string>): ContactType {
  const raw = col(row, "type", "نوع", "contact type", "نوع جهة الاتصال").toLowerCase();
  if (raw.includes("vendor") || raw.includes("supplier") || raw.includes("مورد")) return "VENDOR";
  return "CUSTOMER";
}

function mapRow(row: Record<string, string>): ParsedRow | null {
  const name = col(row, "name", "الاسم", "company name", "اسم الشركة", "full name");
  if (!name) return null;
  return {
    name,
    type: inferType(row),
    email: col(row, "email", "البريد", "e-mail", "بريد إلكتروني"),
    phone: col(row, "phone", "هاتف", "mobile", "رقم الهاتف", "tel"),
    address: col(row, "address", "عنوان", "city", "المدينة"),
    taxNumber: col(row, "tax number", "الرقم الضريبي", "vat", "tax id", "tin"),
    notes: col(row, "notes", "ملاحظات", "note", "remarks"),
  };
}

// POST /api/import/contacts
// Body: FormData with file (CSV) + mode ("preview" | "import")
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
  const { rows } = parseCSV(text);

  const parsed = rows.map(mapRow).filter((r): r is ParsedRow => r !== null);

  if (parsed.length === 0) {
    return NextResponse.json({ error: "لم يتم العثور على بيانات صالحة — تحقق من رؤوس الأعمدة" }, { status: 400 });
  }

  if (mode === "preview") {
    return NextResponse.json({ preview: parsed.slice(0, 10), total: parsed.length });
  }

  // Import mode — upsert on name+type per business to avoid exact duplicates
  let imported = 0;
  let skipped = 0;

  for (const row of parsed) {
    const existing = await prisma.contact.findFirst({
      where: { businessId, name: row.name, type: row.type },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.contact.create({
      data: {
        businessId,
        name: row.name,
        type: row.type,
        email: row.email || null,
        phone: row.phone || null,
        address: row.address || null,
        taxNumber: row.taxNumber || null,
        notes: row.notes || null,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, total: parsed.length });
}
