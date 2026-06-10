CREATE TYPE "SwapJobAutomationTaskType" AS ENUM ('search_source', 'inspect_job', 'fill_application', 'final_submit');

CREATE TYPE "SwapJobAutomationTaskStatus" AS ENUM ('pending', 'claimed', 'running', 'waiting_approval', 'approved', 'completed', 'failed', 'blocked', 'cancelled');

CREATE TYPE "SwapJobApplicationStatus" AS ENUM ('draft', 'queued', 'filling', 'waiting_approval', 'submitted', 'failed', 'blocked');

ALTER TABLE "swap_jobs"
  ADD COLUMN "duplicate_key" TEXT,
  ADD COLUMN "external_id" TEXT,
  ADD COLUMN "automation_status" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "last_seen_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "swap_jobs_user_id_duplicate_key_key" ON "swap_jobs"("user_id", "duplicate_key");
CREATE INDEX "swap_jobs_user_id_score_idx" ON "swap_jobs"("user_id", "score");
CREATE INDEX "swap_jobs_user_id_state_idx" ON "swap_jobs"("user_id", "state");

CREATE TABLE "swap_job_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "owner_email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL DEFAULT '',
  "linkedin_url" TEXT,
  "portfolio_url" TEXT,
  "cv_es_url" TEXT NOT NULL DEFAULT '/cv/Fernando_Alba_CV_ES.pdf',
  "cv_en_url" TEXT NOT NULL DEFAULT '/cv/Fernando_Alba_CV_EN.pdf',
  "cv_text" TEXT,
  "target_roles" JSONB NOT NULL DEFAULT '[]',
  "target_locations" JSONB NOT NULL DEFAULT '[]',
  "languages" JSONB NOT NULL DEFAULT '[]',
  "salary_min" INTEGER,
  "must_have" JSONB NOT NULL DEFAULT '[]',
  "reject_terms" JSONB NOT NULL DEFAULT '[]',
  "preferred_companies" JSONB NOT NULL DEFAULT '[]',
  "blocked_companies" JSONB NOT NULL DEFAULT '[]',
  "application_fields" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "swap_job_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "swap_job_profiles_user_id_key" ON "swap_job_profiles"("user_id");
CREATE INDEX "swap_job_profiles_owner_email_idx" ON "swap_job_profiles"("owner_email");

CREATE TABLE "swap_job_searches" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "owner_email" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "location" TEXT,
  "modality" TEXT NOT NULL DEFAULT 'any',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "cadence_minutes" INTEGER NOT NULL DEFAULT 1440,
  "last_run_at" TIMESTAMP(3),
  "next_run_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "swap_job_searches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "swap_job_searches_user_id_enabled_idx" ON "swap_job_searches"("user_id", "enabled");
CREATE INDEX "swap_job_searches_source_idx" ON "swap_job_searches"("source");

CREATE TABLE "swap_job_applications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "owner_email" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "status" "SwapJobApplicationStatus" NOT NULL DEFAULT 'draft',
  "source" TEXT NOT NULL,
  "source_url" TEXT,
  "form_fields" JSONB NOT NULL DEFAULT '[]',
  "prepared_answers" JSONB NOT NULL DEFAULT '{}',
  "submitted_at" TIMESTAMP(3),
  "blocked_reason" TEXT,
  "last_screenshot" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "swap_job_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "swap_job_applications_user_id_status_idx" ON "swap_job_applications"("user_id", "status");
CREATE INDEX "swap_job_applications_job_id_idx" ON "swap_job_applications"("job_id");

CREATE TABLE "swap_job_answer_templates" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "owner_email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "field_key" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "swap_job_answer_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "swap_job_answer_templates_user_id_field_key_idx" ON "swap_job_answer_templates"("user_id", "field_key");

CREATE TABLE "swap_job_automation_tasks" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "owner_email" TEXT NOT NULL,
  "job_id" TEXT,
  "type" "SwapJobAutomationTaskType" NOT NULL,
  "status" "SwapJobAutomationTaskStatus" NOT NULL DEFAULT 'pending',
  "source" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "result" JSONB,
  "claimed_by" TEXT,
  "claimed_at" TIMESTAMP(3),
  "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "approval_token" TEXT,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "swap_job_automation_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "swap_job_automation_tasks_status_scheduled_at_priority_idx" ON "swap_job_automation_tasks"("status", "scheduled_at", "priority");
CREATE INDEX "swap_job_automation_tasks_user_id_status_idx" ON "swap_job_automation_tasks"("user_id", "status");
CREATE INDEX "swap_job_automation_tasks_job_id_idx" ON "swap_job_automation_tasks"("job_id");

CREATE TABLE "swap_job_automation_logs" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'info',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "swap_job_automation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "swap_job_automation_logs_task_id_created_at_idx" ON "swap_job_automation_logs"("task_id", "created_at");
CREATE INDEX "swap_job_automation_logs_user_id_created_at_idx" ON "swap_job_automation_logs"("user_id", "created_at");

ALTER TABLE "swap_job_applications"
  ADD CONSTRAINT "swap_job_applications_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "swap_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "swap_job_automation_tasks"
  ADD CONSTRAINT "swap_job_automation_tasks_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "swap_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "swap_job_automation_logs"
  ADD CONSTRAINT "swap_job_automation_logs_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "swap_job_automation_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
