CREATE TYPE "BusinessLineType" AS ENUM ('own_work', 'external_cost', 'recurring_service', 'margin');
CREATE TYPE "BillingUnit" AS ENUM ('hour', 'day', 'fixed', 'monthly', 'yearly');
CREATE TYPE "ClientServiceStatus" AS ENUM ('active', 'pending', 'suspended', 'expired', 'cancelled');

ALTER TABLE "cost_items"
  ADD COLUMN "line_type" "BusinessLineType" NOT NULL DEFAULT 'own_work',
  ADD COLUMN "unit_type" "BillingUnit" NOT NULL DEFAULT 'hour',
  ADD COLUMN "internal_unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "client_unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "is_recurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurrence_months" INTEGER,
  ADD COLUMN "renewal_date" TIMESTAMP(3);

UPDATE "cost_items"
SET
  "internal_unit_cost" = "unit_cost",
  "client_unit_price" = "unit_cost",
  "margin" = 0,
  "line_type" = CASE
    WHEN lower("stage" || ' ' || "task") ~ '(hosting|vps|servidor|dominio|licencia|api|proveedor)' THEN 'external_cost'::"BusinessLineType"
    WHEN lower("stage" || ' ' || "task") ~ '(margen|gesti.n|contingencia)' THEN 'margin'::"BusinessLineType"
    ELSE 'own_work'::"BusinessLineType"
  END,
  "unit_type" = CASE
    WHEN lower("stage" || ' ' || "task") ~ '(mensual|mes|hosting|vps|servidor)' THEN 'monthly'::"BillingUnit"
    WHEN lower("stage" || ' ' || "task") ~ '(anual|dominio)' THEN 'yearly'::"BillingUnit"
    ELSE 'hour'::"BillingUnit"
  END,
  "is_recurring" = lower("stage" || ' ' || "task") ~ '(mensual|hosting|vps|servidor|dominio|licencia)';

ALTER TABLE "work_items"
  ADD COLUMN "line_type" "BusinessLineType" NOT NULL DEFAULT 'own_work',
  ADD COLUMN "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "billable" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "proforma_items"
  ADD COLUMN "line_type" "BusinessLineType" NOT NULL DEFAULT 'own_work',
  ADD COLUMN "unit_type" "BillingUnit" NOT NULL DEFAULT 'hour',
  ADD COLUMN "internal_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "client_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "is_recurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurrence_months" INTEGER;

UPDATE "proforma_items"
SET
  "client_price" = "amount",
  "line_type" = CASE
    WHEN lower("description") ~ '(hosting|vps|servidor|dominio|licencia|api)' THEN 'recurring_service'::"BusinessLineType"
    WHEN lower("description") ~ '(margen|gesti.n|contingencia)' THEN 'margin'::"BusinessLineType"
    ELSE 'own_work'::"BusinessLineType"
  END,
  "unit_type" = CASE
    WHEN lower("description") ~ '(mensual|hosting|vps|servidor)' THEN 'monthly'::"BillingUnit"
    WHEN lower("description") ~ '(anual|dominio)' THEN 'yearly'::"BillingUnit"
    ELSE 'hour'::"BillingUnit"
  END,
  "is_recurring" = lower("description") ~ '(mensual|hosting|vps|servidor|dominio|licencia)',
  "recurrence_months" = CASE
    WHEN lower("description") ~ '(anual|dominio)' THEN 12
    WHEN lower("description") ~ '(mensual|hosting|vps|servidor|licencia)' THEN 1
    ELSE NULL
  END;

ALTER TABLE "services"
  ADD COLUMN "line_type" "BusinessLineType" NOT NULL DEFAULT 'own_work',
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "default_unit_type" "BillingUnit" NOT NULL DEFAULT 'hour';

ALTER TABLE "service_rates"
  ADD COLUMN "internal_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "client_price" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "service_rates"
SET "client_price" = "rate";

ALTER TABLE "service_template_lines"
  ADD COLUMN "line_type" "BusinessLineType" NOT NULL DEFAULT 'own_work',
  ADD COLUMN "unit_type" "BillingUnit" NOT NULL DEFAULT 'hour',
  ADD COLUMN "internal_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "client_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "is_recurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurrence_months" INTEGER;

UPDATE "service_template_lines"
SET
  "client_price" = "amount",
  "line_type" = CASE
    WHEN lower("description") ~ '(hosting|vps|servidor|dominio|licencia|api)' THEN 'recurring_service'::"BusinessLineType"
    WHEN lower("description") ~ '(margen|gesti.n|contingencia)' THEN 'margin'::"BusinessLineType"
    ELSE 'own_work'::"BusinessLineType"
  END,
  "unit_type" = CASE
    WHEN lower("description") ~ '(mensual|hosting|vps|servidor)' THEN 'monthly'::"BillingUnit"
    WHEN lower("description") ~ '(anual|dominio)' THEN 'yearly'::"BillingUnit"
    ELSE 'hour'::"BillingUnit"
  END,
  "is_recurring" = lower("description") ~ '(mensual|hosting|vps|servidor|dominio|licencia)',
  "recurrence_months" = CASE
    WHEN lower("description") ~ '(anual|dominio)' THEN 12
    WHEN lower("description") ~ '(mensual|hosting|vps|servidor|licencia)' THEN 1
    ELSE NULL
  END;

CREATE TABLE "client_services" (
  "id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "project_id" TEXT,
  "proforma_item_id" TEXT,
  "name" TEXT NOT NULL,
  "line_type" "BusinessLineType" NOT NULL DEFAULT 'recurring_service',
  "provider" TEXT,
  "status" "ClientServiceStatus" NOT NULL DEFAULT 'active',
  "unit_type" "BillingUnit" NOT NULL DEFAULT 'monthly',
  "internal_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "client_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" TIMESTAMP(3),
  "renewal_date" TIMESTAMP(3),
  "recurrence_months" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_services_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_services_client_id_status_idx" ON "client_services"("client_id", "status");
CREATE INDEX "client_services_renewal_date_idx" ON "client_services"("renewal_date");

ALTER TABLE "client_services"
  ADD CONSTRAINT "client_services_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "client_services_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
