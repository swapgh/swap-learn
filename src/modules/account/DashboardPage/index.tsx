import { getAuthUser } from "@/server/auth";
import { readJson } from "@/server/storage";
import type { Locale } from "@/lib/locale";
import type { ProgressionData, BillingRecord } from "@/lib/types";
import { AccountNav } from "@/components/account/AccountNav";
import { hasAdminToolAccess } from "@/server/tool-access";
import { localizePath } from "@/lib/routes";
import { dashboardContent } from "./content";
import styles from "./styles.module.css";

export async function DashboardPage({ locale }: { locale: Locale }) {
  const content = dashboardContent[locale];
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  const allProgression = (await readJson<Record<string, ProgressionData>>(
    "account/progression.json"
  )) ?? {};
  const userChars = Object.values(allProgression[user.id] ?? {});
  const records =
    (await readJson<BillingRecord[]>("billing/sessions.json")) ?? [];
  const userRecords = records.filter((r) => r.customerEmail === user.email);

  const totalLevel = userChars.reduce((acc, c) => acc + c.level, 0);
  const showTools = hasAdminToolAccess(user.email);

  return (
    <div className={styles.page}>
      <AccountNav locale={locale} showTools={showTools} />
      <div className={styles.content}>
        <h1 className={styles.heading}>{content.dashboard.heading}</h1>

        <div className={styles.stats}>
          {content.dashboard.stats.map((stat) => {
            let value: string | number = "0";
            if (stat.key === "characters") value = userChars.length;
            if (stat.key === "totalLevel") value = totalLevel;
            if (stat.key === "contributions") value = userRecords.length;
            return (
              <div key={stat.key} className={styles.stat}>
                <span className={styles.statValue}>{value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            );
          })}
        </div>

        <section className={styles.section}>
          <h2>{content.dashboard.characterHeading}</h2>
          {userChars.length > 0 ? (
            <div className={styles.charGrid}>
              {userChars.slice(0, 3).map((c) => (
                <div key={c.id} className={styles.charCard}>
                  <h3>{c.name}</h3>
                  <p>
                    {c.class} · {content.dashboard.levelLabel} {c.level}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>{content.dashboard.noCharacters}</p>
          )}
        </section>

        <section className={styles.section}>
          <h2>{content.dashboard.supportHeading}</h2>
          {userRecords.length > 0 ? (
            <p>
              {userRecords.filter((r) => r.status === "paid").length}{" "}
              {content.dashboard.paidContributionsLabel}
            </p>
          ) : (
            <form method="POST" action="/api/billing/checkout">
              <input type="hidden" name="product_key" value="supporter_tier" />
              <button type="submit" className={styles.cta}>
                {content.dashboard.supportCta}
              </button>
            </form>
          )}
        </section>

        {showTools && (
          <section className={styles.section}>
            <h2>Herramientas privadas</h2>
            <div className={styles.toolGrid}>
              <a href={localizePath(locale, "/account/tools/jobs")} className={styles.toolCard}>
                <strong>SwapJobs</strong>
                <span>Búsqueda y gestión de candidaturas</span>
              </a>
              <a href={localizePath(locale, "/account/tools/docs")} className={styles.toolCard}>
                <strong>SwapDocs</strong>
                <span>Proformas, presupuestos y documentos</span>
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
