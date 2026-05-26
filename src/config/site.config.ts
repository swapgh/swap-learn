export const siteConfig = {
  name: "Swap",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://swap.com.es",
  googleTagId: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? "",
  cookieConsentVersion:
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_VERSION ?? "2026-04-14-ga4-v1",
};
