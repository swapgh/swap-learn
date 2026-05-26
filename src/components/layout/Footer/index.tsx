"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/lib/locale";
import {
  getCookieConsentRecord,
  setCookieConsentRecord,
  shouldShowCookieBanner,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { localizePath } from "@/lib/routes";
import { footerContent } from "./content";
import styles from "./styles.module.css";

function getInitialOpenSections(): Set<number> {
  return new Set();
}

function getCookieConsentSnapshot(): boolean {
  return !shouldShowCookieBanner(
    getCookieConsentRecord(),
    siteConfig.cookieConsentVersion,
  );
}

function getServerCookieConsentSnapshot(): boolean {
  return true;
}

function subscribeCookieConsent(onStoreChange: () => void) {
  window.addEventListener("swap-cookie-consent", onStoreChange);
  return () => window.removeEventListener("swap-cookie-consent", onStoreChange);
}

function CookieBanner({
  content,
  locale,
  onAccept,
  onReject,
}: {
  content: { title: string; body: string; accept: string; reject: string; link: string; linkHref: string };
  locale: Locale;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className={styles.cookieBanner} role="dialog" aria-label={content.title}>
      <div className={styles.cookieInner}>
        <strong>{content.title}</strong>
        <p>{content.body}</p>
        <div className={styles.cookieActions}>
          <button className={styles.cookieAccept} onClick={onAccept}>
            {content.accept}
          </button>
          <button className={styles.cookieReject} onClick={onReject}>
            {content.reject}
          </button>
          <Link href={localizePath(locale, content.linkHref)}>
            {content.link}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const content = footerContent[locale];
  const cookieConsent = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getServerCookieConsentSnapshot,
  );
  const [openSections, setOpenSections] = useState(() =>
    getInitialOpenSections()
  );

  function handleCookie(choice: CookieConsentChoice) {
    setCookieConsentRecord(choice, siteConfig.cookieConsentVersion);
  }

  function toggleSection(i: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <>
      <footer className={styles.footer} id="contact">
        <div className={styles.content}>
          <div className={styles.grid}>
            {content.columns.map((col, i) => (
              <div key={col.title} className={`${styles.column} ${col.optional ? styles.optional : ""}`}>
                <button
                  type="button"
                  className={styles.columnToggle}
                  onClick={() => toggleSection(i)}
                  aria-expanded={openSections.has(i)}
                >
                  <span>{col.title}</span>
                  <span className={styles.toggleIcon} aria-hidden="true" />
                </button>
                <div className={styles.columnPanel} hidden={!openSections.has(i)}>
                  <ul className={styles.links}>
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link href={localizePath(locale, link.href)}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.bottom}>
            <span>{content.copyright}</span>
          </div>
        </div>
      </footer>
      {!cookieConsent && (
        <CookieBanner
          content={content.cookie}
          locale={locale}
          onAccept={() => handleCookie("accepted")}
          onReject={() => handleCookie("rejected")}
        />
      )}
    </>
  );
}
