import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ statementId: string; txId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { statementId, txId } = await params;

  // التحقق من ملكية الكشف
  const statement = await prisma.bankStatement.findFirst({
    where: { id: statementId, businessId: session.user.businessId },
  });
  if (!statement) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const tx = await prisma.bankTransaction.update({
    where: { id: txId, statementId },
    data: { matched: true },
  });

  return NextResponse.json(tx);
}
