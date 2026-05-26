"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { enabledOnly } from "@/lib/enabled";
import type { Locale } from "@/lib/locale";
import { locales } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import { themes } from "@/components/ui/ThemeSwitcher/content";
import { headerContent } from "./content";
import styles from "./styles.module.css";

function useAuth() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

function applyTheme(theme: string, setter: (t: string) => void) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === "light" ? "light" : "dark";
  window.localStorage.setItem("swap-theme", theme);
  setter(theme);
}

export function Header({ locale }: { locale: Locale }) {
  const content = headerContent[locale];
  const pathname = usePathname();
  const { user } = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("swap-theme") || "classic"
      : "classic",
  );

  const settingsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const getLocaleHref = (nextLocale: Locale) => {
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = nextLocale;
      return segments.join("/") || `/${nextLocale}`;
    }
    return `/${nextLocale}${pathname}`;
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.logo} href={localizePath(locale, "/")}>
          <Image
            src="/images/misc/favicon.png"
            alt=""
            width={36}
            height={36}
            className={styles.logoIcon}
            aria-hidden="true"
          />
          <span className={styles.logoText}>SWAP</span>
        </Link>

        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerActive : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>

        <nav className={`${styles.nav} ${mobileOpen ? styles.navOpen : ""}`} aria-label={content.ariaLabel}>
          <ul className={styles.navList}>
            {enabledOnly(content.links).map((link) => (
              <li key={link.href}>
                <Link
                  href={localizePath(locale, link.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <div className={styles.dropdown} ref={accountRef}>
            <button
              className={styles.actionBtn}
              onClick={() => { setAccountOpen(!accountOpen); setSettingsOpen(false); }}
              aria-expanded={accountOpen}
              aria-label="Account"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
              <span className={styles.actionLabel}>
                {user?.username ?? (locale === "es" ? "Cuenta" : "Account")}
              </span>
              <svg className={styles.chevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {accountOpen && (
              <div className={styles.dropdownMenu}>
                {user ? (
                  <>
                    <Link
                      href={localizePath(locale, "/account")}
                      className={styles.dropdownItem}
                      onClick={() => setAccountOpen(false)}
                    >
                      {locale === "es" ? "Panel" : "Dashboard"}
                    </Link>
                    <Link
                      href={localizePath(locale, "/account/characters")}
                      className={styles.dropdownItem}
                      onClick={() => setAccountOpen(false)}
                    >
                      {locale === "es" ? "Personajes" : "Characters"}
                    </Link>
                    <Link
                      href={localizePath(locale, "/account/support/history")}
                      className={styles.dropdownItem}
                      onClick={() => setAccountOpen(false)}
                    >
                      {locale === "es" ? "Historial" : "Support history"}
                    </Link>
                    <hr className={styles.dropdownDivider} />
                    <form method="POST" action="/api/auth/logout">
                      <button type="submit" className={styles.dropdownItem}>
                        {locale === "es" ? "Cerrar sesión" : "Log out"}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href={localizePath(locale, "/login")}
                      className={styles.dropdownItem}
                      onClick={() => setAccountOpen(false)}
                    >
                      {locale === "es" ? "Iniciar sesión" : "Log in"}
                    </Link>
                    <Link
                      href={localizePath(locale, "/register")}
                      className={styles.dropdownItem}
                      onClick={() => setAccountOpen(false)}
                    >
                      {locale === "es" ? "Registrarse" : "Register"}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.dropdown} ref={settingsRef}>
            <button
              className={styles.settingsBtn}
              onClick={() => { setSettingsOpen(!settingsOpen); setAccountOpen(false); }}
              aria-expanded={settingsOpen}
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            {settingsOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownSection}>
                  <span className={styles.dropdownSectionTitle}>
                    {locale === "es" ? "Idioma" : "Language"}
                  </span>
                  <div className={styles.langGrid}>
                    {locales.map((item) => (
                      <Link
                        key={item}
                        href={getLocaleHref(item)}
                        className={`${styles.dropdownItem} ${item === locale ? styles.dropdownItemActive : ""}`}
                      >
                        {item.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                </div>
                <hr className={styles.dropdownDivider} />
                <div className={styles.dropdownSection}>
                  <span className={styles.dropdownSectionTitle}>
                    {locale === "es" ? "Tema" : "Theme"}
                  </span>
                  <div className={styles.themeGrid}>
                    {themes.map((theme) => (
                      <button
                        key={theme.key}
                        type="button"
                        className={styles.themeBtn}
                        onClick={() => applyTheme(theme.key, setCurrentTheme)}
                        aria-pressed={currentTheme === theme.key}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
        )}
      </div>
    </header>
  );
}
