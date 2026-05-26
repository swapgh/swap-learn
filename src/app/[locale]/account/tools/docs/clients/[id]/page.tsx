import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { SwapDocsClientPage } from "@/modules/tools/SwapDocsClientPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("Cliente - SwapDocs", "Private client detail", locale, "/account/tools/docs");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ success?: string; error?: string; tab?: string }>;
}) {
  const { locale, id } = await params;
  const { success, error, tab } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireToolPageUser(locale);
  return <SwapDocsClientPage locale={locale} id={id} tab={tab ?? "resumen"} success={success} error={error} />;
}
