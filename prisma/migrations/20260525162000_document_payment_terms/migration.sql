ALTER TABLE "proformas" ADD COLUMN IF NOT EXISTS "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer';
ALTER TABLE "proformas" ADD COLUMN IF NOT EXISTS "payment_terms" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_terms" TEXT;
