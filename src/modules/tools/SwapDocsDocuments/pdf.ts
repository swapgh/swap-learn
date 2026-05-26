import "server-only";

import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Locale } from "@/lib/locale";
import type { Invoice, InvoiceItem, Proforma, ProformaItem, Project, Client } from "@prisma/client";
import { SwapDocsInvoicePdfDocument } from "@/modules/tools/SwapDocsInvoicePdf/document";
import { SwapDocsProformaPdfDocument } from "@/modules/tools/SwapDocsProformaPdf/document";

type ProformaForPdf = Proforma & {
  paymentMethod?: string | null;
  paymentTerms?: string | null;
  items: ProformaItem[];
  project: Project & { client: Client };
};

type InvoiceForPdf = Invoice & {
  paymentMethod?: string | null;
  paymentTerms?: string | null;
  items: InvoiceItem[];
  proforma: {
    number: string;
    project: {
      name: string;
      client: Client;
    };
  };
};

async function renderPdfBuffer(document: Parameters<typeof pdf>[0]) {
  const blob = await pdf(document).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}

export async function renderProformaPdfBuffer(proforma: ProformaForPdf, locale: Locale = "es") {
  const document = createElement(SwapDocsProformaPdfDocument, { proforma, locale }) as Parameters<typeof pdf>[0];
  return renderPdfBuffer(document);
}

export async function renderInvoicePdfBuffer(invoice: InvoiceForPdf, locale: Locale = "es") {
  const document = createElement(SwapDocsInvoicePdfDocument, { invoice, locale }) as Parameters<typeof pdf>[0];
  return renderPdfBuffer(document);
}
