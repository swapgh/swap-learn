import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/es/login", "/en/login", "/es/register", "/en/register", "/es/account", "/en/account"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
