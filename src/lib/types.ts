export type Localized<T> = {
  es: T;
  en: T;
};

export type Action = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export type HeroSectionContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  actions: Action[];
  chips: string[];
  stats: Array<{ value: string; label: string }>;
};

export type ShowcaseCarouselContent = {
  ariaLabel: string;
  slides: Array<{ image: string; alt: string }>;
};

export type FeaturedGamesContent = {
  title: string;
  filtersLabel: string;
  filters: Array<{ key: string; label: string }>;
  cards: Array<{
    name: string;
    platformLabel: string;
    platformTags: string[];
    focus: string;
    image: string;
    summary: string;
    href: string;
    external?: boolean;
    cta: string;
  }>;
};

export type CallToActionContent = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  primaryCta: string;
  secondaryCta: string;
};

export type PublicPageContent = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lead: string;
  highlights: string[];
  sections: Array<{ title: string; body: string }>;
  actions: Action[];
  references?: {
    title: string;
    links: Array<Action>;
  };
};

export type AuthPageContent = {
  title: string;
  description: string;
  heading: string;
  lead: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    placeholder: string;
    required: boolean;
    minLength?: number;
    autoComplete?: string;
    inputMode?: "email" | "text";
  }>;
  submitLabel: string;
  altLabel: string;
  altHref: string;
  oauthLabel: string;
  oauthDivider: string;
  oauthErrors?: Record<string, string>;
  errors: Record<string, string>;
};

export type CharacterData = {
  id: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  coins: number;
  stats: Record<string, number>;
  attributes: Record<string, number>;
  equipment: Record<string, string>;
  inventory: string[];
};

export type ProgressionData = Record<string, CharacterData>;

export type BillingRecord = {
  id: string;
  provider: string;
  productKey: string;
  currency: string;
  amountCents: number;
  customerEmail: string;
  status: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string | null;
};

export type AccountPageContent = {
  title: string;
  description: string;
  nav: Array<{ label: string; href: string }>;
  dashboard: {
    heading: string;
    stats: Array<{ label: string; key: string }>;
    characterHeading: string;
    noCharacters: string;
    supportHeading: string;
    supportCta: string;
    levelLabel: string;
    paidContributionsLabel: string;
  };
  characters: {
    heading: string;
    noCharacters: string;
    statsLabel: string;
    equipmentLabel: string;
    inventoryLabel: string;
    levelLabel: string;
    healthLabel: string;
  };
  supportHistory: {
    heading: string;
    noRecords: string;
    table: {
      date: string;
      product: string;
      amount: string;
      status: string;
    };
  };
};
