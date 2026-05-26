import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import type { Localized } from "@/lib/types";

export const homeContent: Localized<{ title: string; description: string }> = {
  es: {
    title: "Swap",
    description:
      "Portfolio y landing page para Swap RPG: identidad del juego, proyectos destacados y una entrada mas clara al universo del portfolio.",
  },
  en: {
    title: "Swap",
    description:
      "Portfolio and landing page for Swap RPG: game identity, featured projects, and a cleaner entry point into the portfolio world.",
  },
};

export function homeMetadata(locale: Locale): Metadata {
  const content = homeContent[locale];
  return pageMetadata(content.title, content.description, locale, "");
}
