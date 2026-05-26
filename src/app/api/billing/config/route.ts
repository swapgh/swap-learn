import { NextResponse } from "next/server";
import { billingConfig } from "@/server/config/billing.config";

export async function GET() {
  return NextResponse.json({
    publicKey: billingConfig.stripe.publicKey,
    currency: billingConfig.currency,
    products: Object.values(billingConfig.products).map((p) => ({
      key: p.key,
      label: p.label,
      amountCents: p.amountCents,
    })),
    mode: billingConfig.mode,
  });
}
