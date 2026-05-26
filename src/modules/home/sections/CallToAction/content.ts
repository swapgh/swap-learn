import type { CallToActionContent, Localized } from "@/lib/types";

export const callToActionContent: Localized<CallToActionContent> = {
  es: {
    eyebrow: "Why This Project Matters",
    title: "Una home mas clara para enseñar el proyecto principal sin saturar la salida.",
    description: "La pagina gana cuando una sola descarga destaca, el proyecto principal queda arriba del todo y los juegos secundarios funcionan como piezas con identidad propia y pagina dedicada.",
    points: [
      "Menos friccion entre descubrir el proyecto y salir del sitio.",
      "Cada imagen destacada funciona como un juego con contexto propio.",
      "Los iconos ayudan a leer si un enlace abre proyecto, repo o detalle."
    ],
    primaryCta: "Explorar pagina del proyecto",
    secondaryCta: "Contactar"
  },
  en: {
    eyebrow: "Why This Project Matters",
    title: "A clearer homepage that presents the flagship project without crowding the exit paths.",
    description: "The page works better when one download stands out, the flagship project stays at the top, and the secondary games behave like finished pieces with their own context.",
    points: [
      "Less friction between discovering the project and leaving the site.",
      "Each featured image now behaves like a game with its own context.",
      "Icons make it easier to read whether a link opens a project, repo, or detail page."
    ],
    primaryCta: "Explore project page",
    secondaryCta: "Get in touch"
  }
};
