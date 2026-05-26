import { Button } from "@/components/ui/Button";
import { publicPageBlocks } from "@/config/blocks.config";
import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/lib/locale";
import { isLocale, locales } from "@/lib/locale";
import type { Localized, PublicPageContent } from "@/lib/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./styles.module.css";

export function LegalPage({
  content,
  locale,
  currentHref,
}: {
  content: PublicPageContent;
  locale: Locale;
  currentHref?: string;
}) {
  return (
    <article className={styles.page}>
      {publicPageBlocks.hero && (
        <header className={styles.hero}>
          <p>{content.eyebrow}</p>
          <h1>{content.heading}</h1>
          <span>{content.lead}</span>
        </header>
      )}

      {publicPageBlocks.highlights && (
        <ul className={styles.highlights}>
          {content.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {publicPageBlocks.sections && (
        <div className={styles.sections}>
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      )}

      {publicPageBlocks.actions && (
        <div className={styles.actions}>
          {content.actions.map((action) => (
            <Button
              key={action.label}
              action={action}
              locale={locale}
              isCurrent={currentHref !== undefined && action.href === currentHref}
            />
          ))}
        </div>
      )}

      {content.references && (
        <aside className={styles.references} aria-labelledby="legal-references">
          <h2 id="legal-references">{content.references.title}</h2>
          <ul>
            {content.references.links.map((reference) => (
              <li key={reference.href}>
                <a href={reference.href} target="_blank" rel="noreferrer">
                  {reference.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

export function createLegalPageRoute(
  pageContent: Localized<PublicPageContent>,
  currentHref: string,
) {
  return async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    if (!isLocale(locale)) {
      notFound();
    }

    return <LegalPage content={pageContent[locale]} locale={locale} currentHref={currentHref} />;
  };
}

function pageMetadata(
  content: PublicPageContent,
  locale: Locale,
  path: string,
): Metadata {
  const url = `${siteConfig.url}/${locale}${path}`;
  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales
          .filter((l) => l !== locale)
          .map((l) => [l, `${siteConfig.url}/${l}${path}`]),
      ),
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      locale: locale === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      title: content.title,
      description: content.description,
    },
  };
}

export function createLegalPageMetadata(
  pageContent: Localized<PublicPageContent>,
  path: string,
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;

    if (!isLocale(locale)) {
      return {};
    }

    return pageMetadata(pageContent[locale], locale, path);
  };
}
