import Link from "next/link";
import type { HealthCheckIn, HealthProfile, HealthWorkoutLog } from "@prisma/client";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import { prisma } from "@/server/prisma";
import type { StoredUser } from "@/server/auth";
import {
  saveHealthDayProgress,
  saveHealthProfile,
} from "./actions";
import { Checklist, type ChecklistGroup } from "./Checklist";
import { GuideTabs, type GuideItem } from "./GuideTabs";
import { ProgressAutofill } from "./ProgressAutofill";
import { WeekPlanner } from "./WeekPlanner";
import { healthContent } from "./content";
import styles from "./styles.module.css";

export type HealthTab = "profile" | "plan" | "nutrition" | "guide" | "progress";

type HealthPageProps = {
  activeTab: HealthTab;
  locale: Locale;
  selectedDay?: string;
  user: StoredUser;
};

type SelectProps = {
  label: string;
  name: string;
  options: Array<[string, string]>;
  defaultValue?: string | null;
};

const tabLabels: Record<Locale, Record<HealthTab, string>> = {
  es: {
    profile: "Perfil",
    plan: "Plan",
    nutrition: "Comidas",
    guide: "Guía",
    progress: "Progreso",
  },
  en: {
    profile: "Profile",
    plan: "Plan",
    nutrition: "Meals",
    guide: "Guide",
    progress: "Progress",
  },
};

const tabPaths: Record<HealthTab, string> = {
  profile: "/account/health/profile",
  plan: "/account/health/plan",
  nutrition: "/account/health/nutrition",
  guide: "/account/health/guide",
  progress: "/account/health/progress",
};

function SelectField({ label, name, options, defaultValue }: SelectProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue ?? options[0]?.[0]}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  name,
  type = "text",
  defaultValue,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <label className={styles.fieldWide}>
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={3} />
    </label>
  );
}

function formatDate(locale: Locale, value: Date) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function monthTitle(locale: Locale, date: Date) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function sameDay(a: Date, b: Date) {
  return toDateValue(a) === toDateValue(b);
}

function recordsForDay<T extends { date: Date }>(records: T[], date: Date) {
  return records.filter((record) => sameDay(record.date, date));
}

function weeklyReview({
  locale,
  profile,
  checkIns,
  workouts,
}: {
  locale: Locale;
  profile: Pick<HealthProfile, "healthStatus" | "trainingDays">;
  checkIns: Array<Pick<HealthCheckIn, "energy" | "proteinDone">>;
  workouts: Array<Pick<HealthWorkoutLog, "completed" | "painNotes">>;
}) {
  const isEs = locale === "es";
  const avgEnergy =
    checkIns.length > 0
      ? checkIns.reduce((acc, item) => acc + item.energy, 0) / checkIns.length
      : null;
  const completedWorkouts = workouts.filter((item) => item.completed).length;
  const painLogged = workouts.some((item) => item.painNotes?.trim());
  const proteinHits = checkIns.filter((item) => item.proteinDone).length;

  if (profile.healthStatus !== "none") {
    return isEs
      ? "Modo conservador: baja intensidad y evita dolor."
      : "Conservative mode: lower intensity and avoid pain.";
  }

  if (painLogged) {
    return isEs
      ? "Molestias: baja dificultad una semana."
      : "Discomfort: reduce difficulty for one week.";
  }

  if (avgEnergy !== null && avgEnergy < 3) {
    return isEs
      ? "Energía baja: no subas volumen."
      : "Low energy: do not add volume.";
  }

  if (completedWorkouts >= profile.trainingDays && proteinHits >= 4) {
    return isEs
      ? "Base sólida: suma 1-2 reps."
      : "Solid base: add 1-2 reps.";
  }

  return isEs
    ? "Mantén el plan. Completa lo básico."
    : "Keep the plan. Complete the basics.";
}

function missedReasonLabel(locale: Locale, reason?: string | null) {
  const labels = {
    es: {
      none: "Ninguno",
      laziness: "Pereza",
      tired: "Cansancio",
      stress: "Estrés",
      no_time: "Sin tiempo",
      bad_sleep: "Mal sueño",
      bad_food: "Comida floja",
      pain: "Molestia",
      forgot: "Olvido",
      other: "Otro",
    },
    en: {
      none: "None",
      laziness: "Laziness",
      tired: "Tired",
      stress: "Stress",
      no_time: "No time",
      bad_sleep: "Bad sleep",
      bad_food: "Poor food",
      pain: "Pain",
      forgot: "Forgot",
      other: "Other",
    },
  };
  return labels[locale][(reason ?? "none") as keyof typeof labels.es] ?? labels[locale].other;
}

const missedReasonOptions = {
  es: [
    ["none", "Ninguno"],
    ["laziness", "Pereza"],
    ["tired", "Cansancio"],
    ["stress", "Estrés"],
    ["no_time", "Sin tiempo"],
    ["bad_sleep", "Mal sueño"],
    ["bad_food", "Comida floja"],
    ["pain", "Molestia"],
    ["forgot", "Olvido"],
    ["other", "Otro"],
  ],
  en: [
    ["none", "None"],
    ["laziness", "Laziness"],
    ["tired", "Tired"],
    ["stress", "Stress"],
    ["no_time", "No time"],
    ["bad_sleep", "Bad sleep"],
    ["bad_food", "Poor food"],
    ["pain", "Pain"],
    ["forgot", "Forgot"],
    ["other", "Other"],
  ],
} satisfies Record<Locale, Array<[string, string]>>;

const dayStatusOptions = {
  es: [
    ["complete", "Completo"],
    ["partial", "Parcial"],
    ["missed", "Fallado"],
  ],
  en: [
    ["complete", "Complete"],
    ["partial", "Partial"],
    ["missed", "Missed"],
  ],
} satisfies Record<Locale, Array<[string, string]>>;

