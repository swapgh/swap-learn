import type { MetadataRoute } from "next";
import { pageRoutes } from "@/config/pages.config";
import { locales } from "@/lib/locale";
import { siteConfig } from "@/config/site.config";

const includedRoutes = [
  "",
  pageRoutes.project,
  pageRoutes.contact,
  pageRoutes.help,
  pageRoutes.store,
  pageRoutes.legalNotice,
  pageRoutes.privacy,
  pageRoutes.cookies,
  pageRoutes.paymentDisclaimer,
  pageRoutes.supportTerms,
  pageRoutes.classSelect,
  pageRoutes.combatSlice,
  pageRoutes.darkBiome,
  pageRoutes.rogueBuild,
  pageRoutes.liminalZone,
];

export default function sitemap(): MetadataRoute.Sitemap {
  return includedRoutes.flatMap((route) =>
    locales.flatMap((locale) => {
      const url = `${siteConfig.url}/${locale}${route}`;
      return {
        url,
        lastModified: new Date(),
        alternates: {
          languages: {
            "x-default": `${siteConfig.url}/es${route}`,
            ...Object.fromEntries(
              locales
                .filter((l) => l !== locale)
                .map((l) => [l, `${siteConfig.url}/${l}${route}`]),
            ),
          },
        },
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1 : 0.7,
      };
    }),
  );
}
