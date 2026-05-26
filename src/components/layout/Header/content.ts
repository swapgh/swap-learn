import type { Locale } from "@/lib/locale";

export const headerContent: Record<
  Locale,
  {
    ariaLabel: string;
    languageLabel: string;
    links: Array<{ label: string; href: string; enabled: boolean }>;
  }
> = {
  es: {
    ariaLabel: "Principal",
    languageLabel: "Idioma",
    links: [
      { label: "Inicio", href: "/", enabled: true },
      { label: "Proyecto", href: "/projects/swap-rpg", enabled: true },
      { label: "Juegos", href: "/games/class-select", enabled: true },
      { label: "Contacto", href: "/contact", enabled: true },
    ],
  },
  en: {
    ariaLabel: "Main",
    languageLabel: "Language",
    links: [
      { label: "Home", href: "/", enabled: true },
      { label: "Project", href: "/projects/swap-rpg", enabled: true },
      { label: "Games", href: "/games/class-select", enabled: true },
      { label: "Contact", href: "/contact", enabled: true },
    ],
  },
};
