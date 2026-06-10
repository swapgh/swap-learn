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
    include: { applications: { orderBy: { updatedAt: "desc" }, take: 1 } },
    orderBy: [{ updatedAt: "desc" }],
  });
  const [profile, searches, tasks] = await Promise.all([
    prisma.swapJobProfile.findUnique({ where: { userId } }),
    prisma.swapJobSearch.findMany({
      where: { userId },
      orderBy: [{ enabled: "desc" }, { source: "asc" }, { query: "asc" }],
    }),
    prisma.swapJobAutomationTask.findMany({
      where: { userId },
      include: { job: true, logs: { orderBy: { createdAt: "desc" }, take: 3 } },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    }),
  ]);

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
        <SwapJobsClient
          initialJobs={JSON.parse(JSON.stringify(jobs))}
          initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
          initialSearches={JSON.parse(JSON.stringify(searches))}
          initialTasks={JSON.parse(JSON.stringify(tasks))}
        />
      </div>
    </div>
  );
}
