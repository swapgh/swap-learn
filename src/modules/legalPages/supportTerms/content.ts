import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Terminos de apoyo | Swap RPG",
    description: "Condiciones aplicables a contribuciones voluntarias y supporter tier en Swap RPG.",
    eyebrow: "Apoyo",
    heading: "Condiciones de las contribuciones voluntarias.",
    lead: "El area de apoyo esta pensada para contribuciones voluntarias al proyecto. No equivale automaticamente a una tienda ni a la compraventa de merch o productos fisicos.",
    highlights: [
      "El supporter tier es una contribucion voluntaria al proyecto.",
      "Las futuras compras de tienda tendran terminos separados.",
      "Reembolsos limitados a supuestos concretos o exigidos por ley."
    ],
    sections: [
      {
        title: "Naturaleza de la contribucion",
        body: "Salvo que se indique expresamente otra cosa, el supporter tier representa una aportacion voluntaria de apoyo al proyecto y no la compra de un bien fisico ni la concesion automatica de derechos adicionales distintos de los que se describan publicamente."
      },
      {
        title: "Reembolsos",
        body: "Como regla general, las contribuciones voluntarias no son reembolsables una vez confirmadas, salvo cargo duplicado, error tecnico manifiesto, uso fraudulento acreditado o cuando una norma aplicable obligue a ello. Las solicitudes pueden dirigirse a swap@swap.com.es con la informacion necesaria para identificar la operacion."
      },
      {
        title: "Separacion respecto a la tienda",
        body: "Si en el futuro se habilitan productos, merch o contenidos de pago en la tienda, esas operaciones tendran sus propios terminos, condiciones de compra y politica de reembolso independientes del area de apoyo."
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
        variant: "ghost"
      },
      {
        label: "Terminos",
        href: "/support-terms",
        external: false,
        variant: "primary"
      },
      {
        label: "Contactar",
        href: "/contact",
        external: false,
        variant: "ghost"
      }
    ]
  },
  en: {
    title: "Support terms | Swap RPG",
    description: "Terms applicable to voluntary contributions and the supporter tier in Swap RPG.",
    eyebrow: "Support",
    heading: "Terms for voluntary contributions.",
    lead: "The support area is meant for voluntary project contributions. It is not automatically the same as a store or a merch purchase flow.",
    highlights: [
      "The supporter tier is a voluntary contribution to the project.",
      "Future store purchases will have separate terms.",
      "Refunds remain limited to specific cases or legal obligations."
    ],
    sections: [
      {
        title: "Nature of the contribution",
        body: "Unless expressly stated otherwise, the supporter tier is a voluntary contribution to support the project and not the purchase of a physical good or an automatic grant of extra rights beyond what is publicly described."
      },
      {
        title: "Refunds",
        body: "As a general rule, voluntary contributions are not refundable once confirmed, except in cases of duplicate charge, clear technical error, proven fraudulent use, or where applicable law requires it. Requests may be sent to swap@swap.com.es with enough information to identify the operation."
      },
      {
        title: "Separate from the store",
        body: "If products, merch, or paid content are added later in the store, those transactions will have their own purchase terms, checkout conditions, and refund policy separate from the support area."
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
        variant: "ghost"
      },
      {
        label: "Terms",
        href: "/support-terms",
        external: false,
        variant: "primary"
      },
      {
        label: "Contact",
        href: "/contact",
        external: false,
        variant: "ghost"
      }
    ]
  }
};
