import { Button } from "@/components/ui/Button";
import { publicPageBlocks } from "@/config/blocks.config";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { pageMetadata as buildPageMetadata } from "@/lib/metadata";
import type { Localized, PublicPageContent } from "@/lib/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./styles.module.css";

export function PublicPage({
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
    </article>
  );
}

export function createPublicPageRoute(
  pageContent: Localized<PublicPageContent>,
  currentHref?: string,
) {
  return async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    if (!isLocale(locale)) {
      notFound();
    }

    return <PublicPage content={pageContent[locale]} locale={locale} currentHref={currentHref} />;
  };
}

function pageMetadata(
  content: PublicPageContent,
  locale: Locale,
  path: string,
): Metadata {
  return buildPageMetadata(content.title, content.description, locale, path);
}

export function createPublicPageMetadata(
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
