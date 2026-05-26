import { isLocale } from "@/lib/locale";
import { notFound } from "next/navigation";
import { SwapDocsSidebar } from "@/components/tools/SwapDocsSidebar";
import { TopBar } from "@/components/tools/TopBar";
import styles from "./layout.module.css";

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div className={styles.layout}>
      <SwapDocsSidebar locale={locale} />
      <div className={styles.mainArea}>
        <TopBar locale={locale} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
