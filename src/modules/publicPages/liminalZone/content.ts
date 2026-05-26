import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Liminal Zone | Swap RPG Universe",
    description: "Liminal Zone — pagina en construccion.",
    eyebrow: "Proximamente",
    heading: "Liminal Zone",
    lead: "Esta pagina se esta preparando y contendra informacion del juego.",
    highlights: ["Pagina en construccion."],
    sections: [{ title: "Estado", body: "El contenido completo estara disponible pronto." }],
    actions: [
      { label: "Volver a la home", href: "/", external: false, variant: "primary" },
      { label: "Ver proyecto principal", href: "/projects/swap-rpg", external: false, variant: "ghost" }
    ]
  },
  en: {
    title: "Liminal Zone | Swap RPG Universe",
    description: "Liminal Zone — page under construction.",
    eyebrow: "Coming Soon",
    heading: "Liminal Zone",
    lead: "This page is being prepared and will contain game information.",
    highlights: ["Page under construction."],
    sections: [{ title: "Status", body: "Full content will be available soon." }],
    actions: [
      { label: "Back home", href: "/", external: false, variant: "primary" },
      { label: "Open flagship project", href: "/projects/swap-rpg", external: false, variant: "ghost" }
    ]
  }
};
