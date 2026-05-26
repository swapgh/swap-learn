import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import { ProjectTabsView } from "./ProjectTabsView";
import styles from "./styles.module.css";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

export async function SwapDocsProjectPage({
  locale,
  id,
  tab,
  success,
  error,
}: {
  locale: Locale;
  id: string;
  tab: string;
  success?: string;
  error?: string;
}) {
  const [project, serviceTemplates] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        estimations: true,
        costItems: { orderBy: [{ stage: "asc" }, { task: "asc" }] },
        workItems: { orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { task: "asc" }] },
        proformas: { include: { items: true, invoices: { select: { id: true, number: true, status: true } } }, orderBy: { createdAt: "desc" } },
        clientServices: { orderBy: [{ renewalDate: "asc" }, { createdAt: "desc" }] },
      },
    }),
    prisma.serviceTemplate.findMany({
      where: { isActive: true },
      include: { lines: { orderBy: [{ sortOrder: "asc" }, { description: "asc" }] } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!project) {
    notFound();
  }

  const toastMessage = success ?? error ?? null;

  return (
    <>
      <Toast message={toastMessage} />

      <header className={styles.stickyHeader}>
        <div className={styles.headerMain}>
          <div>
            <p className={styles.kicker}>Proyecto</p>
            <h1>{project.name}</h1>
            <p className={styles.headerMeta}>
              <a href={`/${locale}/account/tools/docs/clients/${project.client.id}`} className={styles.headerLink}>{project.client.name}</a>
              {" · "}{project.code ?? project.id} · {project.status} · Creado {formatDate(project.createdAt)}
            </p>
          </div>
          <a href={`/${locale}/account/tools/docs/clients/${project.client.id}?tab=presupuestos#crear-proforma`} className={styles.primaryBtn}>Crear proforma</a>
        </div>
      </header>

      <ProjectTabsView
        locale={locale}
        activeTab={tab}
        project={project}
        serviceTemplates={serviceTemplates}
      />
    </>
  );
}
