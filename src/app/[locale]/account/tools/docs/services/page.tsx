import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { requireToolPageUser } from "@/server/tool-access";
import { prisma } from "@/server/prisma";
import { SwapDocsServicesPage } from "@/modules/tools/SwapDocsServicesPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return pageMetadata("Servicios - SwapDocs", "Manage service catalog with rates", locale, "/account/tools/docs");
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

  const services = await prisma.service.findMany({
    include: { rates: true },
    orderBy: { name: "asc" },
  });

  return <SwapDocsServicesPage locale={locale} services={services} success={success} error={error} />;
}
