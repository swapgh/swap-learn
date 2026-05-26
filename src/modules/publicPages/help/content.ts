import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Ayuda | Swap RPG",
    description: "Ayuda — pagina en construccion.",
    eyebrow: "Proximamente",
    heading: "Ayuda",
    lead: "La pagina de ayuda estara disponible pronto.",
    highlights: ["Pagina en construccion."],
    sections: [{ title: "Estado", body: "El contenido completo estara disponible pronto." }],
    actions: [
      { label: "Volver a la home", href: "/", external: false, variant: "primary" },
      { label: "Contactar", href: "/contact", external: false, variant: "ghost" }
    ]
  },
  en: {
    title: "Help | Swap RPG",
    description: "Help — page under construction.",
    eyebrow: "Coming Soon",
    heading: "Help",
    lead: "The help page will be available soon.",
    highlights: ["Page under construction."],
    sections: [{ title: "Status", body: "Full content will be available soon." }],
    actions: [
      { label: "Back home", href: "/", external: false, variant: "primary" },
      { label: "Contact", href: "/contact", external: false, variant: "ghost" }
    ]
  }
};
