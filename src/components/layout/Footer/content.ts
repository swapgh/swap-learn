import type { Locale } from "@/lib/locale";

export const footerContent: Record<
  Locale,
  {
    columns: Array<{
      title: string;
      defaultOpen?: boolean;
      optional?: boolean;
      links: Array<{ label: string; href: string }>;
    }>;
    copyright: string;
    cookie: {
      title: string;
      body: string;
      accept: string;
      reject: string;
      link: string;
      linkHref: string;
    };
  }
> = {
  es: {
    columns: [
      {
        title: "Navegación",
        links: [
          { label: "Inicio", href: "/" },
          { label: "Juegos", href: "/games/class-select" },
          { label: "Acceder", href: "/login" },
        ],
      },
      {
        title: "Enlaces",
        links: [
          { label: "Proyecto", href: "/projects/swap-rpg" },
          { label: "Blog", href: "/store" },
          { label: "Ayuda", href: "/help" },
          { label: "Contacto", href: "/contact" },
        ],
      },
      {
        title: "Repositorios",
        links: [
          { label: "swap-rpg", href: "https://github.com/swapgh/swap-rpg" },
          { label: "swap-web", href: "https://github.com/swapgh/swap-web" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Aviso legal", href: "/aviso-legal" },
          { label: "Privacidad", href: "/privacy" },
          { label: "Cookies", href: "/cookies" },
          { label: "Pagos", href: "/payment-disclaimer" },
          { label: "Términos", href: "/support-terms" },
        ],
      },
      {
        title: "Contacto",
        defaultOpen: true,
        links: [
          { label: "swap@swap.com.es", href: "mailto:swap@swap.com.es" },
          {
            label: "Abrir ticket por email",
            href: "mailto:swap@swap-rpg.com?subject=Ticket%20Swap%20RPG&body=Hola%20Swap%20RPG%2C%0A%0AUsuario%20o%20email%20de%20cuenta%3A%0ATipo%20de%20consulta%3A%20soporte%20/%20cuenta%20/%20pago%20/%20colaboracion%0ADescripcion%3A%0A%0AGracias.",
          },
        ],
      },
    ],
    copyright: "Swap RPG © 2026 · Todos los derechos reservados.",
    cookie: {
      title: "Cookies y privacidad",
      body: "Usamos cookies tecnicas para idioma, sesion y recordar tu eleccion. Google Analytics solo se carga si aceptas.",
      accept: "Aceptar",
      reject: "Rechazar",
      link: "Más información",
      linkHref: "/cookies",
    },
  },
  en: {
    columns: [
      {
        title: "Navigation",
        links: [
          { label: "Home", href: "/" },
          { label: "Games", href: "/games/class-select" },
          { label: "Login", href: "/login" },
        ],
      },
      {
        title: "Links",
        links: [
          { label: "Project", href: "/projects/swap-rpg" },
          { label: "Blog", href: "/store" },
          { label: "Help", href: "/help" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Repositories",
        links: [
          { label: "swap-rpg", href: "https://github.com/swapgh/swap-rpg" },
          { label: "swap-web", href: "https://github.com/swapgh/swap-web" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Legal notice", href: "/aviso-legal" },
          { label: "Privacy", href: "/privacy" },
          { label: "Cookies", href: "/cookies" },
          { label: "Payments", href: "/payment-disclaimer" },
          { label: "Support terms", href: "/support-terms" },
        ],
      },
      {
        title: "Contact",
        defaultOpen: true,
        links: [
          { label: "swap@swap.com.es", href: "mailto:swap@swap.com.es" },
          {
            label: "Open email ticket",
            href: "mailto:swap@swap-rpg.com?subject=Swap%20RPG%20ticket&body=Hello%20Swap%20RPG%2C%0A%0AAccount%20username%20or%20email%3A%0ARequest%20type%3A%20support%20/%20account%20/%20payment%20/%20collaboration%0ADescription%3A%0A%0AThanks.",
          },
        ],
      },
    ],
    copyright: "Swap RPG © 2026 · All rights reserved.",
    cookie: {
      title: "Cookies and privacy",
      body: "We use technical cookies for language, session, and remembering your choice. Google Analytics only loads if you accept.",
      accept: "Accept",
      reject: "Reject",
      link: "More info",
      linkHref: "/cookies",
    },
  },
};
