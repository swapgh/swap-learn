"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import type { FeaturedGamesContent } from "@/lib/types";
import styles from "./styles.module.css";

export function FeaturedGames({
  content,
  locale,
}: {
  content: FeaturedGamesContent;
  locale: Locale;
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const filteredCards = useMemo(() => {
    if (activeFilter === "all") {
      return content.cards;
    }

    return content.cards.filter((game) => game.platformTags.includes(activeFilter));
  }, [activeFilter, content.cards]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>{content.title}</h2>
        <div className={styles.filters} aria-label={content.filtersLabel}>
          {content.filters.map((filter) => (
            <button
              key={filter.key}
              className={styles.filter}
              type="button"
              aria-pressed={activeFilter === filter.key}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.grid}>
        {filteredCards.map((game) => (
          <article key={game.name} className={styles.card}>
            <div className={styles.media}>
              <Image
                src={game.image}
                alt={game.name}
                width={800}
                height={500}
                sizes="(max-width: 500px) 100vw, (max-width: 1000px) 50vw, 33vw"
              />
              <span>{game.focus}</span>
            </div>
            <div className={styles.body}>
              <div className={styles.topline}>
                <h3>{game.name}</h3>
                <p>{game.platformLabel}</p>
              </div>
              <p>{game.summary}</p>
              <Link href={game.external ? game.href : localizePath(locale, game.href)}>
                {game.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
