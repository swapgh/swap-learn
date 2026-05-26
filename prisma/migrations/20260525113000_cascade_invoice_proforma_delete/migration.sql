ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_proforma_id_fkey";

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_proforma_id_fkey"
  FOREIGN KEY ("proforma_id")
  REFERENCES "proformas"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
