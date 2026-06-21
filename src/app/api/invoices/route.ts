import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractInvoiceData } from "@/lib/ai/extract-invoice";
import { checkInvoiceLimit } from "@/lib/plans";
import path from "path";
import fs from "fs/promises";

const ALLOWED_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp" | "application/pdf"> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "application/pdf": "application/pdf",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const limitCheck = await checkInvoiceLimit(session.user.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: "plan_limit",
        message: limitCheck.limit === 0
          ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار."
          : `وصلت للحد الأقصى (${limitCheck.limit} فاتورة/شهر). يرجى الترقية.`,
        plan: limitCheck.plan,
      }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const invoiceType = (formData.get("invoiceType") as string) ?? "purchase";

    if (!file) return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "حجم الملف يتجاوز 10 ميجابايت" }, { status: 400 });

    const mediaType = ALLOWED_TYPES[file.type];
    if (!mediaType) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم — يُقبل JPG، PNG، WebP، PDF فقط" }, { status: 400 });
    }

    // قراءة الملف كـ Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // حفظ الملف محليًا
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${session.user.businessId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${filename}`;

    // استخراج البيانات بالذكاء الاصطناعي
    const extractedData = await extractInvoiceData(buffer, mediaType, session.user.country);

    // حفظ الفاتورة بالحالة pending_review
    const invoice = await prisma.invoice.create({
      data: {
        businessId: session.user.businessId,
        fileUrl,
        fileType: file.type,
        extractedData: extractedData as object,
        invoiceType: invoiceType.toUpperCase() as "PURCHASE" | "SALES",
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json({ invoiceId: invoice.id, extractedData }, { status: 201 });
  } catch (error) {
    console.error("[invoices/upload]", error);
    return NextResponse.json({ error: "فشل في معالجة الفاتورة، يرجى المحاولة مرة أخرى" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = 20;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: { businessId: session.user.businessId } }),
  ]);

  return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / limit) });
}
