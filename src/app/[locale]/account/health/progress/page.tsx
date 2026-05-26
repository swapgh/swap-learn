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
  return pageMetadata(content.weeklyReview, content.description, locale, "/account/health/progress");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { locale } = await params;
  const { day } = await searchParams;
  if (!isLocale(locale)) notFound();
  const user = await getAuthUser();
  if (!user) redirect(`/${locale}/login`);
  return <HealthPage activeTab="progress" locale={locale} selectedDay={day} user={user} />;
}
