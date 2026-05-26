import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Pagos | Swap RPG",
    description: "Aviso sobre procesamiento de pagos y alcance del sitio respecto a datos de pago.",
    eyebrow: "Pagos",
    heading: "Como se gestionan las contribuciones.",
    lead: "El sitio no procesa directamente datos completos de tarjeta. Las contribuciones se redirigen a la pasarela externa configurada, actualmente Stripe.",
    highlights: [
      "Pagos gestionados por Stripe, no por formularios propios del servidor.",
      "Sin almacenamiento de PAN completo ni CVC/CVV en la base de datos local.",
      "Solo se conservan metadatos necesarios para estado, soporte y auditoria tecnica."
    ],
    sections: [
      {
        title: "Proveedor de pago",
        body: "Las contribuciones se procesan mediante Stripe cuando el servicio esta habilitado. Este sitio puede crear una sesion de contribucion y redirigir al usuario al entorno del proveedor, pero no solicita ni almacena directamente numeros completos de tarjeta, fechas de expiracion completas ni codigos de seguridad."
      },
      {
        title: "Datos que si conserva el sitio",
        body: "Para poder mostrar historial, verificar estados y atender incidencias, el sitio puede conservar correo del usuario, importe, divisa, identificadores tecnicos de la sesion, estado de la contribucion y marcas temporales. Estos datos no sustituyen a la informacion financiera completa gestionada por el proveedor de pago."
      },
      {
        title: "Alcance del aviso",
        body: "Este aviso solo cubre el comportamiento del sitio Swap RPG. El tratamiento de datos realizado por Stripe dentro de su propio servicio se rige por la documentacion y politica de privacidad del proveedor."
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
        variant: "ghost"
      },
      {
        label: "Pagos",
        href: "/payment-disclaimer",
        external: false,
        variant: "primary"
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
      title: "Fuentes de pago y seguridad",
      links: [
        {
          label: "Stripe PCI",
          href: "https://stripe.com/guides/pci-compliance",
          external: true,
          variant: "ghost"
        },
        {
          label: "Seguridad Stripe",
          href: "https://docs.stripe.com/security/guide",
          external: true,
          variant: "ghost"
        }
      ]
    }
  },
  en: {
    title: "Payments | Swap RPG",
    description: "Notice about payment processing and what the site does or does not store.",
    eyebrow: "Payments",
    heading: "How contributions are handled.",
    lead: "The site does not process full card data directly. Contributions are redirected to the configured external gateway, currently Stripe.",
    highlights: [
      "Payments handled by Stripe, not by card forms hosted on this server.",
      "No full PAN or CVC/CVV storage in the local database.",
      "Only metadata needed for status, support, and technical auditing is kept."
    ],
    sections: [
      {
        title: "Payment provider",
        body: "Contributions are processed through Stripe when the service is enabled. This site may create a contribution session and redirect the user to the provider environment, but it does not request or store full card numbers, full expiration details, or security codes directly."
      },
      {
        title: "Data the site may retain",
        body: "To show history, verify status, and support incidents, the site may retain user email, amount, currency, technical session identifiers, contribution status, and timestamps. This does not replace the full financial data handled by the payment provider."
      },
      {
        title: "Scope of this notice",
        body: "This notice only covers the behavior of the Swap RPG site. Any data processing performed by Stripe within its own service is governed by the provider’s own documentation and privacy policy."
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
        variant: "ghost"
      },
      {
        label: "Payments",
        href: "/payment-disclaimer",
        external: false,
        variant: "primary"
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
      title: "Payment and security sources",
      links: [
        {
          label: "Stripe PCI",
          href: "https://stripe.com/guides/pci-compliance",
          external: true,
          variant: "ghost"
        },
        {
          label: "Stripe security",
          href: "https://docs.stripe.com/security/guide",
          external: true,
          variant: "ghost"
        }
      ]
    }
  }
};
