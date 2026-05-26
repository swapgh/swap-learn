export const locales = ["es", "en"] as const;
export const defaultLocale = "es";

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
