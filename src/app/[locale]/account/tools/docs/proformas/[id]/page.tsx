import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { SwapDocsProformaPage } from "@/modules/tools/SwapDocsProformaPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("Proforma - SwapDocs", "Printable proforma detail", locale, "/account/tools/docs");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ mode?: string; returnTo?: string; success?: string; error?: string }>;
}) {
  const { locale, id } = await params;
  const { returnTo, success, error } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireToolPageUser(locale);
  return <SwapDocsProformaPage locale={locale} id={id} returnTo={returnTo} success={success} error={error} />;
}
