ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "client_services" ADD COLUMN IF NOT EXISTS "code" TEXT;

ALTER TABLE "proforma_items"
  ADD COLUMN IF NOT EXISTS "billing_unit" "BillingUnit",
  ADD COLUMN IF NOT EXISTS "quantity" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "provider_name" TEXT,
  ADD COLUMN IF NOT EXISTS "renews_at" TIMESTAMP(3);

ALTER TABLE "work_items" ADD COLUMN IF NOT EXISTS "proforma_item_id" TEXT;

CREATE TABLE IF NOT EXISTS "entity_counters" (
  "id" TEXT NOT NULL,
  "seq" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "entity_counters_pkey" PRIMARY KEY ("id")
);

UPDATE "proforma_items"
SET
  "quantity" = COALESCE("quantity", "hours"),
  "billing_unit" = COALESCE("billing_unit", "unit_type"),
  "provider_name" = COALESCE("provider_name", "provider"),
  "renews_at" = COALESCE(
    "renews_at",
    CASE
      WHEN "is_recurring" = true AND COALESCE("recurrence_months", 0) > 0
        THEN CURRENT_TIMESTAMP + (COALESCE("recurrence_months", 1) || ' months')::interval
      ELSE NULL
    END
  );

WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS rn
  FROM "clients"
  WHERE "code" IS NULL
)
UPDATE "clients"
SET "code" = 'CLI-' || lpad(numbered.rn::text, 4, '0')
FROM numbered
WHERE "clients"."id" = numbered."id";

WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS rn
  FROM "projects"
  WHERE "code" IS NULL
)
UPDATE "projects"
SET "code" = 'PRJ-' || lpad(numbered.rn::text, 4, '0')
FROM numbered
WHERE "projects"."id" = numbered."id";

WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS rn
  FROM "client_services"
  WHERE "code" IS NULL
)
UPDATE "client_services"
SET "code" = 'SRV-' || lpad(numbered.rn::text, 4, '0')
FROM numbered
WHERE "client_services"."id" = numbered."id";

INSERT INTO "entity_counters" ("id", "seq")
VALUES
  ('client', COALESCE((SELECT MAX((regexp_match("code", '^CLI-([0-9]+)$'))[1]::int) FROM "clients" WHERE "code" ~ '^CLI-[0-9]+$'), 0)),
  ('project', COALESCE((SELECT MAX((regexp_match("code", '^PRJ-([0-9]+)$'))[1]::int) FROM "projects" WHERE "code" ~ '^PRJ-[0-9]+$'), 0)),
  ('client_service', COALESCE((SELECT MAX((regexp_match("code", '^SRV-([0-9]+)$'))[1]::int) FROM "client_services" WHERE "code" ~ '^SRV-[0-9]+$'), 0))
ON CONFLICT ("id") DO UPDATE SET "seq" = GREATEST("entity_counters"."seq", EXCLUDED."seq");

CREATE UNIQUE INDEX IF NOT EXISTS "clients_code_key" ON "clients"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_code_key" ON "projects"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "client_services_code_key" ON "client_services"("code");
CREATE INDEX IF NOT EXISTS "work_items_proforma_item_id_idx" ON "work_items"("proforma_item_id");
CREATE INDEX IF NOT EXISTS "client_services_proforma_item_id_idx" ON "client_services"("proforma_item_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_items_proforma_item_id_fkey'
  ) THEN
    ALTER TABLE "work_items"
      ADD CONSTRAINT "work_items_proforma_item_id_fkey"
      FOREIGN KEY ("proforma_item_id") REFERENCES "proforma_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_services_proforma_item_id_fkey'
  ) THEN
    ALTER TABLE "client_services"
      ADD CONSTRAINT "client_services_proforma_item_id_fkey"
      FOREIGN KEY ("proforma_item_id") REFERENCES "proforma_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

