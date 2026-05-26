"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import styles from "./styles.module.css";

export type GuideItem = {
  id: string;
  category: string;
  title: string;
  body: string;
  steps: string[];
  backHref: string;
};

export function GuideTabs({
  locale,
  items,
  categories,
}: {
  locale: Locale;
  items: GuideItem[];
  categories: string[];
}) {
  const allLabel = locale === "es" ? "Todas" : "All";
  const [active, setActive] = useState(allLabel);
  const visibleItems =
    active === allLabel ? items : items.filter((item) => item.category === active);

  return (
    <div className={styles.guideModule}>
      <div className={styles.guideTabs} role="tablist" aria-label={locale === "es" ? "Temas de guía" : "Guide topics"}>
        {[allLabel, ...categories].map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={active === category}
            className={active === category ? styles.activeGuideTab : undefined}
            onClick={() => setActive(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.guideGrid}>
        {visibleItems.map((item) => (
          <article key={item.id} id={item.id} className={styles.guideCard}>
            <span className={styles.guideCategory}>{item.category}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <ol>
              {item.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <a href={item.backHref}>{locale === "es" ? "Volver" : "Back"}</a>
          </article>
        ))}
      </div>
    </div>
  );
}
