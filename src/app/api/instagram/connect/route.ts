import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildOAuthURL } from "@/lib/instagram-graph";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // state encodes businessId — validated again in the callback
  const state = Buffer.from(session.user.businessId).toString("base64url");
  const url   = buildOAuthURL(state);

  return NextResponse.redirect(url);
}
