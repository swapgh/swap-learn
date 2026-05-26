import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { getAuthUser } from "@/server/auth";
import { HealthPage } from "@/modules/account/HealthPage";
import { healthContent } from "@/modules/account/HealthPage/content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const content = healthContent[locale];
  return pageMetadata(locale === "es" ? "Guía - Salud" : "Guide - Health", content.description, locale, "/account/health/guide");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getAuthUser();
  if (!user) redirect(`/${locale}/login`);
  return <HealthPage activeTab="guide" locale={locale} user={user} />;
}
