"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import { accountNavContent } from "./content";
import styles from "./styles.module.css";

const toolItems = {
  es: [
    { label: "SwapJobs", href: "/account/tools/jobs" },
    { label: "SwapDocs", href: "/account/tools/docs" },
  ],
  en: [
    { label: "SwapJobs", href: "/account/tools/jobs" },
    { label: "SwapDocs", href: "/account/tools/docs" },
  ],
};

export function AccountNav({
  locale,
  showTools = false,
}: {
  locale: Locale;
  showTools?: boolean;
}) {
  const items = showTools
    ? [...accountNavContent[locale], ...toolItems[locale]]
    : accountNavContent[locale];
  const pathname = usePathname();
  const localePath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className={styles.nav} aria-label="Account">
      {items.map((item) => {
        const isActive =
          item.href === "/account"
            ? localePath === item.href
            : localePath === item.href || localePath.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={localizePath(locale, item.href)}
            className={isActive ? styles.active : styles.link}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
