import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Store | Swap RPG",
    description: "Store — pagina en construccion.",
    eyebrow: "Proximamente",
    heading: "Store",
    lead: "La tienda estara disponible pronto.",
    highlights: ["Pagina en construccion."],
    sections: [{ title: "Estado", body: "El contenido completo estara disponible pronto." }],
    actions: [
      { label: "Volver a la home", href: "/", external: false, variant: "primary" },
      { label: "Ver proyecto principal", href: "/projects/swap-rpg", external: false, variant: "ghost" }
    ]
  },
  en: {
    title: "Store | Swap RPG",
    description: "Store — page under construction.",
    eyebrow: "Coming Soon",
    heading: "Store",
    lead: "The store will be available soon.",
    highlights: ["Page under construction."],
    sections: [{ title: "Status", body: "Full content will be available soon." }],
    actions: [
      { label: "Back home", href: "/", external: false, variant: "primary" },
      { label: "Open flagship project", href: "/projects/swap-rpg", external: false, variant: "ghost" }
    ]
  }
};
