import type { Metadata } from "next";
import { Cinzel, Manrope } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { siteConfig } from "@/config/site.config";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "800"],
  display: "swap",
  variable: "--font-cinzel",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Portfolio y landing page para Swap RPG: proyectos, soporte y paginas publicas del universo Swap.",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    images: [
      {
        url: "/images/banners/druid81.png",
        width: 1200,
        height: 400,
        alt: "Swap RPG",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/images/misc/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/misc/faviconx512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

const themeInitScript = `
(() => {
  const themes = new Set(["moon", "classic", "forest", "mist", "light"]);
  let theme = "classic";
  try {
    const stored = window.localStorage.getItem("swap-theme");
    if (themes.has(stored)) theme = stored;
  } catch {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode,
}>) {
  const hdrs = await headers();
  const locale = hdrs.get("x-locale") ?? "es";
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cinzel.variable} ${manrope.variable}`}
    >
      <body>
        <Script id="swap-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
