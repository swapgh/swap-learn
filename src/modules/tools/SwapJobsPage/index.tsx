import { prisma } from "@/server/prisma";
import type { Locale } from "@/lib/locale";
import { AccountNav } from "@/components/account/AccountNav";
import { SwapJobsClient } from "./swap-jobs-client";
import styles from "./styles.module.css";

export async function SwapJobsPage({
  locale,
  userId,
}: {
  locale: Locale;
  userId: string;
}) {
  const jobs = await prisma.swapJob.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className={styles.page}>
      <AccountNav locale={locale} showTools />
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Private tool</p>
            <h1>SwapJobs</h1>
            <p>
              Analiza ofertas, guarda candidaturas y controla seguimientos desde
              tu cuenta privada.
            </p>
          </div>
        </div>
        <SwapJobsClient initialJobs={JSON.parse(JSON.stringify(jobs))} />
      </div>
    </div>
  );
}
