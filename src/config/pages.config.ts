export const pageRoutes = {
  project: "/projects/swap-rpg",
  contact: "/contact",
  help: "/help",
  store: "/store",
  legalNotice: "/aviso-legal",
  privacy: "/privacy",
  cookies: "/cookies",
  paymentDisclaimer: "/payment-disclaimer",
  supportTerms: "/support-terms",
  classSelect: "/games/class-select",
  combatSlice: "/games/combat-slice",
  darkBiome: "/games/dark-biome",
  rogueBuild: "/games/rogue-build",
  liminalZone: "/games/liminal-zone",
} as const;

export type PublicPageSlug = keyof typeof pageRoutes;
export type LegalPageSlug =
  | "legalNotice"
  | "privacy"
  | "cookies"
  | "paymentDisclaimer"
  | "supportTerms";
