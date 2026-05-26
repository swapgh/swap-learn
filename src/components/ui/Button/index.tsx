import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import { cn } from "@/lib/cn";
import type { Action } from "@/lib/types";
import styles from "./styles.module.css";

export function Button({
  action,
  locale,
  isCurrent,
}: {
  action: Action;
  locale: Locale;
  isCurrent?: boolean;
}) {
  const href = action.external ? action.href : localizePath(locale, action.href);

  return (
    <Link
      className={cn(styles.button, styles[action.variant ?? "primary"], isCurrent && styles.current)}
      href={href}
      target={action.external ? "_blank" : undefined}
      rel={action.external ? "noopener noreferrer" : undefined}
    >
      {action.label}
    </Link>
  );
}
