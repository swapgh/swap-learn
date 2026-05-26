import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { SwapDocsPage } from "@/modules/tools/SwapDocsPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("SwapDocs", "Private proforma and document tool", locale, "/account/tools/docs");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; success?: string; error?: string; tab?: string; clientId?: string; projectId?: string }>;
}) {
  const { locale } = await params;
  const { q, success, error, tab, clientId, projectId } = await searchParams;

  if (!isLocale(locale)) notFound();

  await requireToolPageUser(locale);
  return (
    <SwapDocsPage
      locale={locale}
      search={q ?? ""}
      success={success}
      error={error}
      tab={tab ?? ""}
      clientId={clientId ?? ""}
      projectId={projectId ?? ""}
    />
  );
}
