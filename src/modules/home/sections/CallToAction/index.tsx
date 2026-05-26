import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/locale";
import type { CallToActionContent } from "@/lib/types";
import styles from "./styles.module.css";

export function CallToAction({
  content,
  locale,
}: {
  content: CallToActionContent;
  locale: Locale;
}) {
  return (
    <section className={styles.intro}>
      <div className={styles.overlay}>
        <div className={styles.textCol}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p className={styles.description}>{content.description}</p>
          <ul className={styles.points}>
            {content.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button
              locale={locale}
              action={{ label: content.primaryCta, href: "/projects/swap-rpg", variant: "primary" }}
            />
            <Button
              locale={locale}
              action={{ label: content.secondaryCta, href: "/contact", variant: "ghost" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
