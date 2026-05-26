"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { getAuthUser } from "@/server/auth";
import type { Locale } from "@/lib/locale";

const healthPath = (locale: Locale) => `/${locale}/account/health`;
const progressPath = (locale: Locale) => `/${locale}/account/health/progress`;

function textValue(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function intValue(formData: FormData, key: string, fallback?: number) {
  const value = textValue(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function floatValue(formData: FormData, key: string, fallback?: number) {
  const value = textValue(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateParam(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function jsonArrayValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

function boundedInt(
  formData: FormData,
  key: string,
  fallback: number,
  min: number,
  max: number
) {
  const value = intValue(formData, key, fallback) ?? fallback;
  return Math.min(max, Math.max(min, value));
}

async function requireProfile(locale: Locale) {
  const user = await getAuthUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const profile = await prisma.healthProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect(`${healthPath(locale)}?error=profile`);
  }

  return { user, profile };
}

export async function saveHealthProfile(locale: Locale, formData: FormData) {
  const user = await getAuthUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  await prisma.healthProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ownerEmail: user.email,
      age: intValue(formData, "age", 35),
      sex: textValue(formData, "sex", "male"),
      heightCm: intValue(formData, "heightCm", 173),
      weightKg: floatValue(formData, "weightKg", 73),
      goal: textValue(formData, "goal", "muscle_energy"),
      experience: textValue(formData, "experience", "beginner"),
      healthStatus: textValue(formData, "healthStatus", "none"),
      healthNotes: textValue(formData, "healthNotes"),
      activityLevel: textValue(formData, "activityLevel", "sedentary"),
      trainingDays: boundedInt(formData, "trainingDays", 3, 1, 6),
      sessionLength: textValue(formData, "sessionLength", "35_45"),
      equipment: textValue(formData, "equipment", "bands_pullup_bar"),
      sleepQuality: textValue(formData, "sleepQuality", "good"),
      dietPattern: textValue(formData, "dietPattern", "low_protein_disordered"),
      dietRestrictions: textValue(formData, "dietRestrictions", "none"),
      trackingStyle: textValue(formData, "trackingStyle", "simple_habits"),
    },
    update: {
      ownerEmail: user.email,
      age: intValue(formData, "age", 35),
      sex: textValue(formData, "sex", "male"),
      heightCm: intValue(formData, "heightCm", 173),
      weightKg: floatValue(formData, "weightKg", 73),
      goal: textValue(formData, "goal", "muscle_energy"),
      experience: textValue(formData, "experience", "beginner"),
      healthStatus: textValue(formData, "healthStatus", "none"),
      healthNotes: textValue(formData, "healthNotes"),
      activityLevel: textValue(formData, "activityLevel", "sedentary"),
      trainingDays: boundedInt(formData, "trainingDays", 3, 1, 6),
      sessionLength: textValue(formData, "sessionLength", "35_45"),
      equipment: textValue(formData, "equipment", "bands_pullup_bar"),
      sleepQuality: textValue(formData, "sleepQuality", "good"),
      dietPattern: textValue(formData, "dietPattern", "low_protein_disordered"),
      dietRestrictions: textValue(formData, "dietRestrictions", "none"),
      trackingStyle: textValue(formData, "trackingStyle", "simple_habits"),
    },
  });

  revalidatePath(healthPath(locale));
  redirect(`${healthPath(locale)}?saved=profile`);
}

export async function createHealthCheckIn(locale: Locale, formData: FormData) {
  const { user, profile } = await requireProfile(locale);
  const selectedDate = dateValue(formData, "date") ?? new Date();
  const { start, end } = dayBounds(selectedDate);
  const existing = await prisma.healthCheckIn.findFirst({
    where: { userId: user.id, date: { gte: start, lt: end } },
    orderBy: { createdAt: "desc" },
  });
  const data = {
    profileId: profile.id,
    userId: user.id,
    date: selectedDate,
    weightKg: floatValue(formData, "weightKg"),
    energy: boundedInt(formData, "energy", 3, 1, 5),
    sleepHours: floatValue(formData, "sleepHours"),
    steps: intValue(formData, "steps"),
    proteinDone: formData.get("proteinDone") === "on",
    mobilityDone: formData.get("mobilityDone") === "on",
    dayStatus: textValue(formData, "dayStatus", "partial"),
    missedReason: textValue(formData, "missedReason", "none"),
    notes: textValue(formData, "notes"),
  };

  if (existing) {
    await prisma.healthCheckIn.update({ where: { id: existing.id }, data });
  } else {
    await prisma.healthCheckIn.create({ data });
  }

  revalidatePath(progressPath(locale));
  redirect(`${progressPath(locale)}?day=${dateParam(selectedDate)}&saved=check-in`);
}

export async function createHealthWorkoutLog(locale: Locale, formData: FormData) {
  const { user, profile } = await requireProfile(locale);
  const selectedDate = dateValue(formData, "date") ?? new Date();
  const { start, end } = dayBounds(selectedDate);
  const session = textValue(formData, "session", "A");
  const existing = await prisma.healthWorkoutLog.findFirst({
    where: { userId: user.id, session, date: { gte: start, lt: end } },
    orderBy: { createdAt: "desc" },
  });
  const data = {
    profileId: profile.id,
    userId: user.id,
    date: selectedDate,
    session,
    completed: formData.get("completed") === "on",
    exercises: [],
    difficulty: boundedInt(formData, "difficulty", 3, 1, 5),
    missedReason: textValue(formData, "missedReason", "none"),
    painNotes: textValue(formData, "painNotes"),
    notes: textValue(formData, "notes"),
  };

  if (existing) {
    await prisma.healthWorkoutLog.update({ where: { id: existing.id }, data });
  } else {
    await prisma.healthWorkoutLog.create({ data });
  }

  revalidatePath(progressPath(locale));
  redirect(`${progressPath(locale)}?day=${dateParam(selectedDate)}&saved=workout`);
}

export async function saveHealthDayProgress(locale: Locale, formData: FormData) {
  const { user, profile } = await requireProfile(locale);
  const selectedDate = dateValue(formData, "date") ?? new Date();
  const { start, end } = dayBounds(selectedDate);
  const session = textValue(formData, "session", "A");
  const [existingCheckIn, existingWorkout] = await Promise.all([
    prisma.healthCheckIn.findFirst({
      where: { userId: user.id, date: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.healthWorkoutLog.findFirst({
      where: { userId: user.id, session, date: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const checkInData = {
    profileId: profile.id,
    userId: user.id,
    date: selectedDate,
    weightKg: floatValue(formData, "weightKg"),
    energy: boundedInt(formData, "energy", 3, 1, 5),
    sleepHours: floatValue(formData, "sleepHours"),
    steps: intValue(formData, "steps"),
    proteinDone: formData.get("proteinDone") === "on",
    mobilityDone: formData.get("mobilityDone") === "on",
    dayStatus: textValue(formData, "dayStatus", "partial"),
    missedReason: textValue(formData, "dayMissedReason", "none"),
    notes: textValue(formData, "dayNotes"),
  };
  const workoutData = {
    profileId: profile.id,
    userId: user.id,
    date: selectedDate,
    session,
    completed: formData.get("completed") === "on",
    exercises: jsonArrayValue(formData, "workoutExercisesJson"),
    difficulty: boundedInt(formData, "difficulty", 3, 1, 5),
    missedReason: textValue(formData, "workoutMissedReason", "none"),
    painNotes: textValue(formData, "painNotes"),
    notes: textValue(formData, "workoutNotes"),
  };

  await prisma.$transaction([
    existingCheckIn
      ? prisma.healthCheckIn.update({ where: { id: existingCheckIn.id }, data: checkInData })
      : prisma.healthCheckIn.create({ data: checkInData }),
    existingWorkout
      ? prisma.healthWorkoutLog.update({ where: { id: existingWorkout.id }, data: workoutData })
      : prisma.healthWorkoutLog.create({ data: workoutData }),
  ]);

  revalidatePath(progressPath(locale));
  redirect(`${progressPath(locale)}?day=${dateParam(selectedDate)}&saved=day`);
}
