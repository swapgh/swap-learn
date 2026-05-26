"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import styles from "./styles.module.css";

const navItems = {
  es: [
    { key: "dashboard", label: "Dashboard", href: "/account/tools/docs" },
    { key: "clientes", label: "Clientes", href: "/account/tools/docs?tab=clientes" },
    { key: "proyectos", label: "Proyectos", href: "/account/tools/docs?tab=proyectos" },
    { key: "presupuestos", label: "Proformas", href: "/account/tools/docs?tab=presupuestos" },
    { key: "facturas", label: "Facturas", href: "/account/tools/docs?tab=facturas" },
    { key: "servicios", label: "Servicios", href: "/account/tools/docs/services" },
    { key: "plantillas", label: "Plantillas", href: "/account/tools/docs/templates" },
    { key: "tesoreria", label: "Tesorería", href: "/account/tools/docs/treasury" },
  ],
  en: [
    { key: "dashboard", label: "Dashboard", href: "/account/tools/docs" },
    { key: "clientes", label: "Clients", href: "/account/tools/docs?tab=clientes" },
    { key: "proyectos", label: "Projects", href: "/account/tools/docs?tab=proyectos" },
    { key: "presupuestos", label: "Proformas", href: "/account/tools/docs?tab=presupuestos" },
    { key: "facturas", label: "Invoices", href: "/account/tools/docs?tab=facturas" },
    { key: "servicios", label: "Services", href: "/account/tools/docs/services" },
    { key: "plantillas", label: "Templates", href: "/account/tools/docs/templates" },
    { key: "tesoreria", label: "Treasury", href: "/account/tools/docs/treasury" },
  ],
};

const backLabels = {
  es: "Volver al panel",
  en: "Account panel",
};

const quickCreateItems = {
  es: [
    { label: "Nuevo cliente", form: "cliente" },
    { label: "Nuevo proyecto", form: "proyecto" },
    { label: "Nueva proforma", form: "proforma" },
    { label: "Nueva factura", form: "factura" },
  ],
  en: [
    { label: "New client", form: "client" },
    { label: "New project", form: "project" },
    { label: "New proforma", form: "proforma" },
    { label: "New invoice", form: "invoice" },
  ],
};

export function SwapDocsSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const localePath = pathname.replace(`/${locale}`, "") || "/";
  const activeKey = getActiveKey(localePath, searchParams.get("tab"));

  const items = navItems[locale];
  const createItems = quickCreateItems[locale];

  function getActiveKey(path: string, tab: string | null) {
    if (path === "/account/tools/docs") {
      return tab || "dashboard";
    }

    if (path.startsWith("/account/tools/docs/clients")) return "clientes";
    if (path.startsWith("/account/tools/docs/projects")) return "proyectos";
    if (path.startsWith("/account/tools/docs/proformas")) return "presupuestos";
    if (path.startsWith("/account/tools/docs/invoices")) return "facturas";
    if (path.startsWith("/account/tools/docs/services")) return "servicios";
    if (path.startsWith("/account/tools/docs/templates")) return "plantillas";
    if (path.startsWith("/account/tools/docs/treasury")) return "tesoreria";

    return "";
  }

  return (
    <nav className={styles.nav} aria-label="SwapDocs">
      <span className={styles.heading}>SwapDocs</span>
      <Link href={localizePath(locale, "/account")} className={styles.backLink}>
        {backLabels[locale]}
      </Link>
      <div className={styles.divider} />
      {items.map((item) => (
        <Link
          key={item.href}
          href={localizePath(locale, item.href)}
          className={activeKey === item.key ? styles.active : styles.link}
          aria-current={activeKey === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
      <div className={styles.divider} />
      <div className={styles.createWrap}>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreate(!showCreate)}
          onBlur={() => setTimeout(() => setShowCreate(false), 150)}
        >
          ＋ Nuevo
        </button>
        {showCreate && (
          <div className={styles.dropdown}>
            {createItems.map((ci) => (
              <Link
                key={ci.form}
                href={localizePath(locale, `/account/tools/docs?form=${ci.form}`)}
                className={styles.dropdownItem}
                onClick={() => setShowCreate(false)}
              >
                {ci.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