function dayStatusLabel(locale: Locale, status?: string | null) {
  const labels = {
    es: {
      complete: "Completo",
      partial: "Parcial",
      missed: "Fallado",
      pending: "Pendiente",
    },
    en: {
      complete: "Complete",
      partial: "Partial",
      missed: "Missed",
      pending: "Pending",
    },
  };
  return labels[locale][(status ?? "partial") as keyof typeof labels.es] ?? labels[locale].partial;
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function PageIntro({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className={styles.pageIntro}>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

function ProfileTab({
  content,
  locale,
  profile,
}: {
  content: typeof healthContent.es;
  locale: Locale;
  profile: HealthProfile | null;
}) {
  const saveProfileAction = saveHealthProfile.bind(null, locale);
  const isEs = locale === "es";
  const optionLabel = (key: string, value?: string | null) =>
    content.options[key]?.find(([optionValue]) => optionValue === value)?.[1] ?? value ?? "-";

  const form = (
    <form action={saveProfileAction} className={styles.formGrid}>
      <InputField label={content.fields.age} name="age" type="number" defaultValue={profile?.age ?? 35} min={12} max={100} />
      <SelectField label={content.fields.sex} name="sex" options={content.options.sex} defaultValue={profile?.sex ?? "male"} />
      <InputField label={content.fields.heightCm} name="heightCm" type="number" defaultValue={profile?.heightCm ?? 173} min={120} max={230} />
      <InputField label={content.fields.weightKg} name="weightKg" type="number" step="0.1" defaultValue={profile?.weightKg ?? 73} min={30} max={250} />
      <SelectField label={content.fields.goal} name="goal" options={content.options.goal} defaultValue={profile?.goal ?? "muscle_energy"} />
      <SelectField label={content.fields.experience} name="experience" options={content.options.experience} defaultValue={profile?.experience ?? "beginner"} />
      <SelectField label={content.fields.healthStatus} name="healthStatus" options={content.options.healthStatus} defaultValue={profile?.healthStatus ?? "none"} />
      <SelectField label={content.fields.activityLevel} name="activityLevel" options={content.options.activityLevel} defaultValue={profile?.activityLevel ?? "sedentary"} />
      <InputField label={content.fields.trainingDays} name="trainingDays" type="number" defaultValue={profile?.trainingDays ?? 3} min={1} max={6} />
      <SelectField label={content.fields.sessionLength} name="sessionLength" options={content.options.sessionLength} defaultValue={profile?.sessionLength ?? "35_45"} />
      <SelectField label={content.fields.equipment} name="equipment" options={content.options.equipment} defaultValue={profile?.equipment ?? "bands_pullup_bar"} />
      <SelectField label={content.fields.sleepQuality} name="sleepQuality" options={content.options.sleepQuality} defaultValue={profile?.sleepQuality ?? "good"} />
      <SelectField label={content.fields.dietPattern} name="dietPattern" options={content.options.dietPattern} defaultValue={profile?.dietPattern ?? "low_protein_disordered"} />
      <SelectField label={content.fields.dietRestrictions} name="dietRestrictions" options={content.options.dietRestrictions} defaultValue={profile?.dietRestrictions ?? "none"} />
      <SelectField label={content.fields.trackingStyle} name="trackingStyle" options={content.options.trackingStyle} defaultValue={profile?.trackingStyle ?? "simple_habits"} />
      <TextAreaField label={content.fields.healthNotes} name="healthNotes" defaultValue={profile?.healthNotes} />
      <div className={styles.actions}>
        <button type="submit">{profile ? content.updateProfile : content.saveProfile}</button>
      </div>
    </form>
  );

  if (profile) {
    return (
      <div className={styles.stack}>
        <section className={styles.section}>
          <PageIntro
            title={isEs ? "Plan actual" : "Current plan"}
          />
          <div className={styles.profileSummaryGrid}>
            <article><span>{content.fields.goal}</span><strong>{optionLabel("goal", profile.goal)}</strong></article>
            <article><span>{content.fields.experience}</span><strong>{optionLabel("experience", profile.experience)}</strong></article>
            <article><span>{content.fields.trainingDays}</span><strong>{profile.trainingDays}</strong></article>
            <article><span>{content.fields.sessionLength}</span><strong>{optionLabel("sessionLength", profile.sessionLength)}</strong></article>
            <article><span>{content.fields.equipment}</span><strong>{optionLabel("equipment", profile.equipment)}</strong></article>
            <article><span>{content.fields.sleepQuality}</span><strong>{optionLabel("sleepQuality", profile.sleepQuality)}</strong></article>
            <article><span>{content.fields.dietPattern}</span><strong>{optionLabel("dietPattern", profile.dietPattern)}</strong></article>
            <article><span>{content.fields.healthStatus}</span><strong>{optionLabel("healthStatus", profile.healthStatus)}</strong></article>
          </div>
          <div className={styles.profilePlanNote}>
            <strong>{isEs ? "Plan base" : "Base plan"}</strong>
            <p>
              {isEs
                ? `${profile.trainingDays} días · ${optionLabel("sessionLength", profile.sessionLength)} · proteína diaria.`
                : `${profile.trainingDays} days · ${optionLabel("sessionLength", profile.sessionLength)} · daily protein.`}
            </p>
          </div>
        </section>

        <details className={styles.editProfilePanel}>
          <summary>{isEs ? "Editar" : "Edit"}</summary>
          <section className={styles.section}>
            <PageIntro title={content.onboardingTitle} body={content.onboardingLead} />
            {form}
          </section>
        </details>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <PageIntro
        title={content.onboardingTitle}
        body={content.onboardingLead}
      />
      {form}
    </section>
  );
}

function PlanTab({ locale }: { locale: Locale }) {
  const isEs = locale === "es";
  const guide = (hash: string) => localizePath(locale, `/account/health/guide#${hash}`);
  const info = {
    warmup: isEs
      ? "Cadera, espalda alta y hombros. Calienta sin cansarte."
      : "Hips, upper back and shoulders. Warm up without fatigue.",
    squat: isEs
      ? "Pies firmes, rodillas alineadas, baja con control."
      : "Firm feet, knees aligned, lower with control.",
    push: isEs
      ? "Cuerpo en bloque. Si pierdes postura, usa mesa."
      : "Body as one line. Use a table if posture breaks.",
    row: isEs
      ? "Pecho alto. Tira con codos, no con cuello."
      : "Chest tall. Pull with elbows, not neck.",
    bridge: isEs
      ? "Aprieta glúteos arriba. No arquees lumbar."
      : "Squeeze glutes at the top. Do not arch low back.",
    core: isEs
      ? "Costillas abajo. Reduce si arqueas espalda."
      : "Ribs down. Reduce if your back arches.",
    lunge: isEs
      ? "Paso estable, rodilla alineada. Usa pared si hace falta."
      : "Stable step, knee aligned. Use a wall if needed.",
    hinge: isEs
      ? "Cadera atrás, espalda neutra. Si notas lumbar, reduce."
      : "Hips back, neutral spine. Reduce if low back works.",
    pullup: isEs
      ? "Sube con ayuda y baja lento. Pocas limpias bastan."
      : "Use help up and lower slowly. Few clean reps are enough.",
  };
  const groups: ChecklistGroup[] = isEs
    ? [
        {
          title: "Sesión A",
          items: [
            { text: "Calentar 5 min.", href: guide("calentamiento"), info: info.warmup },
            { text: "Sentadilla 3x8-12.", href: guide("sentadilla"), info: info.squat },
            { text: "Flexiones 3x6-12.", href: guide("flexiones"), info: info.push },
            { text: "Remo banda 3x10-15.", href: guide("remo"), info: info.row },
            { text: "Puente glúteo 3x12-15.", href: guide("puente"), info: info.bridge },
            { text: "Plancha 3x20-40s.", href: guide("core"), info: info.core },
          ],
        },
        {
          title: "Sesión B",
          items: [
            { text: "Calentar 5 min.", href: guide("calentamiento"), info: info.warmup },
            { text: "Zancadas 3x8-10/lado.", href: guide("zancadas"), info: info.lunge },
            { text: "Flexión inclinada o lenta 3x6-12.", href: guide("flexiones"), info: info.push },
            { text: "Remo bajo mesa o banda 3x8-12.", href: guide("remo"), info: info.row },
            { text: "Bisagra 3x12.", href: guide("bisagra"), info: info.hinge },
            { text: "Dead bug 3x8/lado.", href: guide("core"), info: info.core },
          ],
        },
        {
          title: "Sesión C",
          items: [
            { text: "Calentar sin molestias.", href: guide("calentamiento"), info: info.warmup },
            { text: "Sentadilla tempo 3x10.", href: guide("sentadilla"), info: info.squat },
            { text: "Pike push-up o flexión 3x6-10.", href: guide("flexiones"), info: info.push },
            { text: "Dominada/remo 4x5-8.", href: guide("dominadas"), info: info.pullup },
            { text: "Puente unilateral 3x8/lado.", href: guide("puente"), info: info.bridge },
            { text: "Side plank 3x20-35s/lado.", href: guide("core"), info: info.core },
          ],
        },
      ]
    : [
        {
          title: "Session A",
          items: [
            { text: "Warm up 5 min.", href: guide("warmup"), info: info.warmup },
            { text: "Squat 3x8-12.", href: guide("squat"), info: info.squat },
            { text: "Push-ups 3x6-12.", href: guide("pushups"), info: info.push },
            { text: "Band row 3x10-15.", href: guide("row"), info: info.row },
            { text: "Glute bridge 3x12-15.", href: guide("bridge"), info: info.bridge },
            { text: "Plank 3x20-40s.", href: guide("core"), info: info.core },
          ],
        },
        {
          title: "Session B",
          items: [
            { text: "Warm up 5 min.", href: guide("warmup"), info: info.warmup },
            { text: "Lunges 3x8-10/side.", href: guide("lunges"), info: info.lunge },
            { text: "Incline or slow push-up 3x6-12.", href: guide("pushups"), info: info.push },
            { text: "Table or band row 3x8-12.", href: guide("row"), info: info.row },
            { text: "Hip hinge 3x12.", href: guide("hinge"), info: info.hinge },
            { text: "Dead bug 3x8/side.", href: guide("core"), info: info.core },
          ],
        },
        {
          title: "Session C",
          items: [
            { text: "Warm up pain-free.", href: guide("warmup"), info: info.warmup },
            { text: "Tempo squat 3x10.", href: guide("squat"), info: info.squat },
            { text: "Pike push-up or push-up 3x6-10.", href: guide("pushups"), info: info.push },
            { text: "Pull-up/row 4x5-8.", href: guide("pullups"), info: info.pullup },
            { text: "Single-leg bridge 3x8/side.", href: guide("bridge"), info: info.bridge },
            { text: "Side plank 3x20-35s/side.", href: guide("core"), info: info.core },
          ],
        },
      ];

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <PageIntro
          title={isEs ? "Fuerza simple" : "Simple strength"}
          body={isEs ? "3 sesiones. Alterna días y registra dificultad." : "3 sessions. Alternate days and log difficulty."}
        />
        <WeekPlanner locale={locale} />
        <Checklist
          storageKey={`health-plan-${locale}`}
          groups={groups}
          markAllLabel={isEs ? "Marcar todas" : "Check all"}
          clearAllLabel={isEs ? "Limpiar" : "Clear"}
        />
      </section>
      <section className={styles.section}>
        <h2>{isEs ? "Progresión" : "Progression"}</h2>
        <ol className={styles.stepsList}>
          {(isEs
            ? [
                "Completa la semana.",
                "Luego sube reps o dificultad.",
                "Con dolor o baja energía, reduce.",
                "Cada 4 semanas, semana fácil.",
              ]
            : [
                "Complete the week.",
                "Then add reps or difficulty.",
                "With pain or low energy, reduce.",
                "Every 4 weeks, easy week.",
              ]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function NutritionTab({ locale }: { locale: Locale }) {
  const isEs = locale === "es";
  const guide = (hash: string) => localizePath(locale, `/account/health/guide#${hash}`);
  const foodInfo = {
    amounts: isEs
      ? "Rangos orientativos. Ajusta por hambre y peso."
      : "Guide ranges. Adjust by appetite and weight.",
    protein: isEs
      ? "Busca 35-50 g por comida."
      : "Aim for 35-50 g per meal.",
    plate: isEs
      ? "Base: proteína + carbo + verdura + aceite."
      : "Base: protein + carbs + veg + oil.",
    calories: isEs
      ? "Si el peso no sube, añade 250-350 kcal."
      : "If weight stalls, add 250-350 kcal.",
  };
  const mealGroups: ChecklistGroup[] = isEs
    ? [
        {
          title: "Desayunos: elige 1",
          items: [
            { text: "Yogur 250 g + avena 50-70 g + fruta.", href: guide("cantidades-comida"), info: foodInfo.amounts },
            { text: "3 huevos + pan 80-100 g o patata 250 g.", href: guide("huevos"), info: foodInfo.protein },
            { text: "Leche 300 ml + avena 60 g + whey opcional.", href: guide("proteina"), info: foodInfo.protein },
          ],
        },
        {
          title: "Comidas: elige 1",
          items: [
            { text: "Pollo 150-220 g + arroz/patata + verduras.", href: guide("plato-base"), info: foodInfo.plate },
            { text: "Atún 1-2 latas o 3 huevos + legumbres.", href: guide("plato-base"), info: foodInfo.plate },
            { text: "Carne magra 150-200 g + pasta/arroz.", href: guide("plato-base"), info: foodInfo.plate },
          ],
        },
        {
          title: "Cenas/snacks: elige según hambre",
          items: [
            { text: "Tortilla 3 huevos + verduras.", href: guide("cena"), info: foodInfo.plate },
            { text: "Queso fresco 200-250 g o yogur + fruta.", href: guide("proteina"), info: foodInfo.protein },
            { text: "Leche/yogur + frutos secos 15-25 g.", href: guide("ajuste-calorias"), info: foodInfo.calories },
          ],
        },
      ]
    : [
        {
          title: "Breakfasts: choose 1",
          items: [
            { text: "Greek yogurt 250 g + oats 50-70 g + fruit.", href: guide("food-amounts"), info: foodInfo.amounts },
            { text: "3 eggs + bread 80-100 g or potato 250 g + 1 fruit.", href: guide("eggs"), info: foodInfo.protein },
            { text: "Milk 300 ml + oats 60 g + optional whey.", href: guide("protein"), info: foodInfo.protein },
          ],
        },
        {
          title: "Lunches: choose 1",
          items: [
            { text: "Chicken 150-220 g + rice/potato + veg.", href: guide("base-plate"), info: foodInfo.plate },
            { text: "Tuna 1-2 cans or 3 eggs + legumes.", href: guide("base-plate"), info: foodInfo.plate },
            { text: "Lean meat 150-200 g + pasta/rice.", href: guide("base-plate"), info: foodInfo.plate },
          ],
        },
        {
          title: "Dinners/snacks: choose by hunger",
          items: [
            { text: "Three-egg omelet + vegetables.", href: guide("dinner"), info: foodInfo.plate },
            { text: "Fresh cheese 200-250 g or yogurt + fruit.", href: guide("protein"), info: foodInfo.protein },
            { text: "Milk/yogurt + nuts 15-25 g.", href: guide("calorie-adjustment"), info: foodInfo.calories },
          ],
        },
      ];

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <PageIntro
          title={isEs ? "Dieta base" : "Base diet"}
          body={isEs ? "Marca 1 opción por bloque." : "Check 1 option per block."}
        />
        <div className={styles.metricGrid}>
          <div><strong>120-150 g</strong><span>{isEs ? "proteína/día" : "protein/day"}</span></div>
          <div><strong>3</strong><span>{isEs ? "comidas base" : "base meals"}</span></div>
          <div><strong>250-350</strong><span>{isEs ? "kcal extra" : "extra kcal"}</span></div>
        </div>
      </section>
      <section className={styles.section}>
        <h2>{isEs ? "Comidas" : "Meals"}</h2>
        <Checklist
          storageKey={`health-nutrition-${locale}`}
          groups={mealGroups}
          mode="singlePerGroup"
        />
      </section>
      <section className={styles.section}>
        <h2>{isEs ? "Compra" : "Shopping"}</h2>
        <p className={styles.muted}>
          {isEs
            ? "Huevos, yogur, pollo, atún, legumbres, arroz, patata, avena, fruta y verduras."
            : "Eggs, yogurt, chicken, tuna, legumes, rice, potato, oats, fruit and vegetables."}
        </p>
      </section>
    </div>
  );
}

function GuideTab({ locale }: { locale: Locale }) {
  const isEs = locale === "es";
  const planHref = localizePath(locale, "/account/health/plan");
  const nutritionHref = localizePath(locale, "/account/health/nutrition");
  const rawGuides: Array<[string, string, string, string, string[], string]> = isEs
    ? [
        ["calentamiento", "Movilidad", "Calentamiento", "Prepara sin cansarte.", ["Cadera: 6-8 círculos.", "Espalda alta: 8 rotaciones.", "Hombros: 10 círculos.", "1 serie fácil."], planHref],
        ["sentadilla", "Técnica", "Sentadilla", "Control antes que profundidad.", ["Pies cómodos.", "Rodillas alineadas.", "Talones apoyados.", "Espalda neutra.", "Empuja el suelo."], planHref],
        ["flexiones", "Técnica", "Flexiones", "Empuje de torso.", ["Manos bajo hombros.", "Cuerpo en bloque.", "Baja controlado.", "Usa mesa si hace falta."], planHref],
        ["remo", "Técnica", "Remo", "Tirón para espalda y postura. Evita tirar con cuello.", ["Pecho alto.", "Hombros lejos de orejas.", "Tira con codos.", "Pausa 1 segundo atrás.", "La banda debe permitir 10 repeticiones limpias."], planHref],
        ["zancadas", "Técnica", "Zancadas", "Pierna unilateral para fuerza útil y estabilidad.", ["Da un paso estable.", "Baja vertical sin colapsar rodilla.", "Rodilla delantera alineada con el pie.", "Empuja con toda la planta.", "Apóyate en pared si pierdes equilibrio."], planHref],
        ["bisagra", "Técnica", "Bisagra de cadera", "Aprende a usar cadera, glúteos e isquios sin cargar lumbar.", ["Cadera atrás.", "Rodillas suaves.", "Espalda neutra.", "Siente tensión en isquios/glúteo.", "Si notas lumbar, reduce rango."], planHref],
        ["puente", "Técnica", "Puente de glúteo", "Compensa sedentarismo y prepara bisagra/zancadas.", ["Talones cerca de glúteos.", "Sube cadera apretando glúteos.", "Pausa arriba 1 segundo.", "No arquees la espalda.", "Baja controlado."], planHref],
        ["dominadas", "Técnica", "Dominadas asistidas/negativas", "Pocas repeticiones limpias valen más que muchas desordenadas.", ["Empieza con hombros controlados.", "Sube con ayuda si hace falta.", "Baja en 3-5 segundos.", "No fuerces cuello.", "Para al perder control."], planHref],
        ["core", "Técnica", "Core", "El objetivo es resistir movimiento, no sufrir cuello.", ["Costillas abajo.", "Respiración lenta.", "Abdomen activo.", "Reduce rango si se arquea la espalda.", "Mejor corto y limpio que largo y roto."], planHref],
        ["cantidades-comida", "Comidas", "Cantidades", "Usa rangos.", ["Bajo si poca hambre.", "Alto si no sube peso.", "Arroz/pasta en seco.", "Legumbres cocidas."], nutritionHref],
        ["plato-base", "Comidas", "Plato base", "Estructura simple para no improvisar cada día.", ["Proteína: 150-220 g.", "Carbohidrato: arroz/pasta 80-110 g seco o patata 300-450 g.", "Verduras: 1-2 puñados.", "Aceite: 10-15 g.", "Cocina 2-3 raciones juntas si puedes."], nutritionHref],
        ["proteina", "Comidas", "Proteína diaria", "La proteína es el ancla para ganar músculo.", ["Objetivo: 120-150 g al día.", "Reparte en 3 comidas.", "35-50 g por comida es suficiente.", "Whey no es obligatoria.", "Si una comida queda corta, añade yogur, queso fresco o huevos."], nutritionHref],
        ["huevos", "Comidas", "Huevos", "Opción simple, barata y rápida.", ["3 huevos sirven como comida rápida.", "Si quieres más proteína con menos grasa, usa 2 huevos + claras.", "Combina con pan, patata o fruta según hambre.", "Añade verduras para volumen y micronutrientes."], nutritionHref],
        ["cena", "Comidas", "Cena", "La cena no tiene que ser mínima si eso te hace picar después.", ["Proteína + verdura como base.", "Añade carbohidrato si entrenaste.", "Tortilla, yogur/queso fresco o pollo son opciones fáciles.", "Evita complicarla: repetible gana."], nutritionHref],
        ["ajuste-calorias", "Comidas", "Calorías", "Ajusta por tendencia.", ["Mira 2-3 semanas.", "Si no sube, añade 250-350 kcal.", "Usa comida simple.", "No subas todo a la vez."], nutritionHref],
      ]
    : [
        ["warmup", "Mobility", "Warm-up", "Prepare without fatigue.", ["Hips.", "Upper back.", "Shoulders.", "One easy set."], planHref],
        ["squat", "Technique", "Squat", "Controlled lower-body base pattern.", ["Feet comfortable.", "Knees track toes.", "Heels down.", "Neutral spine.", "Push the floor."], planHref],
        ["pushups", "Technique", "Push-ups", "Upper-body push.", ["Hands under shoulders.", "Body as one line.", "Lower with control.", "Use incline if needed."], planHref],
        ["row", "Technique", "Row", "Back and posture.", ["Chest tall.", "Shoulders away from ears.", "Pull with elbows.", "Pause at the back."], planHref],
        ["lunges", "Technique", "Lunges", "Single-leg strength.", ["Stable step.", "Knee aligned.", "Push through the whole foot."], planHref],
        ["hinge", "Technique", "Hip hinge", "Use hips without loading low back.", ["Hips back.", "Neutral spine.", "Feel hamstrings/glutes."], planHref],
        ["bridge", "Technique", "Glute bridge", "Glute activation.", ["Heels close.", "Squeeze glutes.", "No low-back arch."], planHref],
        ["pullups", "Technique", "Assisted pull-ups", "Controlled pulling.", ["Use help.", "Lower 3-5 seconds.", "Stop when control breaks."], planHref],
        ["core", "Technique", "Core", "Resist movement.", ["Ribs down.", "Slow breathing.", "Reduce range if back arches."], planHref],
        ["food-amounts", "Meals", "Food amounts", "Use ranges.", ["Low range if appetite is low.", "High range if weight is not rising.", "Rice/pasta dry; legumes cooked."], nutritionHref],
        ["base-plate", "Meals", "Base plate", "Simple meal structure.", ["Protein 150-220 g.", "Carbs.", "Vegetables.", "Oil 10-15 g."], nutritionHref],
        ["protein", "Meals", "Daily protein", "Muscle anchor.", ["120-150 g/day.", "Split across 3 meals.", "Whey optional."], nutritionHref],
        ["eggs", "Meals", "Eggs", "Simple protein option.", ["3 eggs.", "Add whites for more protein.", "Pair with carbs/fruit."], nutritionHref],
        ["dinner", "Meals", "Dinner", "Keep it repeatable.", ["Protein.", "Vegetables.", "Carbs if trained/hungry."], nutritionHref],
        ["calorie-adjustment", "Meals", "Calorie adjustment", "Adjust only after trend.", ["Wait 2-3 weeks.", "Add 250-350 kcal/day.", "Use simple foods."], nutritionHref],
      ];
  const guides: GuideItem[] = rawGuides.map(([id, category, title, body, steps, backHref]) => ({
    id,
    category,
    title,
    body,
    steps,
    backHref,
  }));
  const groups = isEs ? ["Técnica", "Movilidad", "Comidas"] : ["Technique", "Mobility", "Meals"];

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <GuideTabs locale={locale} items={guides} categories={groups} />
      </section>
    </div>
  );
}

const sessionExercises = {
  es: {
    A: ["Calentamiento", "Sentadilla", "Flexiones", "Remo con banda", "Puente de glúteo", "Plancha"],
    B: ["Calentamiento", "Zancadas", "Flexión inclinada", "Remo bajo mesa/banda", "Bisagra", "Dead bug"],
    C: ["Calentamiento", "Sentadilla tempo", "Pike push-up o flexión", "Dominada asistida o remo", "Puente unilateral", "Side plank"],
  },
  en: {
    A: ["Warm-up", "Squat", "Push-ups", "Band row", "Glute bridge", "Plank"],
    B: ["Warm-up", "Lunges", "Incline push-up", "Table/band row", "Hip hinge", "Dead bug"],
    C: ["Warm-up", "Tempo squat", "Pike push-up or push-up", "Assisted pull-up or row", "Single-leg bridge", "Side plank"],
  },
} satisfies Record<Locale, Record<string, string[]>>;

function visualDayStatus({
  checkIn,
  date,
  today,
  workout,
}: {
  checkIn?: HealthCheckIn;
  date: Date;
  today: Date;
  workout?: HealthWorkoutLog;
}) {
  const isFuture = date > today && !sameDay(date, today);
  if (checkIn?.dayStatus) return checkIn.dayStatus;
  if (isFuture) return "pending";
  if (workout?.completed && checkIn?.proteinDone) return "complete";
  if (checkIn || workout) return "partial";
  return "missed";
}

function normalizedSession(value?: string | null) {
  return value === "B" || value === "C" ? value : "A";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function ProgressTab({
  content,
  locale,
  profile,
  checkIns,
  workoutLogs,
  review,
  selectedDay,
}: {
  content: typeof healthContent.es;
  locale: Locale;
  profile: HealthProfile | null;
  checkIns: HealthCheckIn[];
  workoutLogs: HealthWorkoutLog[];
  review: string;
  selectedDay: string;
}) {
  const saveDayAction = saveHealthDayProgress.bind(null, locale);
  const isEs = locale === "es";
  const today = new Date();
  const selectedDate = parseDateValue(selectedDay);
  const selectedValue = toDateValue(selectedDate);
  const month = monthDays(selectedDate);
  const previousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1, 12);
  const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1, 12);
  const selectedCheckIn = recordsForDay(checkIns, selectedDate)[0];
  const selectedWorkout = recordsForDay(workoutLogs, selectedDate)[0];
  const recent30 = checkIns.slice(0, 30);
  const recentWorkouts30 = workoutLogs.slice(0, 30);
  const workoutsExpected30 = Math.max(1, Math.round((profile?.trainingDays ?? 3) * 4.3));
  const workoutsDone30 = recentWorkouts30.filter((item) => item.completed).length;
  const missingDays7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return recordsForDay(checkIns, date).length === 0 ? 1 : 0;
  }).reduce<number>((sum, value) => sum + value, 0);
  const reasonCounts = recent30.reduce<Record<string, number>>((acc, item) => {
    if (item.missedReason && item.missedReason !== "none") {
      acc[item.missedReason] = (acc[item.missedReason] ?? 0) + 1;
    }
    return acc;
  }, {});
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
  const energyAvg = average(recent30.map((item) => item.energy));
  const sleepAvg = average(recent30.map((item) => item.sleepHours));
  const stepsAvg = average(recent30.map((item) => item.steps));
  const proteinPct = pct(recent30.filter((item) => item.proteinDone).length, recent30.length || 1);
  const mobilityPct = pct(recent30.filter((item) => item.mobilityDone).length, recent30.length || 1);
  const workoutPct = pct(workoutsDone30, workoutsExpected30);
  const selectedDayStatus = visualDayStatus({
    checkIn: selectedCheckIn,
    date: selectedDate,
    today,
    workout: selectedWorkout,
  });
  const selectedHasData = Boolean(selectedCheckIn || selectedWorkout);
  const selectedSession = normalizedSession(selectedWorkout?.session);
  const savedExercises = stringArray(selectedWorkout?.exercises);
  const plannedExercises = savedExercises.length > 0 ? savedExercises : sessionExercises[locale][selectedSession];
  const savedMeals = selectedCheckIn?.notes
    ?.split("\n")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
  const diagnosis =
    topReason === "bad_sleep" || (sleepAvg !== null && sleepAvg < 7)
      ? {
          title: isEs ? "Fallo: sueño" : "Issue: sleep",
          damage: isEs ? "Peor recuperación y energía." : "Worse recovery and energy.",
          action: isEs ? "Mínimo: proteína + dormir antes." : "Minimum: protein + earlier sleep.",
        }
      : topReason === "laziness"
        ? {
            title: isEs ? "Fallo: pereza" : "Issue: laziness",
            damage: isEs ? "Rompe la constancia." : "Breaks consistency.",
            action: isEs ? "Mínimo: 10 min + 1 serie." : "Minimum: 10 min + 1 set.",
          }
        : missingDays7 >= 2
          ? {
              title: isEs ? "Fallo: sin registro" : "Issue: no logs",
              damage: isEs ? "Pierdes datos útiles." : "You lose useful data.",
              action: isEs ? "Mínimo: registra parcial." : "Minimum: log partial.",
            }
          : {
              title: isEs ? "Base estable" : "Stable base",
              damage: isEs ? "No lo compliques." : "Do not overcomplicate.",
              action: isEs ? "Mínimo: completa la semana." : "Minimum: complete the week.",
            };
  const metrics = [
    [isEs ? "Entrenos" : "Workouts", `${workoutsDone30}/${workoutsExpected30}`, workoutPct],
    [isEs ? "Proteína" : "Protein", `${proteinPct}%`, proteinPct],
    [isEs ? "Movilidad" : "Mobility", `${mobilityPct}%`, mobilityPct],
    [isEs ? "Energía" : "Energy", energyAvg ? `${energyAvg.toFixed(1)}/5` : "-", energyAvg ? pct(energyAvg, 5) : 0],
    [isEs ? "Sueño" : "Sleep", sleepAvg ? `${sleepAvg.toFixed(1)}h` : "-", sleepAvg ? pct(Math.min(sleepAvg, 8), 8) : 0],
    [isEs ? "Pasos" : "Steps", stepsAvg ? `${Math.round(stepsAvg)}` : "-", stepsAvg ? pct(Math.min(stepsAvg, 9000), 9000) : 0],
  ] as const;

  return (
    <div className={styles.stack}>
      <section className={`${styles.section} ${styles.progressCalendarSection}`}>
        <div className={styles.calendarHeader}>
          <h2>{monthTitle(locale, selectedDate)}</h2>
          <div>
            <Link href={localizePath(locale, `/account/health/progress?day=${toDateValue(previousMonth)}`)}>
              {isEs ? "Anterior" : "Previous"}
            </Link>
            <Link href={localizePath(locale, `/account/health/progress?day=${toDateValue(today)}`)}>
              {isEs ? "Hoy" : "Today"}
            </Link>
            <Link href={localizePath(locale, `/account/health/progress?day=${toDateValue(nextMonth)}`)}>
              {isEs ? "Siguiente" : "Next"}
            </Link>
          </div>
        </div>
        <div className={styles.monthCalendar}>
          {month.map((date) => {
            const value = toDateValue(date);
            const dayCheckIns = recordsForDay(checkIns, date);
            const dayWorkouts = recordsForDay(workoutLogs, date);
            const checkIn = dayCheckIns[0];
            const workout = dayWorkouts[0];
            const status = visualDayStatus({ checkIn, date, today, workout });
            const reason = checkIn?.missedReason && checkIn.missedReason !== "none" ? missedReasonLabel(locale, checkIn.missedReason) : "";
            return (
              <Link
                key={value}
                href={localizePath(locale, `/account/health/progress?day=${value}`)}
                className={`${styles.calendarDay} ${styles[`status_${status}`]} ${date.getMonth() !== selectedDate.getMonth() ? styles.outsideMonth : ""} ${selectedValue === value ? styles.selectedCalendarDay : ""}`}
              >
                <span>{date.getDate()}</span>
                <strong>{sameDay(date, today) ? (isEs ? "Hoy" : "Today") : workout?.completed ? `S${workout.session}` : checkIn?.proteinDone ? "Prot" : ""}</strong>
                {reason ? <small>{reason}</small> : null}
              </Link>
            );
          })}
        </div>
      </section>
      <section className={`${styles.section} ${styles.progressLogSection}`}>
        <h2>{isEs ? `Detalle - ${formatDate(locale, selectedDate)}` : `Details - ${formatDate(locale, selectedDate)}`}</h2>
        <div className={styles.daySummary}>
          <article>
            <span>{isEs ? "Estado" : "Status"}</span>
            <strong>{selectedHasData ? dayStatusLabel(locale, selectedDayStatus) : isEs ? "Sin datos" : "No data"}</strong>
          </article>
          <article>
            <span>{isEs ? "Entreno" : "Workout"}</span>
            <strong>{selectedWorkout?.completed ? (isEs ? "Hecho" : "Done") : "-"}</strong>
          </article>
          <article>
            <span>{isEs ? "Proteína" : "Protein"}</span>
            <strong>{selectedCheckIn?.proteinDone ? "OK" : "-"}</strong>
          </article>
          <article>
            <span>{isEs ? "Movilidad" : "Mobility"}</span>
            <strong>{selectedCheckIn?.mobilityDone ? "OK" : "-"}</strong>
          </article>
          <article>
            <span>{isEs ? "Energía" : "Energy"}</span>
            <strong>{selectedCheckIn?.energy ? `${selectedCheckIn.energy}/5` : "-"}</strong>
          </article>
          <article>
            <span>{isEs ? "Sueño" : "Sleep"}</span>
            <strong>{selectedCheckIn?.sleepHours ? `${selectedCheckIn.sleepHours}h` : "-"}</strong>
          </article>
        </div>
        <div className={styles.dayDetailGrid}>
          <article className={styles.detailCard}>
            <h3>{isEs ? "Comidas" : "Meals"}</h3>
            <ul>
              <li>{selectedCheckIn?.proteinDone ? (isEs ? "Proteína marcada" : "Protein checked") : (isEs ? "Proteína sin marcar" : "Protein not checked")}</li>
              {savedMeals.length > 0 ? (
                savedMeals.map((meal) => <li key={meal}>{meal}</li>)
              ) : (
                <li>{isEs ? "Sin comidas concretas guardadas." : "No specific meals saved."}</li>
              )}
            </ul>
          </article>
          <article className={styles.detailCard}>
            <h3>{isEs ? "Entreno" : "Workout"}</h3>
            <ul>
              <li>{isEs ? `Sesión ${selectedSession}` : `Session ${selectedSession}`}: {selectedWorkout?.completed ? (isEs ? "completada" : "completed") : (isEs ? "no completada" : "not completed")}</li>
              {plannedExercises.map((exercise) => (
                <li key={exercise}>{exercise}</li>
              ))}
              {selectedWorkout?.painNotes ? <li>{selectedWorkout.painNotes}</li> : null}
            </ul>
          </article>
          <article className={styles.detailCard}>
            <h3>{isEs ? "Hábitos" : "Habits"}</h3>
            <ul>
              <li>{isEs ? "Estado" : "Status"}: {selectedHasData ? dayStatusLabel(locale, selectedDayStatus) : isEs ? "Sin datos" : "No data"}</li>
              <li>{isEs ? "Pasos" : "Steps"}: {selectedCheckIn?.steps ?? "-"}</li>
              <li>{isEs ? "Movilidad" : "Mobility"}: {selectedCheckIn?.mobilityDone ? "OK" : "-"}</li>
              <li>{isEs ? "Motivo" : "Reason"}: {missedReasonLabel(locale, selectedCheckIn?.missedReason ?? selectedWorkout?.missedReason ?? "none")}</li>
            </ul>
          </article>
        </div>

        <details className={styles.editDayPanel}>
          <summary>{isEs ? "Editar día" : "Edit day"}</summary>
          <form action={saveDayAction} className={styles.combinedProgressForm}>
            <input type="hidden" name="date" value={selectedValue} />
            <div className={styles.progressTools}>
              <span>{isEs ? "Rellenar desde Plan/Comidas." : "Fill from Plan/Meals."}</span>
              <ProgressAutofill locale={locale} />
            </div>
            <input
              type="hidden"
              name="workoutExercisesJson"
              defaultValue={JSON.stringify(savedExercises)}
            />

            <div className={styles.formSubsection}>
              <h3>{isEs ? "Hábitos" : "Habits"}</h3>
              <div className={styles.formGrid}>
                <InputField label={content.fields.weightKg} name="weightKg" type="number" step="0.1" defaultValue={selectedCheckIn?.weightKg ?? profile?.weightKg ?? ""} />
                <SelectField label={isEs ? "Estado" : "Status"} name="dayStatus" options={dayStatusOptions[locale]} defaultValue={selectedCheckIn?.dayStatus ?? "partial"} />
                <SelectField label={isEs ? "Motivo" : "Reason"} name="dayMissedReason" options={missedReasonOptions[locale]} defaultValue={selectedCheckIn?.missedReason ?? "none"} />
                <SelectField label={content.fields.sleepHours} name="sleepHours" options={[["6", "< 6h"], ["7", "7h"], ["8", "8h"], ["9", "9h+"]]} defaultValue={selectedCheckIn?.sleepHours?.toString() ?? "8"} />
                <SelectField label={content.fields.steps} name="steps" options={[["3000", "< 4k"], ["6000", "4k-7k"], ["8000", "7k-9k"], ["10000", "9k+"]]} defaultValue={selectedCheckIn?.steps?.toString() ?? "6000"} />
                <div className={styles.choiceField}>
                  <span>{content.fields.energy}</span>
                  <div className={styles.choiceGrid}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value}><input type="radio" name="energy" value={value} defaultChecked={(selectedCheckIn?.energy ?? 3) === value} /> {value}</label>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.toggleRow}>
                <label className={styles.checkbox}><input name="proteinDone" type="checkbox" defaultChecked={selectedCheckIn?.proteinDone ?? false} /> {isEs ? "Proteína suficiente" : "Enough protein"}</label>
                <label className={styles.checkbox}><input name="mobilityDone" type="checkbox" defaultChecked={selectedCheckIn?.mobilityDone ?? false} /> {isEs ? "Movilidad hecha" : "Mobility done"}</label>
              </div>
            </div>

            <div className={styles.formSubsection}>
              <h3>{isEs ? "Entrenamiento" : "Workout"}</h3>
              <div className={styles.formGrid}>
                <SelectField label={content.fields.session} name="session" options={content.options.session} defaultValue={selectedWorkout?.session ?? "A"} />
                <SelectField label={isEs ? "Motivo" : "Reason"} name="workoutMissedReason" options={missedReasonOptions[locale]} defaultValue={selectedWorkout?.missedReason ?? "none"} />
                <label className={styles.checkbox}><input name="completed" type="checkbox" defaultChecked={selectedWorkout?.completed ?? true} /> {content.fields.completed}</label>
                <div className={styles.choiceField}>
                  <span>{content.fields.difficulty}</span>
                  <div className={styles.choiceGrid}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value}><input type="radio" name="difficulty" value={value} defaultChecked={(selectedWorkout?.difficulty ?? 3) === value} /> {value}</label>
                    ))}
                  </div>
                </div>
                <details className={styles.optionalNotes}>
                  <summary>{isEs ? "Notas" : "Notes"}</summary>
                  <TextAreaField label={content.fields.painNotes} name="painNotes" defaultValue={selectedWorkout?.painNotes} />
                  <TextAreaField label={isEs ? "Día" : "Day"} name="dayNotes" defaultValue={selectedCheckIn?.notes} />
                  <TextAreaField label={isEs ? "Entreno" : "Workout"} name="workoutNotes" defaultValue={selectedWorkout?.notes} />
                </details>
              </div>
            </div>

            <button type="submit">{isEs ? "Guardar día" : "Save day"}</button>
          </form>
        </details>
      </section>
      <section className={`${styles.section} ${styles.progressOverview}`}>
        <div className={styles.compactDiagnosis}>
          <h2>{diagnosis.title}</h2>
          <p>{diagnosis.damage}</p>
          <strong>{diagnosis.action}</strong>
          <small>{review}</small>
        </div>
        <div className={styles.metricCards}>
          {metrics.map(([label, value, percentValue]) => (
            <article key={label} className={styles.metricCard}>
              <span>{label}</span>
              <strong>{value}</strong>
              <div className={styles.metricTrack}>
                <div style={{ width: `${Math.max(0, Math.min(100, percentValue))}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export async function HealthPage({ activeTab, locale, selectedDay, user }: HealthPageProps) {
  const content = healthContent[locale];
  const profile = await prisma.healthProfile.findUnique({ where: { userId: user.id } });
  const checkIns = await prisma.healthCheckIn.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 35,
  });
  const workoutLogs = await prisma.healthWorkoutLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 35,
  });
  const review = weeklyReview({
    locale,
    profile: profile ?? { healthStatus: "none", trainingDays: 3 },
    checkIns,
    workouts: workoutLogs,
  });

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>{content.kicker}</p>
            <h1>{content.heading}</h1>
            <p>{content.lead}</p>
          </div>
        </header>

        <div className={styles.workspace}>
          <nav className={styles.healthNav} aria-label={locale === "es" ? "Salud" : "Health"}>
            <Link href={localizePath(locale, "/account")} className={styles.backLink}>
              {locale === "es" ? "Volver al panel" : "Back to dashboard"}
            </Link>
            <span className={styles.navDivider} aria-hidden="true" />
            {(Object.keys(tabPaths) as HealthTab[]).map((tab) => (
              <Link
                key={tab}
                href={localizePath(locale, tabPaths[tab])}
                className={activeTab === tab ? styles.activeNav : undefined}
                aria-current={activeTab === tab ? "page" : undefined}
              >
                {tabLabels[locale][tab]}
              </Link>
            ))}
          </nav>

          <div className={styles.workspaceContent}>
            {activeTab === "profile" && <ProfileTab content={content} locale={locale} profile={profile} />}
            {activeTab === "plan" && <PlanTab locale={locale} />}
            {activeTab === "nutrition" && <NutritionTab locale={locale} />}
            {activeTab === "guide" && <GuideTab locale={locale} />}
            {activeTab === "progress" && (
              <ProgressTab
                content={content}
                locale={locale}
                profile={profile}
                checkIns={checkIns}
                workoutLogs={workoutLogs}
                review={review}
                selectedDay={selectedDay ?? toDateValue(new Date())}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
