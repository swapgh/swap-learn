import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { SwapDocsInvoicePage } from "@/modules/tools/SwapDocsInvoicePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("Factura - SwapDocs", "Printable invoice detail", locale, "/account/tools/docs");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ mode?: string; returnTo?: string; success?: string; error?: string }>;
}) {
  const { locale, id } = await params;
  const { mode, returnTo, success, error } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireToolPageUser(locale);
  return <SwapDocsInvoicePage locale={locale} id={id} mode={mode === "edit" ? "edit" : "view"} returnTo={returnTo} success={success} error={error} />;
}
