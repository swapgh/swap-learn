CREATE TABLE "health_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "owner_email" TEXT NOT NULL,
    "age" INTEGER,
    "sex" TEXT,
    "height_cm" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "goal" TEXT NOT NULL DEFAULT 'muscle_energy',
    "experience" TEXT NOT NULL DEFAULT 'beginner',
    "health_status" TEXT NOT NULL DEFAULT 'none',
    "health_notes" TEXT,
    "activity_level" TEXT NOT NULL DEFAULT 'sedentary',
    "training_days" INTEGER NOT NULL DEFAULT 3,
    "session_length" TEXT NOT NULL DEFAULT '35_45',
    "equipment" TEXT NOT NULL DEFAULT 'bands_pullup_bar',
    "sleep_quality" TEXT NOT NULL DEFAULT 'good',
    "diet_pattern" TEXT NOT NULL DEFAULT 'low_protein_disordered',
    "diet_restrictions" TEXT NOT NULL DEFAULT 'none',
    "tracking_style" TEXT NOT NULL DEFAULT 'simple_habits',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_check_ins" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight_kg" DOUBLE PRECISION,
    "energy" INTEGER NOT NULL,
    "sleep_hours" DOUBLE PRECISION,
    "steps" INTEGER,
    "protein_done" BOOLEAN NOT NULL DEFAULT false,
    "mobility_done" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_check_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_workout_logs" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "exercises" JSONB NOT NULL DEFAULT '[]',
    "difficulty" INTEGER,
    "pain_notes" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_workout_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "health_profiles_user_id_key" ON "health_profiles"("user_id");
CREATE INDEX "health_profiles_owner_email_idx" ON "health_profiles"("owner_email");
CREATE INDEX "health_check_ins_user_id_date_idx" ON "health_check_ins"("user_id", "date");
CREATE INDEX "health_check_ins_profile_id_date_idx" ON "health_check_ins"("profile_id", "date");
CREATE INDEX "health_workout_logs_user_id_date_idx" ON "health_workout_logs"("user_id", "date");
CREATE INDEX "health_workout_logs_profile_id_date_idx" ON "health_workout_logs"("profile_id", "date");

ALTER TABLE "health_check_ins" ADD CONSTRAINT "health_check_ins_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "health_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "health_workout_logs" ADD CONSTRAINT "health_workout_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "health_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
