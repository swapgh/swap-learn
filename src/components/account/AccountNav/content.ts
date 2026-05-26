import type { Locale } from "@/lib/locale";
import type { AccountPageContent } from "@/lib/types";

export const accountNavContent: Record<Locale, AccountPageContent["nav"]> = {
  es: [
    { label: "Panel", href: "/account" },
    { label: "Personajes", href: "/account/characters" },
    { label: "Salud", href: "/account/health/profile" },
    { label: "Historial de apoyo", href: "/account/support/history" },
  ],
  en: [
    { label: "Dashboard", href: "/account" },
    { label: "Characters", href: "/account/characters" },
    { label: "Health", href: "/account/health/profile" },
    { label: "Support history", href: "/account/support/history" },
  ],
};
