import type { Locale } from "@/lib/locale";

export const themes = [
  { key: "moon", label: "Moon" },
  { key: "classic", label: "Classic" },
  { key: "forest", label: "Forest" },
  { key: "mist", label: "Mist" },
  { key: "light", label: "Light" },
] as const;

export type ThemeKey = (typeof themes)[number]["key"];

export const themeSwitcherContent: Record<Locale, { label: string }> = {
  es: { label: "Tema" },
  en: { label: "Theme" },
};
