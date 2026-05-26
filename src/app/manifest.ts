import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Swap RPG",
    short_name: siteConfig.name,
    description:
      "Portfolio y landing page para Swap RPG, con proyectos, soporte y paginas publicas del universo Swap.",
    start_url: "/es",
    scope: "/",
    display: "standalone",
    background_color: "#050a12",
    theme_color: "#050a12",
    icons: [
      {
        src: "/images/misc/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/misc/faviconx512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
