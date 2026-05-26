import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/lib/locale";
import { locales } from "@/lib/locale";

function localizedAlternates(locale: Locale, path: string) {
  return {
    canonical: `${siteConfig.url}/${locale}${path}`,
    languages: {
      "x-default": `${siteConfig.url}/es${path}`,
      ...Object.fromEntries(
        locales
          .filter((l) => l !== locale)
          .map((l) => [l, `${siteConfig.url}/${l}${path}`]),
      ),
    },
  };
}

export function pageMetadata(
  title: string,
  description: string,
  locale: Locale,
  path: string,
): Metadata {
  const url = `${siteConfig.url}/${locale}${path}`;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      title,
      description,
      url,
      locale: locale === "es" ? "es_ES" : "en_US",
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: `${siteConfig.url}/images/banners/druid81.png`,
          width: 1200,
          height: 400,
          alt: "Swap RPG",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteConfig.url}/images/banners/druid81.png`],
    },
  };
}
