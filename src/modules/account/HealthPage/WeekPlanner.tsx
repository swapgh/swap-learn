"use client";

import type { Locale } from "@/lib/locale";
import styles from "./styles.module.css";

const plans = {
  es: [
    ["Lun", "Sesión A", "Fuerza"],
    ["Mar", "Pasos + movilidad", "20-40 min suave"],
    ["Mié", "Sesión B", "Fuerza"],
    ["Jue", "Pasos + movilidad", "5-8 min movilidad"],
    ["Vie", "Sesión C", "Fuerza"],
    ["Sáb", "Paseo largo", "Zona fácil"],
    ["Dom", "Descanso", "Sueño + comida"],
  ],
  en: [
    ["Mon", "Session A", "Strength"],
    ["Tue", "Steps + mobility", "20-40 min easy"],
    ["Wed", "Session B", "Strength"],
    ["Thu", "Steps + mobility", "5-8 min mobility"],
    ["Fri", "Session C", "Strength"],
    ["Sat", "Long walk", "Easy zone"],
    ["Sun", "Rest", "Sleep + food"],
  ],
};

export function WeekPlanner({ locale }: { locale: Locale }) {
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <div className={styles.weekPlanner} aria-label={locale === "es" ? "Semana tipo" : "Sample week"}>
      {plans[locale].map(([day, task, detail], index) => (
        <article key={day} className={index === todayIndex ? styles.todayCard : undefined}>
          <span>{day}</span>
          <strong>{task}</strong>
          <small>{detail}</small>
          {index === todayIndex ? <em>{locale === "es" ? "Hoy" : "Today"}</em> : null}
        </article>
      ))}
    </div>
  );
}
