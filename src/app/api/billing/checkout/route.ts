import { NextRequest, NextResponse } from "next/server";
import { getApiAuthUser } from "@/server/auth";
import { readJson, writeJson } from "@/server/storage";
import { billingConfig } from "@/server/config/billing.config";
import { apiError } from "@/server/api-error";
import type { BillingRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await getApiAuthUser(request);
  if (!user) {
    return apiError("Not authenticated", 401);
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  const records = (await readJson<BillingRecord[]>("billing/sessions.json")) ?? [];
  const userRecords = records.filter((r) => r.customerEmail === user.email);

  if (sessionId) {
    const record = userRecords.find((r) => r.id === sessionId);
    if (!record) return apiError("Session not found", 404);
    return NextResponse.json(record);
  }

  return NextResponse.json({ sessions: userRecords });
}

export async function POST(request: NextRequest) {
  const user = await getApiAuthUser(request);
  if (!user) {
    return apiError("Not authenticated", 401);
  }

  try {
    const body = await request.json();
    const productKey = body.product_key ?? "supporter_tier";
    const product = billingConfig.products[productKey];

    if (!product) {
      return apiError("Invalid product key");
    }

    const sessionId = crypto.randomUUID();
    const records = (await readJson<BillingRecord[]>("billing/sessions.json")) ?? [];

    let checkoutUrl = "";

    if (billingConfig.mode === "stripe") {
      const stripeRes = await fetch(
        "https://api.stripe.com/v1/checkout/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${billingConfig.stripe.secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "mode": "payment",
            "success_url": `${request.nextUrl.origin}${billingConfig.successUrl}`,
            "cancel_url": `${request.nextUrl.origin}${billingConfig.cancelUrl}`,
            "line_items[0][price_data][currency]": billingConfig.currency.toLowerCase(),
            "line_items[0][price_data][product_data][name]": product.label,
            "line_items[0][price_data][unit_amount]": String(product.amountCents),
            "line_items[0][quantity]": "1",
            "customer_email": user.email,
          }),
        }
      );

      const stripeData = await stripeRes.json();

      if (!stripeRes.ok) {
        return apiError(
          stripeData.error?.message ?? "Stripe checkout failed",
          500
        );
      }

      checkoutUrl = stripeData.url;
    } else {
      checkoutUrl = `${request.nextUrl.origin}${billingConfig.successUrl}?session_id=${sessionId}`;
    }

    const record: BillingRecord = {
      id: sessionId,
      provider: billingConfig.mode,
      productKey: product.key,
      currency: billingConfig.currency,
      amountCents: product.amountCents,
      customerEmail: user.email,
      status: "pending",
      checkoutUrl,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    records.push(record);
    await writeJson("billing/sessions.json", records);

    return NextResponse.json(record, { status: 201 });
  } catch {
    return apiError("Checkout creation failed", 500);
  }
}
