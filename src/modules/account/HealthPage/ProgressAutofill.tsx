"use client";

import type { Locale } from "@/lib/locale";
import styles from "./styles.module.css";

function readChecklist(key: string) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function setInputChecked(form: HTMLFormElement, name: string, checked: boolean) {
  const input = form.elements.namedItem(name);
  if (input instanceof HTMLInputElement) {
    input.checked = checked;
  }
}

function setFieldValue(form: HTMLFormElement, name: string, value: string) {
  const field = form.elements.namedItem(name);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  ) {
    field.value = value;
  }
}

const planLabels = {
  es: [
    ["Calentamiento", "Sentadilla", "Flexiones", "Remo con banda", "Puente de glúteo", "Plancha"],
    ["Calentamiento", "Zancadas", "Flexión inclinada/lenta", "Remo bajo mesa o banda", "Bisagra", "Dead bug"],
    ["Calentamiento", "Sentadilla tempo", "Pike push-up o flexión", "Dominada asistida/remo", "Puente unilateral", "Side plank"],
  ],
  en: [
    ["Warm-up", "Squat", "Push-ups", "Band row", "Glute bridge", "Plank"],
    ["Warm-up", "Lunges", "Incline/slow push-up", "Table or band row", "Hip hinge", "Dead bug"],
    ["Warm-up", "Tempo squat", "Pike push-up or push-up", "Assisted pull-up/row", "Single-leg bridge", "Side plank"],
  ],
} satisfies Record<Locale, string[][]>;

const mealLabels = {
  es: [
    ["Desayuno: yogur 250 g + avena 50-70 g + fruta", "Desayuno: 3 huevos + pan/patata", "Desayuno: leche + avena + whey opcional"],
    ["Comida: pollo + arroz/patata + verduras", "Comida: atún/huevos + legumbres", "Comida: carne magra + pasta/arroz"],
    ["Cena/snack: tortilla + verduras", "Cena/snack: queso fresco/yogur + fruta", "Cena/snack: leche/yogur + frutos secos"],
  ],
  en: [
    ["Breakfast: Greek yogurt + oats + fruit", "Breakfast: eggs + bread/potato", "Breakfast: milk + oats + optional whey"],
    ["Lunch: chicken + rice/potato + veg", "Lunch: tuna/eggs + legumes", "Lunch: lean meat + pasta/rice"],
    ["Dinner/snack: omelet + vegetables", "Dinner/snack: fresh cheese/yogurt + fruit", "Dinner/snack: milk/yogurt + nuts"],
  ],
} satisfies Record<Locale, string[][]>;

function selectedLabels(source: Record<string, boolean>, labels: string[][]) {
  return labels.flatMap((group, groupIndex) =>
    group.filter((_, itemIndex) => source[`${groupIndex}-${itemIndex}`])
  );
}

export function ProgressAutofill({ locale }: { locale: Locale }) {
  function applyDefaults(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    if (!(form instanceof HTMLFormElement)) return;

    const plan = readChecklist(`health-plan-${locale}`);
    const nutrition = readChecklist(`health-nutrition-${locale}`);
    const sessionCounts = [0, 1, 2].map((group) =>
      Object.entries(plan).filter(([id, checked]) => checked && id.startsWith(`${group}-`)).length
    );
    const bestSessionIndex = sessionCounts.reduce((best, count, index) => count > sessionCounts[best] ? index : best, 0);
    const bestCount = sessionCounts[bestSessionIndex] ?? 0;
    const session = ["A", "B", "C"][bestSessionIndex] ?? "A";
    const mealBlocksDone = [0, 1, 2].filter((group) =>
      Object.entries(nutrition).some(([id, checked]) => checked && id.startsWith(`${group}-`))
    ).length;
    const selectedMeals = selectedLabels(nutrition, mealLabels[locale]);
    const selectedExercises = selectedLabels(plan, planLabels[locale]);

    if (bestCount > 0) {
      setFieldValue(form, "session", session);
      setInputChecked(form, "completed", bestCount >= 5);
      setFieldValue(form, "difficulty", bestCount >= 5 ? "3" : "2");
      setFieldValue(form, "workoutExercisesJson", JSON.stringify(selectedExercises));
    }

    if (mealBlocksDone > 0) {
      setInputChecked(form, "proteinDone", mealBlocksDone >= 2);
      setFieldValue(form, "dayNotes", selectedMeals.join("\n"));
    }

    if (bestCount > 0 || mealBlocksDone > 0) {
      setFieldValue(form, "dayStatus", bestCount >= 5 && mealBlocksDone >= 2 ? "complete" : "partial");
      setFieldValue(form, "dayMissedReason", "none");
      setFieldValue(form, "workoutMissedReason", "none");
    }
  }

  return (
    <button type="button" className={styles.autofillButton} onClick={applyDefaults}>
      {locale === "es" ? "Autorrellenar" : "Autofill"}
    </button>
  );
}
