import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { put } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const businessId = session.user.businessId;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null) ?? "document";
    const type = (formData.get("type") as string | null) ?? "OTHER";
    const invoiceId = formData.get("invoiceId") as string | null;

    if (!file) return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "حجم الملف يتجاوز 10 ميجابايت" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // حفظ الملف — Vercel Blob في الإنتاج، محلي في بيئة التطوير
    const ext = file.name.split(".").pop() ?? "pdf";
    const filename = `docs-${businessId}-${Date.now()}.${ext}`;
    let fileUrl: string;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // fallback: حفظ محلي عند غياب توكن Vercel Blob
      const uploadDir = path.join(process.cwd(), "public", "uploads", "docs");
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/docs/${filename}`;
    } else {
      // رفع الملف إلى Vercel Blob
      const blob = await put(filename, buffer, { access: "public" });
      fileUrl = blob.url;
    }

    // حفظ سجل المستند في قاعدة البيانات
    const doc = await prisma.storedDocument.create({
      data: { businessId, type, name, fileUrl },
    });

    // تحديث رابط PDF في الفاتورة إذا تم تمرير invoiceId
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId, businessId },
        data: { pdfUrl: fileUrl },
      });
    }

    return NextResponse.json({ url: fileUrl, id: doc.id }, { status: 201 });
  } catch (error) {
    console.error("[documents/upload]", error);
    return NextResponse.json({ error: "فشل في رفع المستند" }, { status: 500 });
  }
}
