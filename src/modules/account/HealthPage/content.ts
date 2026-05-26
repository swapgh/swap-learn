import type { Locale } from "@/lib/locale";

type Option = [string, string];

type HealthPageContent = {
  title: string;
  description: string;
  kicker: string;
  heading: string;
  lead: string;
  onboardingTitle: string;
  onboardingLead: string;
  saveProfile: string;
  updateProfile: string;
  currentPlan: string;
  weeklyReview: string;
  checkIn: string;
  workoutLog: string;
  latestLogs: string;
  noLogs: string;
  fields: Record<string, string>;
  options: Record<string, Option[]>;
  plan: {
    trainingTitle: string;
    habitsTitle: string;
    dietTitle: string;
    training: string[];
    habits: string[];
    diet: string[];
  };
  actions: {
    saveCheckIn: string;
    saveWorkout: string;
  };
};

export const healthContent: Record<Locale, HealthPageContent> = {
  es: {
    title: "Salud - Swap RPG",
    description: "Plan de salud y progreso",
    kicker: "Salud",
    heading: "Fuerza y hábitos",
    lead: "Plan simple para músculo, energía y constancia.",
    onboardingTitle: "Cuestionario inicial",
    onboardingLead: "Datos base para ajustar el plan.",
    saveProfile: "Guardar perfil",
    updateProfile: "Actualizar perfil",
    currentPlan: "Plan actual",
    weeklyReview: "Revisión semanal",
    checkIn: "Registro rápido",
    workoutLog: "Registrar entrenamiento",
    latestLogs: "Últimos registros",
    noLogs: "Aún no hay registros.",
    fields: {
      age: "Edad",
      sex: "Sexo",
      heightCm: "Altura (cm)",
      weightKg: "Peso (kg)",
      goal: "Objetivo",
      experience: "Experiencia",
      healthStatus: "Salud",
      healthNotes: "Notas",
      activityLevel: "Actividad",
      trainingDays: "Días/semana",
      sessionLength: "Duración",
      equipment: "Material",
      sleepQuality: "Sueño",
      dietPattern: "Dieta actual",
      dietRestrictions: "Restricciones",
      trackingStyle: "Seguimiento",
      energy: "Energía (1-5)",
      sleepHours: "Horas de sueño",
      steps: "Pasos",
      proteinDone: "Proteína",
      mobilityDone: "Movilidad",
      notes: "Notas",
      session: "Sesión",
      completed: "Completado",
      difficulty: "Dificultad (1-5)",
      painNotes: "Molestias",
    },
    options: {
      sex: [
        ["male", "Masculino"],
        ["female", "Femenino"],
        ["other", "Otro"],
      ],
      goal: [
        ["muscle_energy", "Músculo + energía"],
        ["recomposition", "Recomposición"],
        ["fat_loss", "Perder grasa"],
        ["health", "Salud"],
      ],
      experience: [
        ["beginner", "Principiante"],
        ["intermediate", "Intermedio"],
        ["advanced", "Avanzado"],
      ],
      healthStatus: [
        ["none", "Nada relevante"],
        ["pain_injury", "Lesión o dolor"],
        ["medical_condition", "Condición médica"],
      ],
      activityLevel: [
        ["sedentary", "Sedentaria"],
        ["moderate", "Moderada"],
        ["high", "Alta/física"],
      ],
      sessionLength: [
        ["20_30", "20-30 min"],
        ["35_45", "35-45 min"],
        ["50_60", "50-60 min"],
      ],
      equipment: [
        ["bodyweight", "Sin material"],
        ["bands_pullup_bar", "Bandas/barra"],
        ["adjustable_dumbbells", "Mancuernas"],
        ["gym", "Gimnasio"],
      ],
      sleepQuality: [
        ["good", "7-8h decente"],
        ["short", "Menos de 7h"],
        ["irregular", "Irregular/malo"],
      ],
      dietPattern: [
        ["low_protein_disordered", "Poca proteína"],
        ["normal", "Normal"],
        ["controlled", "Controlada"],
      ],
      dietRestrictions: [
        ["none", "Sin restricciones"],
        ["avoid_some", "Evito algunos alimentos"],
        ["vegetarian_vegan", "Vegetariana/vegana"],
      ],
      trackingStyle: [
        ["simple_habits", "Hábitos"],
        ["approx_macros", "Macros"],
        ["minimal", "Mínimo"],
      ],
      session: [
        ["A", "Sesión A"],
        ["B", "Sesión B"],
        ["C", "Sesión C"],
      ],
    },
    plan: {
      trainingTitle: "Fuerza 3 días",
      habitsTitle: "Hábitos base",
      dietTitle: "Dieta simple",
      training: [
        "3 días, cuerpo completo, 35-45 min.",
        "Calienta cadera, espalda alta y hombros.",
        "Empuje, pierna, tirón y core.",
        "Progresa con repeticiones limpias.",
      ],
      habits: [
        "Pasos: sube hacia 7.000-9.000.",
        "Movilidad: 5-8 min diarios.",
        "Sueño: 7-8 h estables.",
        "Revisa energía, peso y entrenos.",
      ],
      diet: [
        "Proteína en cada comida.",
        "Meta: 120-150 g/día.",
        "3 comidas base + fruta/verdura.",
        "Si no sube el peso, añade 250-350 kcal.",
      ],
    },
    actions: {
      saveCheckIn: "Guardar registro",
      saveWorkout: "Guardar entrenamiento",
    },
  },
  en: {
    title: "Health - Swap RPG",
    description: "Health and progress plan",
    kicker: "Health",
    heading: "Strength and habits",
    lead: "Simple plan for muscle, energy and consistency.",
    onboardingTitle: "Initial questionnaire",
    onboardingLead: "Base data to adjust the plan.",
    saveProfile: "Save profile",
    updateProfile: "Update profile",
    currentPlan: "Current plan",
    weeklyReview: "Weekly review",
    checkIn: "Quick check-in",
    workoutLog: "Log workout",
    latestLogs: "Latest logs",
    noLogs: "No logs yet.",
    fields: {
      age: "Age",
      sex: "Sex",
      heightCm: "Height (cm)",
      weightKg: "Weight (kg)",
      goal: "Goal",
      experience: "Experience",
      healthStatus: "Health",
      healthNotes: "Notes",
      activityLevel: "Activity",
      trainingDays: "Days/week",
      sessionLength: "Length",
      equipment: "Equipment",
      sleepQuality: "Sleep",
      dietPattern: "Current diet",
      dietRestrictions: "Restrictions",
      trackingStyle: "Tracking",
      energy: "Energy (1-5)",
      sleepHours: "Sleep hours",
      steps: "Steps",
      proteinDone: "Protein",
      mobilityDone: "Mobility",
      notes: "Notes",
      session: "Session",
      completed: "Completed",
      difficulty: "Difficulty (1-5)",
      painNotes: "Discomfort",
    },
    options: {
      sex: [
        ["male", "Male"],
        ["female", "Female"],
        ["other", "Other"],
      ],
      goal: [
        ["muscle_energy", "Muscle + energy"],
        ["recomposition", "Recomposition"],
        ["fat_loss", "Fat loss"],
        ["health", "Health"],
      ],
      experience: [
        ["beginner", "Beginner"],
        ["intermediate", "Intermediate"],
        ["advanced", "Advanced"],
      ],
      healthStatus: [
        ["none", "Nothing relevant"],
        ["pain_injury", "Injury or pain"],
        ["medical_condition", "Medical"],
      ],
      activityLevel: [
        ["sedentary", "Sedentary"],
        ["moderate", "Moderate"],
        ["high", "High/physical"],
      ],
      sessionLength: [
        ["20_30", "20-30 min"],
        ["35_45", "35-45 min"],
        ["50_60", "50-60 min"],
      ],
      equipment: [
        ["bodyweight", "No equipment"],
        ["bands_pullup_bar", "Bands/bar"],
        ["adjustable_dumbbells", "Dumbbells"],
        ["gym", "Gym"],
      ],
      sleepQuality: [
        ["good", "Decent 7-8h"],
        ["short", "Less than 7h"],
        ["irregular", "Irregular/poor"],
      ],
      dietPattern: [
        ["low_protein_disordered", "Low protein"],
        ["normal", "Normal"],
        ["controlled", "Controlled"],
      ],
      dietRestrictions: [
        ["none", "No restrictions"],
        ["avoid_some", "Avoid some foods"],
        ["vegetarian_vegan", "Vegetarian/vegan"],
      ],
      trackingStyle: [
        ["simple_habits", "Habits"],
        ["approx_macros", "Macros"],
        ["minimal", "Minimal"],
      ],
      session: [
        ["A", "Session A"],
        ["B", "Session B"],
        ["C", "Session C"],
      ],
    },
    plan: {
      trainingTitle: "Strength 3 days",
      habitsTitle: "Base habits",
      dietTitle: "Simple diet",
      training: [
        "3 days, full body, 35-45 min.",
        "Warm up hips, upper back and shoulders.",
        "Push, legs, pull and core.",
        "Progress with clean reps.",
      ],
      habits: [
        "Steps: build toward 7,000-9,000.",
        "Mobility: 5-8 min daily.",
        "Sleep: stable 7-8 h.",
        "Review energy, weight and workouts.",
      ],
      diet: [
        "Protein in every meal.",
        "Target: 120-150 g/day.",
        "3 base meals + fruit/veg.",
        "If weight stalls, add 250-350 kcal.",
      ],
    },
    actions: {
      saveCheckIn: "Save check-in",
      saveWorkout: "Save workout",
    },
  },
};
