import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Dark Biome | Swap RPG Universe",
    description: "Dark Biome — pagina en construccion.",
    eyebrow: "Proximamente",
    heading: "Dark Biome",
    lead: "Esta pagina se esta preparando y contendra informacion del juego.",
    highlights: ["Pagina en construccion."],
    sections: [{ title: "Estado", body: "El contenido completo estara disponible pronto." }],
    actions: [
      { label: "Volver a la home", href: "/", external: false, variant: "primary" },
      { label: "Ver proyecto principal", href: "/projects/swap-rpg", external: false, variant: "ghost" }
    ]
  },
  en: {
    title: "Dark Biome | Swap RPG Universe",
    description: "Dark Biome — page under construction.",
    eyebrow: "Coming Soon",
    heading: "Dark Biome",
    lead: "This page is being prepared and will contain game information.",
    highlights: ["Page under construction."],
    sections: [{ title: "Status", body: "Full content will be available soon." }],
    actions: [
      { label: "Back home", href: "/", external: false, variant: "primary" },
      { label: "Open flagship project", href: "/projects/swap-rpg", external: false, variant: "ghost" }
    ]
  }
};
