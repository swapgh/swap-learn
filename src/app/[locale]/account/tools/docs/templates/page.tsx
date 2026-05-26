import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { prisma } from "@/server/prisma";
import { SwapDocsTemplatesPage } from "@/modules/tools/SwapDocsTemplatesPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("Plantillas - SwapDocs", "Manage service and cost templates", locale, "/account/tools/docs");
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

  const templates = await prisma.serviceTemplate.findMany({
    include: { lines: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <SwapDocsTemplatesPage locale={locale} templates={templates} success={success} error={error} />;
}
