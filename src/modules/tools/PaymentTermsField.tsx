"use client";

import type { Locale } from "@/lib/locale";

const paymentTermPresets = [
  {
    es: "100% por transferencia bancaria al aceptar la proforma.",
    en: "100% by bank transfer when accepting the proforma.",
  },
  {
    es: "50% al aceptar la proforma y 50% antes de la entrega.",
    en: "50% when accepting the proforma and 50% before delivery.",
  },
  {
    es: "30% al iniciar, 40% en revisión intermedia y 30% antes de la entrega.",
    en: "30% at project start, 40% at intermediate review and 30% before delivery.",
  },
  {
    es: "Pago mensual por adelantado para servicios recurrentes.",
    en: "Monthly payment in advance for recurring services.",
  },
  {
    es: "Pago a 7 días desde la fecha de factura.",
    en: "Payment within 7 days from the invoice date.",
  },
  {
    es: "Pago a 15 días desde la fecha de factura.",
    en: "Payment within 15 days from the invoice date.",
  },
];

export function PaymentTermsField({
  label,
  locale = "es",
  defaultValue = "",
  className,
}: {
  label?: string;
  locale?: Locale;
  defaultValue?: string | null;
  className?: string;
}) {
  const resolvedLabel = label ?? (locale === "es" ? "Condiciones de pago" : "Payment terms");

  return (
    <label className={className}>
      {resolvedLabel}
      <select
        defaultValue=""
        onChange={(event) => {
          const input = event.currentTarget.parentElement?.querySelector<HTMLInputElement>('input[name="paymentTerms"]');
          if (input && event.currentTarget.value) {
            input.value = event.currentTarget.value;
          }
        }}
      >
        <option value="">{locale === "es" ? "Elegir plantilla..." : "Choose preset..."}</option>
        {paymentTermPresets.map((preset) => (
          <option key={preset.es} value={preset[locale]}>{preset[locale]}</option>
        ))}
      </select>
      <input
        name="paymentTerms"
        defaultValue={defaultValue ?? ""}
        placeholder={locale === "es" ? "Escribe o ajusta una condición personalizada" : "Write or adjust a custom term"}
      />
    </label>
  );
}
