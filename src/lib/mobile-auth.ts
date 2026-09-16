import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export interface MobileTokenPayload {
  sub:        string;
  businessId: string;
  role:       string;
  email:      string;
}

function getMobileSecret() {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.MOBILE_JWT_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function verifyMobileToken(req: NextRequest): Promise<MobileTokenPayload | null> {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, getMobileSecret());
    return payload as unknown as MobileTokenPayload;
  } catch {
    return null;
  }
}
