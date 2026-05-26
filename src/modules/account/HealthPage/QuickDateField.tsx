"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/locale";
import styles from "./styles.module.css";

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentWeekDays() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return toLocalDateValue(date);
  });
}

function formatShort(locale: Locale, value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function QuickDateField({ locale }: { locale: Locale }) {
  const today = toLocalDateValue(new Date());
  const days = useMemo(
    () =>
      currentWeekDays().map((value) => ({
        label: value === today ? (locale === "es" ? "Hoy" : "Today") : formatShort(locale, value),
        value,
      })),
    [locale, today]
  );
  const [selected, setSelected] = useState(today);

  return (
    <div className={styles.quickDateField}>
      <span>{locale === "es" ? "Día" : "Day"}</span>
      <input type="hidden" name="date" value={selected} />
      <div className={styles.quickDateGrid}>
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            className={selected === day.value ? styles.activeDate : undefined}
            onClick={() => setSelected(day.value)}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}
