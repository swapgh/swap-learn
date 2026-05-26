import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Cookies | Swap RPG",
    description: "Politica de cookies y preferencias de consentimiento del sitio Swap RPG.",
    eyebrow: "Cookies",
    heading: "Cookies realmente usadas por el sitio.",
    lead: "La politica de cookies debe reflejar solo las cookies activas hoy y la forma en la que el usuario puede aceptar o limitar preferencias.",
    highlights: [
      "Cookies tecnicas para idioma, sesion y recordatorio del consentimiento.",
      "Sin analitica ni marketing activados por defecto en esta version.",
      "La capa de cookies permite guardar la eleccion del usuario para futuras visitas."
    ],
    sections: [
      {
        title: "Cookies tecnicas propias",
        body: "El sitio puede usar una cookie de idioma para recordar ES o EN, una cookie o sesion tecnica de PHP cuando el usuario inicia sesion y una cookie de consentimiento para recordar la decision tomada en el banner. Estas cookies son funcionales y sirven para que la navegacion, la cuenta y las preferencias basicas funcionen correctamente."
      },
      {
        title: "Cookies de terceros y pagos",
        body: "El sitio solo carga analitica si el usuario la acepta desde el banner. Si el usuario pasa al entorno de pago de Stripe, ese proveedor puede aplicar sus propias cookies o mecanismos tecnicos dentro de su dominio y bajo sus propias politicas."
      },
      {
        title: "Gestion del consentimiento",
        body: "El banner permite aceptar o rechazar el uso de analitica y cookies no esenciales. La eleccion se guarda para no repetir la pregunta en cada visita. Si cambian las finalidades o se activan cookies nuevas, esta pagina y el banner tendran que actualizarse."
      }
    ],
    actions: [
      {
        label: "Aviso legal",
        href: "/aviso-legal",
        external: false,
        variant: "ghost"
      },
      {
        label: "Privacidad",
        href: "/privacy",
        external: false,
        variant: "ghost"
      },
      {
        label: "Cookies",
        href: "/cookies",
        external: false,
        variant: "primary"
      },
      {
        label: "Pagos",
        href: "/payment-disclaimer",
        external: false,
        variant: "ghost"
      },
      {
        label: "Terminos",
        href: "/support-terms",
        external: false,
        variant: "ghost"
      },
      {
        label: "Contactar",
        href: "/contact",
        external: false,
        variant: "ghost"
      }
    ],
    references: {
      title: "Fuentes y guias",
      links: [
        {
          label: "Guia AEPD",
          href: "https://www.aepd.es/guides/guide-on-use-of-cookies.pdf",
          external: true,
          variant: "ghost"
        }
      ]
    }
  },
  en: {
    title: "Cookies | Swap RPG",
    description: "Cookie policy and consent preferences for the Swap RPG site.",
    eyebrow: "Cookies",
    heading: "Cookies the site actually uses.",
    lead: "The cookie policy should reflect only the active cookies and the way users can accept or limit preferences.",
    highlights: [
      "Technical cookies for language, session, and remembering consent.",
      "No analytics or marketing cookies are enabled by default in this version.",
      "The cookie layer stores the user’s choice for future visits."
    ],
    sections: [
      {
        title: "Own technical cookies",
        body: "The site may use a language cookie to remember ES or EN, a technical PHP session cookie when a user signs in, and a consent cookie to remember the decision taken in the banner. These cookies are functional and allow basic browsing, account access, and preference storage to work correctly."
      },
      {
        title: "Third-party cookies and payments",
        body: "The site only loads analytics if the user accepts it from the banner. If the user moves to Stripe’s payment environment, that provider may apply its own technical mechanisms or cookies inside its own domain and under its own policies."
      },
      {
        title: "Consent management",
        body: "The banner allows users to accept or reject analytics and other non-essential cookies. The decision is stored so the question is not repeated on every visit. If the purposes or cookies change later, this page and the banner will need to be updated."
      }
    ],
    actions: [
      {
        label: "Legal notice",
        href: "/aviso-legal",
        external: false,
        variant: "ghost"
      },
      {
        label: "Privacy",
        href: "/privacy",
        external: false,
        variant: "ghost"
      },
      {
        label: "Cookies",
        href: "/cookies",
        external: false,
        variant: "primary"
      },
      {
        label: "Payments",
        href: "/payment-disclaimer",
        external: false,
        variant: "ghost"
      },
      {
        label: "Terms",
        href: "/support-terms",
        external: false,
        variant: "ghost"
      },
      {
        label: "Contact",
        href: "/contact",
        external: false,
        variant: "ghost"
      }
    ],
    references: {
      title: "Sources and guides",
      links: [
        {
          label: "AEPD guide",
          href: "https://www.aepd.es/guides/guide-on-use-of-cookies.pdf",
          external: true,
          variant: "ghost"
        }
      ]
    }
  }
};
