import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Contacto | Swap RPG",
    description: "Contacto y soporte de Swap RPG.",
    eyebrow: "Soporte",
    heading: "Contacto",
    lead: "Escribenos para soporte, dudas sobre la cuenta, pagos o colaboraciones.",
    highlights: [
      "Soporte por email",
      "Incluye tu usuario si escribes por una cuenta",
      "No envies contrasenas ni codigos privados"
    ],
    sections: [
      {
        title: "Abrir un ticket",
        body: "Usa el boton de contacto para abrir tu cliente de correo con el asunto preparado. Describe el problema, indica tu usuario y anade capturas si ayudan a reproducirlo."
      },
      {
        title: "Privacidad",
        body: "Nunca te pediremos tu contrasena. Para incidencias de pago, incluye la fecha aproximada y el correo usado en la compra, pero no datos completos de tarjeta."
      }
    ],
    actions: [
      {
        label: "Abrir ticket por email",
        href: "mailto:swap@swap-rpg.com?subject=Ticket%20Swap%20RPG&body=Hola%20Swap%20RPG%2C%0A%0AUsuario%20o%20email%20de%20cuenta%3A%0ATipo%20de%20consulta%3A%20soporte%20/%20cuenta%20/%20pago%20/%20colaboracion%0ADescripcion%3A%0A%0AGracias.",
        external: false,
        variant: "primary"
      },
      { label: "Ver ayuda", href: "/help", external: false, variant: "ghost" }
    ]
  },
  en: {
    title: "Contact | Swap RPG",
    description: "Contact and support for Swap RPG.",
    eyebrow: "Support",
    heading: "Contact",
    lead: "Write to us for support, account questions, payments, or collaboration requests.",
    highlights: [
      "Email support",
      "Include your username for account requests",
      "Do not send passwords or private codes"
    ],
    sections: [
      {
        title: "Open a ticket",
        body: "Use the contact button to open your mail client with a prepared subject. Describe the issue, include your username, and attach screenshots if they help reproduce it."
      },
      {
        title: "Privacy",
        body: "We will never ask for your password. For payment issues, include the approximate date and the email used for checkout, but never full card details."
      }
    ],
    actions: [
      {
        label: "Open email ticket",
        href: "mailto:swap@swap-rpg.com?subject=Swap%20RPG%20ticket&body=Hello%20Swap%20RPG%2C%0A%0AAccount%20username%20or%20email%3A%0ARequest%20type%3A%20support%20/%20account%20/%20payment%20/%20collaboration%0ADescription%3A%0A%0AThanks.",
        external: false,
        variant: "primary"
      },
      { label: "View help", href: "/help", external: false, variant: "ghost" }
    ]
  }
};
