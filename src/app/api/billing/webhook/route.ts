import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/server/storage";
import { billingConfig } from "@/server/config/billing.config";
import type { BillingRecord } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (billingConfig.mode !== "stripe") {
    return NextResponse.json({ received: true });
  }

  try {
    const body = await request.text();
    const payload = JSON.parse(body);
    const eventType = payload.type ?? "";

    if (eventType === "checkout.session.completed") {
      const session = payload.data.object;
      const sessionId = session.id;

      const records =
        (await readJson<BillingRecord[]>("billing/sessions.json")) ?? [];
      const idx = records.findIndex((r) => r.id === sessionId);

      if (idx !== -1) {
        records[idx].status = "paid";
        records[idx].updatedAt = new Date().toISOString();
        await writeJson("billing/sessions.json", records);
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
