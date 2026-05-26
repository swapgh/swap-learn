"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site.config";
import {
  getCookieConsentRecord,
  shouldShowCookieBanner,
  type CookieConsentRecord,
} from "@/lib/cookie-consent";

export function GoogleAnalytics() {
  const tagId = siteConfig.googleTagId;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function syncConsent(record?: CookieConsentRecord | null) {
      const consentRecord = record ?? getCookieConsentRecord();
      const canLoad =
        consentRecord?.choice === "accepted" &&
        !shouldShowCookieBanner(
          consentRecord,
          siteConfig.cookieConsentVersion,
        );

      setEnabled(canLoad);
    }

    syncConsent();

    function handleConsent(event: Event) {
      syncConsent((event as CustomEvent<CookieConsentRecord>).detail);
    }

    window.addEventListener("swap-cookie-consent", handleConsent);
    return () => window.removeEventListener("swap-cookie-consent", handleConsent);
  }, []);

  if (!tagId || !enabled) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
