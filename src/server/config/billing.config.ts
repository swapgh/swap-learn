import "server-only";

export const billingConfig = {
  currency: "EUR",
  products: {
    supporter: {
      key: "supporter_tier",
      label: "Supporter",
      amountCents: 500,
    },
  } as Record<string, { key: string; label: string; amountCents: number }>,
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    publicKey: process.env.STRIPE_PUBLIC_KEY ?? "",
  },
  mode: (process.env.BILLING_MODE ?? "placeholder") as "stripe" | "placeholder",
  successUrl: process.env.BILLING_SUCCESS_URL ?? "/account",
  cancelUrl: process.env.BILLING_CANCEL_URL ?? "/account",
};
