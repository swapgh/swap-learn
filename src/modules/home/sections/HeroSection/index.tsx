import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/locale";
import type { HeroSectionContent } from "@/lib/types";
import styles from "./styles.module.css";

export function HeroSection({
  content,
  locale,
}: {
  content: HeroSectionContent;
  locale: Locale;
}) {
  return (
    <section className={styles.hero} style={{ backgroundImage: `url(${content.backgroundImage})` }}>
      <div className={styles.overlay}>
        <h1>{content.title}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
        <p className={styles.description}>{content.description}</p>
        <div className={styles.bottom}>
          <div className={styles.actions}>
          {content.actions.map((action) => (
            <Button key={action.label} action={action} locale={locale} />
          ))}
        </div>
        <dl className={styles.statsBar}>
          {content.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
        </div>
      </div>
    </section>
  );
}
