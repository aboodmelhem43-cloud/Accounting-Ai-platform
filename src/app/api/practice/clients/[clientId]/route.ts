import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedClient(practiceId: string, clientId: string) {
  return prisma.business.findFirst({
    where: { id: clientId, managedByBusinessId: practiceId },
  });
}

// PATCH — update client business name / details
const patchSchema = z.object({
  name: z.string().min(2).optional(),
  taxNumber: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId } = await params;
  const practiceId = session.user.primaryBusinessId ?? session.user.businessId;
  const client = await getOwnedClient(practiceId, clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json();
  const data = patchSchema.parse(body);

  const updated = await prisma.business.update({
    where: { id: clientId },
    data,
    select: { id: true, name: true, taxNumber: true },
  });

  return NextResponse.json({ client: updated });
}

// DELETE — remove a client from the practice (detaches, does not delete data)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId } = await params;
  const practiceId = session.user.primaryBusinessId ?? session.user.businessId;
  const client = await getOwnedClient(practiceId, clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Detach — set managedByBusinessId to null (preserves all data)
  await prisma.business.update({
    where: { id: clientId },
    data: { managedByBusinessId: null },
  });

  return NextResponse.json({ ok: true });
}
