import type { Locale } from "@/lib/locale";
import type { AccountPageContent } from "@/lib/types";

export const dashboardContent: Record<Locale, AccountPageContent> = {
  es: {
    title: "Panel - Swap RPG",
    description: "Panel de tu cuenta de Swap RPG",
    nav: [
      { label: "Panel", href: "/account" },
      { label: "Personajes", href: "/account/characters" },
      { label: "Salud", href: "/account/health/profile" },
      { label: "Historial de apoyo", href: "/account/support/history" },
    ],
    dashboard: {
      heading: "Panel de control",
      stats: [
        { label: "Personajes", key: "characters" },
        { label: "Nivel total", key: "totalLevel" },
        { label: "Contribuciones", key: "contributions" },
      ],
      characterHeading: "Tu personaje principal",
      noCharacters:
        "Aún no tienes personajes. Juega a Swap RPG para crear tu primer personaje.",
      supportHeading: "Apoya el proyecto",
      supportCta: "Contribuir",
      levelLabel: "Nivel",
      paidContributionsLabel: "contribuciones realizadas",
    },
    characters: {
      heading: "Personajes",
      noCharacters: "No tienes personajes aún.",
      statsLabel: "Estadísticas",
      equipmentLabel: "Equipo",
      inventoryLabel: "Inventario",
      levelLabel: "Nivel",
      healthLabel: "Salud",
    },
    supportHistory: {
      heading: "Historial de apoyo",
      noRecords: "No hay registros de contribuciones.",
      table: {
        date: "Fecha",
        product: "Producto",
        amount: "Importe",
        status: "Estado",
      },
    },
  },
  en: {
    title: "Dashboard - Swap RPG",
    description: "Your Swap RPG account dashboard",
    nav: [
      { label: "Dashboard", href: "/account" },
      { label: "Characters", href: "/account/characters" },
      { label: "Health", href: "/account/health/profile" },
      { label: "Support history", href: "/account/support/history" },
    ],
    dashboard: {
      heading: "Dashboard",
      stats: [
        { label: "Characters", key: "characters" },
        { label: "Total level", key: "totalLevel" },
        { label: "Contributions", key: "contributions" },
      ],
      characterHeading: "Your main character",
      noCharacters:
        "No characters yet. Play Swap RPG to create your first character.",
      supportHeading: "Support the project",
      supportCta: "Contribute",
      levelLabel: "Level",
      paidContributionsLabel: "paid contributions",
    },
    characters: {
      heading: "Characters",
      noCharacters: "You don't have any characters yet.",
      statsLabel: "Stats",
      equipmentLabel: "Equipment",
      inventoryLabel: "Inventory",
      levelLabel: "Level",
      healthLabel: "Health",
    },
    supportHistory: {
      heading: "Support history",
      noRecords: "No contribution records found.",
      table: {
        date: "Date",
        product: "Product",
        amount: "Amount",
        status: "Status",
      },
    },
  },
};
