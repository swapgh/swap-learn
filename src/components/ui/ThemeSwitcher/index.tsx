"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/locale";
import { themeSwitcherContent, themes, type ThemeKey } from "./content";
import styles from "./styles.module.css";

function getInitialTheme(): ThemeKey {
  if (typeof window === "undefined") return "classic";
  const stored = localStorage.getItem("swap-theme");
  const valid = themes.find((t) => t.key === stored);
  return (valid?.key as ThemeKey) ?? "classic";
}

export function ThemeSwitcher({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const content = themeSwitcherContent[locale];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" ? "light" : "dark";
    window.localStorage.setItem("swap-theme", theme);
  }, [theme]);

  return (
    <div className={styles.switcher} aria-label={content.label}>
      {themes.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-label={`${content.label}: ${t.label}`}
          aria-pressed={theme === t.key}
          onClick={() => setTheme(t.key as ThemeKey)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
