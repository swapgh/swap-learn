import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Privacidad | Swap RPG",
    description: "Politica de privacidad y tratamiento de datos del sitio Swap RPG.",
    eyebrow: "Privacidad",
    heading: "Politica de privacidad basada en el funcionamiento real del sitio.",
    lead: "Esta politica describe los datos que se tratan al navegar, iniciar sesion, contactar o apoyar el proyecto, sin atribuir al sitio practicas que hoy no existen.",
    highlights: [
      "No se almacenan numeros completos de tarjeta ni codigos CVC/CVV en este servidor.",
      "El tratamiento principal cubre navegacion, idioma, sesion, correo de contacto y metadatos de contribucion.",
      "Los pagos se gestionan mediante Stripe y su propia politica de privacidad."
    ],
    sections: [
      {
        title: "Responsable y datos tratados",
        body: "El responsable del sitio opera bajo el proyecto \"Swap\" y puede ser contactado en swap@swap.com.es. Los datos tratados pueden incluir direccion IP, registros tecnicos de acceso, preferencia de idioma, datos de sesion, correo de contacto y, si realizas una contribucion, correo del usuario, importe, divisa, estado e identificadores tecnicos asociados a la sesion de pago."
      },
      {
        title: "Finalidades y base juridica",
        body: "Los datos se usan para prestar la navegacion basica del sitio, mantener la sesion cuando el usuario accede a su cuenta, recordar la eleccion de idioma y consentimiento de cookies, responder mensajes enviados al correo del proyecto, gestionar contribuciones voluntarias y activar analitica solo si el usuario la acepta. La base juridica depende del caso: interes legitimo para seguridad y funcionamiento tecnico, ejecucion de medidas precontractuales o contractuales para cuenta y soporte, y consentimiento cuando corresponda para preferencias o cookies no tecnicas."
      },
      {
        title: "Destinatarios y pagos",
        body: "Los datos pueden ser tratados por proveedores necesarios para alojamiento, correo o servicios tecnicos. Si realizas una contribucion, el pago se canaliza mediante Stripe. Este sitio no almacena numeros completos de tarjeta ni codigos de seguridad; solo conserva metadatos de la operacion necesarios para verificar estado, auditoria tecnica o atencion de incidencias."
      },
      {
        title: "Conservacion y derechos",
        body: "Los datos se conservan durante el tiempo necesario para la finalidad correspondiente y para cumplir obligaciones legales o defender reclamaciones. Puedes solicitar acceso, rectificacion, supresion, oposicion, limitacion o portabilidad escribiendo a swap@swap.com.es. Si consideras que el tratamiento no es correcto, puedes acudir a la autoridad de control competente."
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
        variant: "primary"
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
      title: "Fuentes legales",
      links: [
        {
          label: "RGPD",
          href: "https://www.boe.es/doue/2016/119/L00001-00088.pdf",
          external: true,
          variant: "ghost"
        },
        {
          label: "LOPDGDD",
          href: "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673",
          external: true,
          variant: "ghost"
        }
      ]
    }
  },
  en: {
    title: "Privacy | Swap RPG",
    description: "Privacy policy and data handling information for the Swap RPG site.",
    eyebrow: "Privacy",
    heading: "A privacy policy based on how the site actually works.",
    lead: "This policy describes the data processed when you browse, sign in, contact the project, or support it, without claiming practices the site does not currently perform.",
    highlights: [
      "No full card numbers or CVC/CVV codes are stored on this server.",
      "The main processing covers browsing, language, session, contact email, and support metadata.",
      "Payments are handled through Stripe and subject to the provider’s own privacy documentation."
    ],
    sections: [
      {
        title: "Controller and processed data",
        body: "The site is operated under the \"Swap\" project and can be contacted at swap@swap.com.es. Processed data may include IP address, technical access logs, language preference, session data, contact email content, and, if you make a contribution, user email, amount, currency, status, and technical identifiers associated with the payment session."
      },
      {
        title: "Purposes and legal basis",
        body: "Data is used to provide basic browsing, maintain the session when a user signs in, remember language and cookie choices, reply to project emails, manage voluntary contributions, and enable analytics only if the user accepts it. The legal basis depends on the case: legitimate interest for security and technical operation, contract or pre-contract measures for account and support functions, and consent where applicable for preferences or non-essential cookies."
      },
      {
        title: "Recipients and payments",
        body: "Data may be processed by providers needed for hosting, email, or technical infrastructure. If you make a contribution, the payment is routed through Stripe. This site does not store full card numbers or security codes; it only keeps operation metadata needed for status verification, technical auditing, or support."
      },
      {
        title: "Retention and rights",
        body: "Data is kept only for as long as necessary for the relevant purpose and to meet legal obligations or handle claims. You can request access, rectification, erasure, objection, restriction, or portability by writing to swap@swap.com.es. If you believe processing is not compliant, you may contact the relevant supervisory authority."
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
        variant: "primary"
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
      title: "Legal sources",
      links: [
        {
          label: "GDPR",
          href: "https://www.boe.es/doue/2016/119/L00001-00088.pdf",
          external: true,
          variant: "ghost"
        },
        {
          label: "LOPDGDD",
          href: "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673",
          external: true,
          variant: "ghost"
        }
      ]
    }
  }
};
