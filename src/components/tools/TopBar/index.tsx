"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import styles from "./styles.module.css";

type SearchResult = {
  clients: Array<{ id: string; name: string; email: string | null }>;
  projects: Array<{ id: string; name: string; clientId: string; clientName: string | null }>;
  proformas: Array<{ id: string; number: string; projectId: string; clientId: string; projectName: string | null }>;
  invoices: Array<{ id: string; number: string; projectId: string | null; clientId: string | null; projectName: string | null }>;
};

export function TopBar({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
  const isListTab = pathname.endsWith("/account/tools/docs") && ["clientes", "proyectos", "presupuestos", "facturas"].includes(activeTab ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(
    async (q: string) => {
      try {
        const res = await fetch(`/api/tools/docs/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch {
        // silent
      }
    },
    []
  );

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isListTab) {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      setResults(null);
      setFocused(false);
      debounceRef.current = setTimeout(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }, 120);
      return;
    }
    if (value.length < 1) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => search(value), 80);
  }

  function nav(href: string) {
    setQuery("");
    setResults(null);
    setFocused(false);
    router.push(localizePath(locale, href));
  }

  function invoiceContextHref(inv: SearchResult["invoices"][number]) {
    if (inv.projectId) return `/account/tools/docs?projectId=${inv.projectId}`;
    if (inv.clientId) return `/account/tools/docs?clientId=${inv.clientId}`;
    return "/account/tools/docs";
  }

  function clientHref(id: string) {
    return pathname.includes("/account/tools/docs/clients/") ? `/account/tools/docs/clients/${id}` : `/account/tools/docs?clientId=${id}`;
  }

  function projectHref(id: string) {
    return pathname.includes("/account/tools/docs/clients/") ? `/account/tools/docs/projects/${id}` : `/account/tools/docs?projectId=${id}`;
  }

  function proformaHref(item: SearchResult["proformas"][number]) {
    return pathname.includes("/account/tools/docs/clients/") ? `/account/tools/docs/proformas/${item.id}` : `/account/tools/docs?projectId=${item.projectId}`;
  }

  function invoiceHref(item: SearchResult["invoices"][number]) {
    return pathname.includes("/account/tools/docs/clients/") ? `/account/tools/docs/invoices/${item.id}` : invoiceContextHref(item);
  }

  return (
    <div className={styles.topBar}>
      <div className={styles.searchWrap} ref={wrapRef}>
        <input
          className={styles.searchInput}
          placeholder="Buscar cliente, proyecto, factura..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
        />
        {focused && !isListTab && results && query.length >= 1 && (
          <div className={styles.dropdown}>
            {results.clients.length > 0 && (
              <div className={styles.group}>
                <span className={styles.groupLabel}>Clientes</span>
                {results.clients.map((c) => (
                  <button key={c.id} className={styles.resultItem} onClick={() => nav(clientHref(c.id))}>
                    {c.name} {c.email && <span className={styles.muted}>{c.email}</span>}
                  </button>
                ))}
              </div>
            )}
            {results.projects.length > 0 && (
              <div className={styles.group}>
                <span className={styles.groupLabel}>Proyectos</span>
                {results.projects.map((p) => (
                  <button key={p.id} className={styles.resultItem} onClick={() => nav(projectHref(p.id))}>
                    {p.name} {p.clientName && <span className={styles.muted}>{p.clientName}</span>}
                  </button>
                ))}
              </div>
            )}
            {results.proformas.length > 0 && (
              <div className={styles.group}>
                <span className={styles.groupLabel}>Proformas</span>
                {results.proformas.map((p) => (
                  <button key={p.id} className={styles.resultItem} onClick={() => nav(proformaHref(p))}>
                    {p.number} {p.projectName && <span className={styles.muted}>{p.projectName}</span>}
                  </button>
                ))}
              </div>
            )}
            {results.invoices.length > 0 && (
              <div className={styles.group}>
                <span className={styles.groupLabel}>Facturas</span>
                {results.invoices.map((inv) => (
                  <button
                    key={inv.id}
                    className={styles.resultItem}
                    onClick={() => nav(invoiceHref(inv))}
                  >
                    {inv.number} {inv.projectName && <span className={styles.muted}>{inv.projectName}</span>}
                  </button>
                ))}
              </div>
            )}
            {results.clients.length === 0 &&
              results.projects.length === 0 &&
              results.proformas.length === 0 &&
              results.invoices.length === 0 && (
                <div className={styles.noResults}>Sin resultados</div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
