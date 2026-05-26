import type { FeaturedGamesContent, Localized } from "@/lib/types";

export const featuredGamesContent: Localized<FeaturedGamesContent> = {
  es: {
    title: "JUEGOS DESTACADOS",
    filtersLabel: "Filtrar juegos por plataforma",
    filters: [
      { key: "all", label: "Todos" },
      { key: "pc", label: "PC" },
      { key: "playstation", label: "PlayStation" },
      { key: "switch", label: "Switch" },
      { key: "xbox", label: "Xbox" }
    ],
    cards: [
      {
        name: "Swap RPG",
        platformLabel: "PC · Switch",
        platformTags: ["pc", "switch"],
        focus: "Core Identity",
        image: "/images/tree/Tree_67.png",
        summary: "El RPG insignia del portfolio: fantasia oscura, exploracion compacta y combate por turnos con identidad propia.",
        href: "/projects/swap-rpg",
        external: false,
        cta: "Abrir pagina"
      },
      {
        name: "Class Select",
        platformLabel: "PC · PlayStation",
        platformTags: ["pc", "playstation"],
        focus: "UI / Flow",
        image: "/images/milestones/1_Class.png",
        summary: "Un RPG tactico corto centrado en composicion de grupo, lectura rapida de clases y decisiones previas al combate.",
        href: "/games/class-select",
        external: false,
        cta: "Ver juego"
      },
      {
        name: "Combat Slice",
        platformLabel: "PC · Xbox",
        platformTags: ["pc", "xbox"],
        focus: "Systems",
        image: "/images/milestones/1_Enemy.png",
        summary: "Un action RPG compacto orientado a encuentros intensos, telegraphs claros y progresion agresiva.",
        href: "/games/combat-slice",
        external: false,
        cta: "Ver juego"
      },
      {
        name: "Dark Biome",
        platformLabel: "Switch",
        platformTags: ["switch"],
        focus: "Worldbuilding",
        image: "/images/misc/Dark_Tree.png",
        summary: "Una aventura atmosferica de exploracion breve donde el bosque y la ambientacion sostienen toda la experiencia.",
        href: "/games/dark-biome",
        external: false,
        cta: "Ver juego"
      },
      {
        name: "Rogue Build",
        platformLabel: "PlayStation",
        platformTags: ["playstation"],
        focus: "Character Readability",
        image: "/images/characters/rogue.png",
        summary: "Un dungeon crawler rapido donde sigilo, movilidad y legibilidad del personaje marcan el ritmo completo.",
        href: "/games/rogue-build",
        external: false,
        cta: "Ver juego"
      },
      {
        name: "Liminal Zone",
        platformLabel: "Switch · Xbox",
        platformTags: ["switch", "xbox"],
        focus: "Atmosphere",
        image: "/images/tree/Tree_89.png",
        summary: "Una experiencia narrativa corta apoyada en espacios surrealistas, color contenido y tension constante.",
        href: "/games/liminal-zone",
        external: false,
        cta: "Ver juego"
      }
    ]
  },
  en: {
    title: "FEATURED GAMES",
    filtersLabel: "Filter games by platform",
    filters: [
      { key: "all", label: "All" },
      { key: "pc", label: "PC" },
      { key: "playstation", label: "PlayStation" },
      { key: "switch", label: "Switch" },
      { key: "xbox", label: "Xbox" }
    ],
    cards: [
      {
        name: "Swap RPG",
        platformLabel: "PC · Switch",
        platformTags: ["pc", "switch"],
        focus: "Core Identity",
        image: "/images/milestones/1_Title.png",
        summary: "The flagship portfolio RPG: dark fantasy, compact exploration, and turn-based combat with a clear identity.",
        href: "/projects/swap-rpg",
        external: false,
        cta: "Open page"
      },
      {
        name: "Class Select",
        platformLabel: "PC · PlayStation",
        platformTags: ["pc", "playstation"],
        focus: "UI / Flow",
        image: "/images/milestones/1_Class.png",
        summary: "A short tactical RPG focused on party composition, class readability, and pre-combat decisions.",
        href: "/games/class-select",
        external: false,
        cta: "Open game page"
      },
      {
        name: "Combat Slice",
        platformLabel: "PC · Xbox",
        platformTags: ["pc", "xbox"],
        focus: "Systems",
        image: "/images/milestones/1_Enemy.png",
        summary: "A compact action RPG built around intense encounters, readable telegraphs, and aggressive progression.",
        href: "/games/combat-slice",
        external: false,
        cta: "Open game page"
      },
      {
        name: "Dark Biome",
        platformLabel: "Switch",
        platformTags: ["switch"],
        focus: "Worldbuilding",
        image: "/images/misc/Dark_Tree.png",
        summary: "A short atmospheric exploration game where the forest and environmental storytelling carry the whole experience.",
        href: "/games/dark-biome",
        external: false,
        cta: "Open game page"
      },
      {
        name: "Rogue Build",
        platformLabel: "PlayStation",
        platformTags: ["playstation"],
        focus: "Character Readability",
        image: "/images/characters/rogue.png",
        summary: "A fast dungeon crawler where stealth, mobility, and strong character readability set the pace.",
        href: "/games/rogue-build",
        external: false,
        cta: "Open game page"
      },
      {
        name: "Liminal Zone",
        platformLabel: "Switch · Xbox",
        platformTags: ["switch", "xbox"],
        focus: "Atmosphere",
        image: "/images/tree/Tree_89.png",
        summary: "A short narrative experience driven by surreal spaces, restrained color, and persistent tension.",
        href: "/games/liminal-zone",
        external: false,
        cta: "Open game page"
      }
    ]
  }
};
