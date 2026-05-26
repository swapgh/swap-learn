import type { HeroSectionContent, Localized } from "@/lib/types";

export const heroSectionContent: Localized<HeroSectionContent> = {
  es: {
    eyebrow: "",
    title: "Swap Game",
    subtitle: "Un RPG 2D en Java — portfolio y producto.",
    description: "Una home clara para el proyecto principal, sus juegos y una sola descarga.",
    backgroundImage: "/images/banners/Druid_Banner.png",
    actions: [
      {
        label: "Ver pagina del proyecto",
        href: "/projects/swap-rpg",
        external: false,
        variant: "ghost"
      },
      {
        label: "Ver repositorio",
        href: "https://github.com/swapgh/swap-rpg",
        external: true,
        variant: "ghost"
      }
    ],
    chips: [
      "Java + Swing",
      "2D dark fantasy",
      "Playable prototype"
    ],
    stats: [
      {
        value: "6",
        label: "juegos destacados"
      },
      {
        value: "1",
        label: "descarga principal"
      },
      {
        value: "1",
        label: "hub central"
      }
    ]
  },
  en: {
    eyebrow: "",
    title: "Swap Game",
    subtitle: "A Java 2D RPG — portfolio and product.",
    description: "A clean hub for the main project, related games, and one download.",
    backgroundImage: "/images/banners/Druid_Banner.png",
    actions: [
      {
        label: "Open project page",
        href: "/projects/swap-rpg",
        external: false,
        variant: "ghost"
      },
      {
        label: "View repository",
        href: "https://github.com/swapgh/swap-rpg",
        external: true,
        variant: "ghost"
      }
    ],
    chips: [
      "Java + Swing",
      "2D dark fantasy",
      "Playable prototype"
    ],
    stats: [
      {
        value: "6",
        label: "featured games"
      },
      {
        value: "1",
        label: "main download"
      },
      {
        value: "1",
        label: "central hub"
      }
    ]
  }
};
