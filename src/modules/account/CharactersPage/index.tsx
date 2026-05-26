import { getAuthUser } from "@/server/auth";
import { readJson } from "@/server/storage";
import type { Locale } from "@/lib/locale";
import type { ProgressionData } from "@/lib/types";
import { AccountNav } from "@/components/account/AccountNav";
import { hasAdminToolAccess } from "@/server/tool-access";
import { dashboardContent } from "@/modules/account/DashboardPage/content";
import styles from "./styles.module.css";

export async function CharactersPage({ locale }: { locale: Locale }) {
  const user = await getAuthUser();

  if (!user) {
    return <p>Not authenticated</p>;
  }

  const allProgression = (await readJson<Record<string, ProgressionData>>(
    "account/progression.json"
  )) ?? {};

  const characters = Object.values(allProgression[user.id] ?? {});
  const content = dashboardContent[locale].characters;

  return (
    <div className={styles.page}>
      <AccountNav locale={locale} showTools={hasAdminToolAccess(user.email)} />
      <div className={styles.content}>
        <h1 className={styles.heading}>{content.heading}</h1>

        {characters.length === 0 ? (
          <p className={styles.empty}>{content.noCharacters}</p>
        ) : (
          <div className={styles.grid}>
            {characters.map((c) => (
              <div key={c.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>{c.name}</h2>
                  <span className={styles.class}>{c.class}</span>
                  <span className={styles.level}>
                    {content.levelLabel} {c.level}
                  </span>
                </div>

                <div className={styles.hp}>
                  {content.healthLabel}: {c.hp} / {c.maxHp}
                </div>

                {Object.keys(c.stats).length > 0 && (
                  <div className={styles.block}>
                    <strong>{content.statsLabel}</strong>
                    <div className={styles.tags}>
                      {Object.entries(c.stats).map(([k, v]) => (
                        <span key={k} className={styles.tag}>
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(c.equipment).length > 0 && (
                  <div className={styles.block}>
                    <strong>{content.equipmentLabel}</strong>
                    <div className={styles.tags}>
                      {Object.entries(c.equipment).map(([slot, item]) => (
                        <span key={slot} className={styles.tag}>
                          {slot}: {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.inventory.length > 0 && (
                  <div className={styles.block}>
                    <strong>{content.inventoryLabel}</strong>
                    <div className={styles.tags}>
                      {c.inventory.map((item) => (
                        <span key={item} className={styles.tag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
