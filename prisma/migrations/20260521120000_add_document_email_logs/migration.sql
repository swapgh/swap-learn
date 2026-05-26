-- CreateEnum
CREATE TYPE "DocumentEmailType" AS ENUM ('proforma', 'invoice');

-- CreateEnum
CREATE TYPE "DocumentEmailStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "document_email_logs" (
    "id" TEXT NOT NULL,
    "document_type" "DocumentEmailType" NOT NULL,
    "document_id" TEXT NOT NULL,
    "proforma_id" TEXT,
    "invoice_id" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "DocumentEmailStatus" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "provider_message_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_email_logs_document_type_document_id_idx" ON "document_email_logs"("document_type", "document_id");

-- CreateIndex
CREATE INDEX "document_email_logs_proforma_id_idx" ON "document_email_logs"("proforma_id");

-- CreateIndex
CREATE INDEX "document_email_logs_invoice_id_idx" ON "document_email_logs"("invoice_id");

-- AddForeignKey
ALTER TABLE "document_email_logs" ADD CONSTRAINT "document_email_logs_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_email_logs" ADD CONSTRAINT "document_email_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
