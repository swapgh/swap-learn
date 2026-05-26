"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";

export type ChecklistItem =
  | string
  | {
      text: string;
      href?: string;
      info?: string;
    };

export type ChecklistGroup = {
  title: string;
  items: ChecklistItem[];
};

export function Checklist({
  storageKey,
  groups,
  mode = "multi",
  markAllLabel = "Todo",
  clearAllLabel = "Limpiar",
}: {
  storageKey: string;
  groups: ChecklistGroup[];
  mode?: "multi" | "singlePerGroup";
  markAllLabel?: string;
  clearAllLabel?: string;
}) {
  const allIds = useMemo(
    () =>
      groups.flatMap((group, groupIndex) =>
        group.items.map((_, itemIndex) => `${groupIndex}-${itemIndex}`)
      ),
    [groups]
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  });
  const [openInfo, setOpenInfo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  const completed =
    mode === "singlePerGroup"
      ? groups.filter((group, groupIndex) =>
          group.items.some((_, itemIndex) => checked[`${groupIndex}-${itemIndex}`])
        ).length
      : allIds.filter((id) => checked[id]).length;
  const total = mode === "singlePerGroup" ? groups.length : allIds.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={styles.checklistShell}>
      <div className={styles.checklistProgress}>
        <span>{completed}/{total}</span>
        <div className={styles.checkTrack}>
          <div className={styles.checkFill} style={{ width: `${pct}%` }} />
        </div>
        <strong>{pct}%</strong>
      </div>

      <div className={styles.checklistGroups}>
        {groups.map((group, groupIndex) => {
          const groupIds = group.items.map((_, itemIndex) => `${groupIndex}-${itemIndex}`);
          const groupComplete = groupIds.every((id) => checked[id]);

          return (
            <section key={group.title} className={styles.checkGroup}>
              <div className={styles.checkGroupHeader}>
                <h3>{group.title}</h3>
                {mode === "multi" ? (
                  <button
                    type="button"
                    className={styles.checkGroupAction}
                    onClick={() =>
                      setChecked((current) => {
                        const next = { ...current };
                        groupIds.forEach((id) => {
                          if (groupComplete) delete next[id];
                          else next[id] = true;
                        });
                        return next;
                      })
                    }
                  >
                    {groupComplete ? clearAllLabel : markAllLabel}
                  </button>
                ) : null}
              </div>
              <div className={styles.checkItems}>
              {group.items.map((item, itemIndex) => {
                const id = `${groupIndex}-${itemIndex}`;
                const isChecked = Boolean(checked[id]);
                const text = typeof item === "string" ? item : item.text;
                const href = typeof item === "string" ? undefined : item.href;
                const info = typeof item === "string" ? undefined : item.info;
                return (
                  <div key={text} className={styles.checkItemWrap}>
                    <label
                      className={`${styles.checkItem} ${isChecked ? styles.checkedItem : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          setChecked((current) => {
                            if (mode === "singlePerGroup") {
                              const next = { ...current };
                              group.items.forEach((_, siblingIndex) => {
                                delete next[`${groupIndex}-${siblingIndex}`];
                              });
                              if (event.target.checked) next[id] = true;
                              return next;
                            }

                            return {
                              ...current,
                              [id]: event.target.checked,
                            };
                          })
                        }
                      />
                      <span className={styles.checkBox} aria-hidden="true" />
                      <span className={styles.checkText}>{text}</span>
                    </label>
                    {info ? (
                      <button
                        type="button"
                        className={styles.infoLink}
                        aria-expanded={Boolean(openInfo[id])}
                        aria-label={`Info: ${text}`}
                        onClick={() =>
                          setOpenInfo((current) => ({
                            ...current,
                            [id]: !current[id],
                          }))
                        }
                      >
                        i
                      </button>
                    ) : href ? (
                      <a href={href} className={styles.infoLink} aria-label={`Info: ${text}`}>
                        i
                      </a>
                    ) : null}
                    {info && openInfo[id] ? (
                      <div className={styles.inlineInfo}>
                        <p>{info}</p>
                        {href ? <a href={href}>Ver guía completa</a> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
