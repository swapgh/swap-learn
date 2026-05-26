ALTER TABLE "health_check_ins" ADD COLUMN "day_status" TEXT NOT NULL DEFAULT 'partial';
ALTER TABLE "health_check_ins" ADD COLUMN "missed_reason" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "health_workout_logs" ADD COLUMN "missed_reason" TEXT;
