import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { SwapDocsImportPage } from "@/modules/tools/SwapDocsImportPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("Importar CSV - SwapDocs", "Import clients and services from CSV", locale, "/account/tools/docs");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { success, error } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireToolPageUser(locale);
  return <SwapDocsImportPage locale={locale} success={success} error={error} />;
}
