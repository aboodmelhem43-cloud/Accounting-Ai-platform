import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createCheckout, planToVariantId } from "@/lib/lemonsqueezy";
import type { PlanId } from "@/lib/plans";

const schema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { plan, billing } = schema.parse(body);

    const variantId = planToVariantId(plan as PlanId, billing);
    if (!variantId) {
      return NextResponse.json(
        { error: "Payment system not configured yet. Contact support@mohasabai.com." },
        { status: 503 }
      );
    }

    const checkoutUrl = await createCheckout({
      variantId,
      email: session.user.email,
      businessId: session.user.businessId,
      name: session.user.businessName,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
