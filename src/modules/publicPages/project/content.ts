import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Swap RPG | Proyecto principal",
    description: "Swap RPG — pagina en preparacion.",
    eyebrow: "Proximamente",
    heading: "Swap RPG",
    lead: "La pagina principal del proyecto se esta reorganizando y estara lista pronto.",
    highlights: ["Pagina en construccion."],
    sections: [{ title: "Estado", body: "El contenido completo estara disponible pronto." }],
    actions: [
      { label: "Volver a la home", href: "/", external: false, variant: "primary" },
      { label: "Ver repositorio", href: "https://github.com/swapgh/swap-rpg", external: true, variant: "ghost" }
    ]
  },
  en: {
    title: "Swap RPG | Main project",
    description: "Swap RPG — page under construction.",
    eyebrow: "Coming Soon",
    heading: "Swap RPG",
    lead: "The main project page is being reorganized and will be ready soon.",
    highlights: ["Page under construction."],
    sections: [{ title: "Status", body: "Full content will be available soon." }],
    actions: [
      { label: "Back home", href: "/", external: false, variant: "primary" },
      { label: "View repository", href: "https://github.com/swapgh/swap-rpg", external: true, variant: "ghost" }
    ]
  }
};
