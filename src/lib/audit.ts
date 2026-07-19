import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export async function logAudit(params: {
  businessId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // audit log failures must never break the main flow
  }
}
