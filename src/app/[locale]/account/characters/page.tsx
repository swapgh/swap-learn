import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/metadata";
import { getAuthUser } from "@/server/auth";
import { CharactersPage } from "@/modules/account/CharactersPage";
import { dashboardContent } from "@/modules/account/DashboardPage/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const content = dashboardContent[locale];
  return pageMetadata(content.characters.heading, content.description, locale, "/account/characters");
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getAuthUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return <CharactersPage locale={locale} />;
}
