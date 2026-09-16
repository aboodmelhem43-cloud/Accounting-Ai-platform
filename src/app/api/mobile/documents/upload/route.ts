import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { extractInvoiceData } from "@/lib/ai/extract-invoice";
import { checkInvoiceLimit } from "@/lib/plans";
import { detectMimeType } from "@/lib/file-magic";
import path from "path";
import fs from "fs/promises";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";

const ALLOWED_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp" | "application/pdf"> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "application/pdf": "application/pdf",
};

const ALLOWED_EXTS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const limitCheck = await checkInvoiceLimit(token.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "plan_limit",
          message:
            limitCheck.limit === 0
              ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار."
              : `وصلت للحد الأقصى (${limitCheck.limit} فاتورة/شهر). يرجى الترقية.`,
          plan: limitCheck.plan,
        },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const invoiceType = (formData.get("invoiceType") as string) ?? "PURCHASE";

    if (!file) return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "حجم الملف يتجاوز 10 ميجابايت" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedMime = detectMimeType(buffer);
    if (!detectedMime || !ALLOWED_TYPES[detectedMime]) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم — يُقبل JPG، PNG، WebP، PDF فقط" }, { status: 400 });
    }
    const mediaType = ALLOWED_TYPES[detectedMime];

    const ext = ALLOWED_EXTS[detectedMime] ?? "bin";
    const filename = `${randomBytes(16).toString("hex")}.${ext}`;
    let fileUrl: string;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), buffer);
      fileUrl = `/uploads/${filename}`;
    } else {
      const blob = await put(filename, buffer, { access: "public" });
      fileUrl = blob.url;
    }

    // جلب الدولة من المنشأة لتخصيص الاستخراج
    const business = await prisma.business.findUnique({
      where: { id: token.businessId },
      select: { country: true },
    });

    const extractedData = await extractInvoiceData(buffer, mediaType, business?.country ?? "SA");

    const invoice = await prisma.invoice.create({
      data: {
        businessId: token.businessId,
        fileUrl,
        fileType: detectedMime,
        extractedData: extractedData as object,
        invoiceType: invoiceType.toUpperCase() as "PURCHASE" | "SALES",
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json({ invoiceId: invoice.id, extractedData }, { status: 201 });
  } catch (error) {
    console.error("[mobile/documents/upload]", error);
    return NextResponse.json({ error: "فشل في معالجة الفاتورة، يرجى المحاولة مرة أخرى" }, { status: 500 });
  }
}
