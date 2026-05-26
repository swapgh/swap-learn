import type { Localized, PublicPageContent } from "@/lib/types";

export const content: Localized<PublicPageContent> = {
  es: {
    title: "Aviso legal | Swap RPG",
    description: "Aviso legal y condiciones generales de uso del sitio Swap RPG.",
    eyebrow: "Aviso legal",
    heading: "Informacion legal basica del sitio.",
    lead: "Esta pagina reune la informacion general del sitio, sus condiciones de uso y el marco minimo previo a un lanzamiento publico.",
    highlights: [
      "Titular identificado por nombre del proyecto y correo de contacto.",
      "Uso del contenido sujeto a propiedad intelectual del proyecto.",
      "Pendiente de completar con datos fiscales o postales reales antes de actividad comercial plena."
    ],
    sections: [
      {
        title: "Titular del sitio",
        body: "El sitio Swap RPG se presenta bajo el nombre del proyecto \"Swap\". El canal principal de contacto es swap@swap.com.es. Si el proyecto pasa a una actividad comercial estable, esta pagina debe completarse con la identidad legal completa, domicilio y, en su caso, datos registrales o fiscales aplicables."
      },
      {
        title: "Objeto del sitio",
        body: "La web muestra informacion del proyecto, portfolio, demo descargable, enlaces publicos y una zona privada de cuenta o soporte para usuarios autenticados. El acceso y uso del sitio implican aceptar estas condiciones basicas de navegacion."
      },
      {
        title: "Propiedad intelectual",
        body: "Textos, imagenes, marcas, interfaces, codigo y materiales del proyecto pertenecen a su autor o se usan con autorizacion. No se permite la reproduccion, distribucion o reutilizacion comercial sin permiso previo, salvo cuando una licencia publica indique expresamente lo contrario."
      },
      {
        title: "Responsabilidad y enlaces externos",
        body: "El sitio intenta mantener informacion razonablemente correcta, pero puede contener errores, cambios o secciones provisionales. Los enlaces externos, incluidos repositorios o proveedores de pago, dependen de servicios de terceros y pueden tener sus propias condiciones y politicas."
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
          label: "LSSI en BOE",
          href: "https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758",
          external: true,
          variant: "ghost"
        }
      ]
    }
  },
  en: {
    title: "Legal notice | Swap RPG",
    description: "Legal notice and general site terms for Swap RPG.",
    eyebrow: "Legal notice",
    heading: "Basic legal information about the site.",
    lead: "This page gathers the site’s general information, basic terms of use, and the minimum legal framework expected before a public launch.",
    highlights: [
      "Site operator identified by project name and contact email.",
      "Content use remains subject to project intellectual property rights.",
      "Still needs real fiscal or postal details before full commercial activity."
    ],
    sections: [
      {
        title: "Site operator",
        body: "The site is presented under the project name \"Swap\". The main contact channel is swap@swap.com.es. If the project becomes a stable commercial activity, this page should be completed with the full legal identity, postal address, and any applicable registry or tax information."
      },
      {
        title: "Purpose of the site",
        body: "The website presents project information, a portfolio, a downloadable demo, public links, and a private account or support area for authenticated users. Accessing and using the site implies acceptance of these basic browsing terms."
      },
      {
        title: "Intellectual property",
        body: "Texts, images, brands, interfaces, code, and project materials belong to their author or are used with permission. Reproduction, distribution, or commercial reuse is not allowed without prior authorization unless a public license expressly states otherwise."
      },
      {
        title: "Liability and external links",
        body: "The site aims to keep information reasonably accurate, but it may contain errors, changes, or provisional sections. External links, including repositories or payment providers, depend on third-party services and may be subject to their own terms and policies."
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
          label: "LSSI on BOE",
          href: "https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758",
          external: true,
          variant: "ghost"
        }
      ]
    }
  }
};
