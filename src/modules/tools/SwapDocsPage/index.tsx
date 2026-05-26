import type { Prisma } from "@prisma/client";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import {
  createClient,
  createProject,
  createProformaFromServiceTemplate,
} from "./actions";
import { ProformaActions } from "./ProformaActions";
import { SERVICE_TEMPLATES } from "./templates";
import { PaymentTermsField } from "@/modules/tools/PaymentTermsField";
import {
  formatSwapDocsCurrency,
  formatSwapDocsDate,
  swapDocsProfessionalLabel,
  swapDocsStatusLabel,
  swapDocsSummaryLabel,
} from "@/modules/tools/swapdocs-i18n";
import styles from "./styles.module.css";

const VALID_TABS = ["clientes", "proyectos", "presupuestos", "facturas"] as const;

function progressBar(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function projectStats(project: {
  workItems: Array<{ estimatedHours: number; actualHours: number; status: string }>;
  costItems: Array<{ total: number }>;
  proformas: Array<{ total: number; subtotal?: number; status: string; items?: Array<{ internalCost: number; clientPrice: number; amount: number }>; invoices?: Array<{ status: string; total: number; payments: Array<{ amount: number }> }> }>;
}) {
  const estimated = project.workItems.reduce((sum, item) => sum + item.estimatedHours, 0);
  const actual = project.workItems.reduce((sum, item) => sum + item.actualHours, 0);
  const doneTasks = project.workItems.filter((item) => item.status === "done").length;
  const totalTasks = project.workItems.length;
  const budgeted = project.proformas.reduce((sum, item) => sum + item.total, 0);
  const acceptedItems = project.proformas
    .filter((item) => item.status === "accepted" || item.status === "converted")
    .flatMap((item) => item.items ?? []);
  const costs = acceptedItems.reduce((sum, item) => sum + item.internalCost, 0);
  const acceptedClientPrice = acceptedItems.reduce((sum, item) => sum + (item.clientPrice || item.amount), 0);
  const invoices = project.proformas.flatMap((item) => item.invoices ?? []);
  const invoiced = invoices.reduce((sum, item) => sum + item.total, 0);
  const paid = invoices.reduce((sum, item) => sum + item.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0);

  return {
    estimated,
    actual,
    doneTasks,
    totalTasks,
    taskPct: totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0,
    hoursPct: estimated > 0 ? Math.min(100, (actual / estimated) * 100) : 0,
    budgeted,
    costs,
    margin: acceptedClientPrice - costs,
    invoiced,
    paid,
    pending: Math.max(0, invoiced - paid),
  };
}

export async function SwapDocsPage({
  locale,
  search = "",
  success,
  error,
  tab = "",
  clientId = "",
  projectId = "",
}: {
  locale: Locale;
  search?: string;
  success?: string;
  error?: string;
  tab?: string;
  clientId?: string;
  projectId?: string;
}) {
  const fmt = (value: number) => formatSwapDocsCurrency(locale, value);
  const fmtDate = (value?: Date | null) => value ? formatSwapDocsDate(locale, value, { day: "numeric", month: "short" }) : "Sin datos";
  const activeTab = VALID_TABS.includes(tab as never) ? tab : "";
  const query = search.trim();
  const stringFilter = query ? { contains: query, mode: "insensitive" as const } : undefined;
  const clientWhere: Prisma.ClientWhereInput | undefined = stringFilter
    ? { OR: [{ code: stringFilter }, { name: stringFilter }, { email: stringFilter }, { nifCif: stringFilter }] }
    : undefined;
  const projectWhere: Prisma.ProjectWhereInput | undefined = stringFilter
    ? { OR: [{ code: stringFilter }, { name: stringFilter }, { client: { code: stringFilter } }, { client: { name: stringFilter } }] }
    : undefined;
  const proformaWhere: Prisma.ProformaWhereInput | undefined = stringFilter
    ? { OR: [{ number: stringFilter }, { project: { code: stringFilter } }, { project: { name: stringFilter } }, { project: { client: { code: stringFilter } } }, { project: { client: { name: stringFilter } } }, { items: { some: { description: stringFilter } } }] }
    : undefined;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    allClients,
    clients,
    projects,
    proformas,
    allInvoices,
    selectedProject,
    explicitClient,
    paidThisMonth,
    upcomingServices,
  ] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, take: 100 }),
    prisma.client.findMany({ where: clientWhere, orderBy: { createdAt: "desc" }, take: activeTab === "clientes" ? 100 : 12 }),
    prisma.project.findMany({
      where: projectWhere,
      include: {
        client: true,
        estimations: true,
        costItems: true,
        workItems: true,
        proformas: { include: { items: true, invoices: { include: { payments: true } } }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: activeTab === "proyectos" ? 100 : 20,
    }),
    prisma.proforma.findMany({
      where: proformaWhere,
      include: { project: { include: { client: true } }, items: true, invoices: { include: { payments: true } } },
      orderBy: { createdAt: "desc" },
      take: activeTab === "presupuestos" ? 100 : 20,
    }),
    prisma.invoice.findMany({
      where: stringFilter ? { OR: [{ number: stringFilter }, { proforma: { project: { code: stringFilter } } }, { proforma: { project: { client: { code: stringFilter } } } }, { proforma: { project: { client: { name: stringFilter } } } }] } : undefined,
      include: { proforma: { include: { project: { include: { client: true } } } }, payments: true },
      orderBy: { createdAt: "desc" },
      take: activeTab === "facturas" ? 100 : 20,
    }),
    projectId
      ? prisma.project.findUnique({
          where: { id: projectId },
          include: {
            client: true,
            estimations: true,
            costItems: true,
            workItems: true,
            proformas: { include: { items: true, invoices: { include: { payments: true } } }, orderBy: { createdAt: "desc" } },
          },
        })
      : null,
    clientId ? prisma.client.findUnique({ where: { id: clientId } }) : null,
    prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lt: monthEnd } },
      select: { amount: true },
    }),
    prisma.clientService.findMany({
      where: {
        status: { in: ["active", "pending"] },
        renewalDate: { not: null },
      },
      include: { client: true, project: true },
      orderBy: { renewalDate: "asc" },
      take: 8,
    }),
  ]);

  const selectedClient = selectedProject?.client ?? explicitClient;
  const contextualClientId = selectedClient?.id ?? "";
  const mode = selectedProject ? "project" : selectedClient ? "client" : "general";

  const contextProjects = selectedProject
    ? [selectedProject]
    : contextualClientId
      ? await prisma.project.findMany({
          where: { clientId: contextualClientId },
          include: {
            client: true,
            estimations: true,
            costItems: true,
            workItems: true,
            proformas: { include: { items: true, invoices: { include: { payments: true } } }, orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : projects;

  const contextProjectIds = contextProjects.map((project) => project.id);
  const contextProformas = selectedProject
    ? selectedProject.proformas
    : contextualClientId
      ? await prisma.proforma.findMany({
          where: { project: { clientId: contextualClientId } },
          include: { project: { include: { client: true } }, items: true, invoices: { include: { payments: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : proformas;
  const contextProformaIds = contextProformas.map((proforma) => proforma.id);
  const contextInvoices = selectedProject
    ? selectedProject.proformas.flatMap((proforma) => proforma.invoices)
    : contextualClientId
      ? await prisma.invoice.findMany({
          where: { proforma: { project: { clientId: contextualClientId } } },
          include: { proforma: { include: { project: { include: { client: true } } } }, payments: true },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : allInvoices;
  const contextInvoiceIds = contextInvoices.map((invoice) => invoice.id);

  const activityWhere: Prisma.ActivityLogWhereInput | undefined = selectedProject
    ? {
        OR: [
          { targetType: "project", targetId: selectedProject.id },
          { targetType: "proforma", targetId: { in: contextProformaIds } },
          { targetType: "invoice", targetId: { in: contextInvoiceIds } },
          { targetType: "workItem", metadata: { path: ["projectId"], equals: selectedProject.id } },
        ],
      }
    : selectedClient
      ? {
          OR: [
            { targetType: "client", targetId: selectedClient.id },
            { targetType: "project", targetId: { in: contextProjectIds } },
            { targetType: "proforma", targetId: { in: contextProformaIds } },
            { targetType: "invoice", targetId: { in: contextInvoiceIds } },
          ],
        }
      : undefined;

  const activityLogs = await prisma.activityLog.findMany({
    where: activityWhere,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const activeProjects = contextProjects.filter((project) => project.status === "accepted" || project.status === "sent" || project.status === "draft");
  const visibleActivityLogs = activityLogs.slice(0, 8);
  const visibleActiveProjects = mode === "project" ? activeProjects : activeProjects.slice(0, 2);
  const pendingProformas = contextProformas.filter((proforma) => proforma.status === "sent" || proforma.status === "draft");
  const pendingInvoices = contextInvoices.filter((invoice) => invoice.status === "draft" || invoice.status === "sent" || invoice.status === "overdue");
  const collectedThisMonth = paidThisMonth.reduce((sum, payment) => sum + payment.amount, 0);
  const contextStats = contextProjects.reduce(
    (acc, project) => {
      const stats = projectStats(project);
      acc.estimated += stats.estimated;
      acc.actual += stats.actual;
      acc.budgeted += stats.budgeted;
      acc.costs += stats.costs;
      acc.margin += stats.margin;
      acc.invoiced += stats.invoiced;
      acc.paid += stats.paid;
      acc.pending += stats.pending;
      return acc;
    },
    { estimated: 0, actual: 0, budgeted: 0, costs: 0, margin: 0, invoiced: 0, paid: 0, pending: 0 },
  );
  const selectedProjectStats = selectedProject ? projectStats(selectedProject) : null;
  const latestProforma = contextProformas[0];
  const latestInvoice = contextInvoices[0];
  const defaultClientId = selectedClient?.id ?? "";
  const defaultProjectId = selectedProject?.id ?? contextProjects[0]?.id ?? "";
  const toastMessage = success ?? error ?? null;

  const activityLabels: Record<string, string> = {
    created: "creó",
    updated: "actualizó",
    update: "actualizó",
    deleted: "eliminó",
    delete: "eliminó",
    payment: "registró pago",
  };

  return (
    <>
      <Toast message={toastMessage} />

      {activeTab === "clientes" && (
        <section className={styles.panel}>
          <h2>Clientes ({clients.length})</h2>
          <div className={styles.list}>
            {clients.map((client) => (
              <article key={client.id} className={`${styles.row} ${styles.clickableRow}`}>
                <a href={`/${locale}/account/tools/docs/clients/${client.id}`} className={styles.rowOverlay} aria-label={`Abrir cliente ${client.name}`} />
                <div>
                  <strong className={styles.docTitle}>{client.code ? `${client.code} · ` : ""}{client.name}</strong>
                  <p>{client.email || "Sin email"} · {client.country} · {client.isCompany ? "Empresa" : "Persona física"}</p>
                </div>
                <span>{client.nifCif || "Sin NIF"}</span>
              </article>
            ))}
            {clients.length === 0 && <div className={styles.emptyState}><p>No hay clientes</p></div>}
          </div>
        </section>
      )}

      {activeTab === "proyectos" && (
        <section className={styles.panel}>
          <h2>Proyectos ({projects.length})</h2>
          <div className={styles.list}>
            {projects.map((project) => {
              const latestProjectProforma = project.proformas[0];
              const proformaTotal = project.proformas.reduce((sum, proforma) => sum + proforma.total, 0);
              const proformaCountLabel = `${project.proformas.length} proforma${project.proformas.length === 1 ? "" : "s"}`;
              const proformaSummary = latestProjectProforma
                ? `${proformaCountLabel} · Última ${latestProjectProforma.number} · ${swapDocsStatusLabel(locale, latestProjectProforma.status)}`
                : "Sin proforma";

              return (
                <article key={project.id} className={`${styles.row} ${styles.clickableRow}`}>
                  <a href={`/${locale}/account/tools/docs/projects/${project.id}`} className={styles.rowOverlay} aria-label={`Abrir proyecto ${project.name}`} />
                  <div className={styles.projectListMain}>
                    <strong className={styles.docTitle}>{project.code ? `${project.code} · ` : ""}{project.name}</strong>
                    <p>{project.client.code ? `${project.client.code} · ` : ""}{project.client.name} · {swapDocsStatusLabel(locale, project.status)}</p>
                    <p className={styles.projectListSummary}>{proformaSummary}</p>
                  </div>
                  <span className={styles.projectListTotal}>{fmt(proformaTotal)}</span>
                </article>
              );
            })}
            {projects.length === 0 && <div className={styles.emptyState}><p>No hay proyectos</p></div>}
          </div>
        </section>
      )}

      {activeTab === "presupuestos" && (
        <section className={styles.panel}>
          <h2>Proformas ({proformas.length})</h2>
          <div className={styles.list}>
            {proformas.map((proforma) => (
              <article key={proforma.id} className={`${styles.row} ${styles.clickableRow}`}>
                <a
                  href={`/${locale}/account/tools/docs/proformas/${proforma.id}?returnTo=${encodeURIComponent(`/${locale}/account/tools/docs?tab=presupuestos`)}`}
                  className={styles.rowOverlay}
                  aria-label={`Ver detalle de ${proforma.number}`}
                />
                <div>
                  <strong className={styles.docTitle}>{proforma.number}</strong>
                  <p>{proforma.project.code ? `${proforma.project.code} · ` : ""}{proforma.project.name} · {proforma.project.client.code ? `${proforma.project.client.code} · ` : ""}{proforma.project.client.name} · {swapDocsStatusLabel(locale, proforma.status)}</p>
                </div>
                <div className={styles.rowActions}>
                  <span>{fmt(proforma.total)}</span>
                  <ProformaActions
                    locale={locale}
                    id={proforma.id}
                    number={proforma.number}
                    returnTo={`/${locale}/account/tools/docs?tab=presupuestos`}
                    hideDetail
                    editHref={`/${locale}/account/tools/docs/clients/${proforma.project.client.id}?tab=presupuestos&editProforma=${proforma.id}#crear-proforma`}
                  />
                </div>
              </article>
            ))}
            {proformas.length === 0 && <div className={styles.emptyState}><p>No hay proformas</p></div>}
          </div>
        </section>
      )}

      {activeTab === "facturas" && (
        <section className={styles.panel}>
          <h2>Facturas ({allInvoices.length})</h2>
          <div className={styles.list}>
            {allInvoices.map((invoice) => (
              <article key={invoice.id} className={`${styles.row} ${styles.clickableRow}`}>
                <a
                  href={`/${locale}/account/tools/docs/invoices/${invoice.id}?returnTo=${encodeURIComponent(`/${locale}/account/tools/docs?tab=facturas`)}`}
                  className={styles.rowOverlay}
                  aria-label={`Abrir factura ${invoice.number}`}
                />
                <div>
                  <strong className={styles.docTitle}>{invoice.number}</strong>
                  <p>{invoice.proforma.project.code ? `${invoice.proforma.project.code} · ` : ""}{invoice.proforma.project.name} · {invoice.proforma.project.client.code ? `${invoice.proforma.project.client.code} · ` : ""}{invoice.proforma.project.client.name} · {swapDocsStatusLabel(locale, invoice.status)}</p>
                </div>
                <div className={styles.rowActions}>
                  <span>{fmt(invoice.total)}</span>
                </div>
              </article>
            ))}
            {allInvoices.length === 0 && <div className={styles.emptyState}><p>No hay facturas</p></div>}
          </div>
        </section>
      )}

      {!activeTab && (
        <>
          <section className={styles.contextPanel}>
            <div>
              <span className={styles.kicker}>Contexto actual</span>
              <h1>
                {mode === "project" && `Proyecto seleccionado: ${selectedProject?.name}`}
                {mode === "client" && `Cliente seleccionado: ${selectedClient?.name}`}
                {mode === "general" && "Dashboard general"}
              </h1>
              <p>
                {mode === "project" && `${selectedProject?.client.name} · seguimiento, proformas y cobro del proyecto.`}
                {mode === "client" && "Los KPIs, proyectos, actividad y formularios se limitan a este cliente."}
                {mode === "general" && "Vista global de clientes, proyectos, proformas, facturas y actividad reciente."}
              </p>
            </div>
            {mode !== "general" && (
              <a href={`/${locale}/account/tools/docs`} className={styles.secondaryLink}>
                Quitar selección
              </a>
            )}
          </section>

          <section className={styles.kpiRow}>
            {mode === "general" && (
              <>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{pendingProformas.length}</span><span className={styles.kpiLabel}>Proformas pendientes de respuesta</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{activeProjects.length}</span><span className={styles.kpiLabel}>Proyectos en progreso</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{pendingInvoices.length}</span><span className={styles.kpiLabel}>Facturas pendientes de cobro</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(collectedThisMonth)}</span><span className={styles.kpiLabel}>Cobrado este mes</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{contextStats.actual}h</span><span className={styles.kpiLabel}>Horas reales registradas</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(contextStats.margin)}</span><span className={styles.kpiLabel}>Margen interno estimado</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{upcomingServices.length}</span><span className={styles.kpiLabel}>Renovaciones próximas</span></div>
              </>
            )}
            {mode === "client" && (
              <>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(contextStats.invoiced)}</span><span className={styles.kpiLabel}>Total facturado al cliente</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(contextStats.pending)}</span><span className={styles.kpiLabel}>Pendiente de cobrar</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{activeProjects.length}</span><span className={styles.kpiLabel}>Proyectos activos del cliente</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{latestProforma?.number ?? "Sin proforma"}</span><span className={styles.kpiLabel}>Última proforma enviada</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{latestInvoice?.number ?? "Sin factura"}</span><span className={styles.kpiLabel}>Última factura</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(contextStats.margin)}</span><span className={styles.kpiLabel}>Margen interno del cliente</span></div>
              </>
            )}
            {mode === "project" && selectedProjectStats && selectedProject && (
              <>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{swapDocsStatusLabel(locale, selectedProject.status)}</span><span className={styles.kpiLabel}>Estado del proyecto</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{selectedProject.proformas[0]?.number ?? "Sin proforma"}</span><span className={styles.kpiLabel}>Proforma asociada: {selectedProject.proformas[0] ? swapDocsStatusLabel(locale, selectedProject.proformas[0].status) : "pendiente"}</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{selectedProjectStats.doneTasks}/{selectedProjectStats.totalTasks}</span><span className={styles.kpiLabel}>Progreso de tareas</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{selectedProjectStats.actual}h / {selectedProjectStats.estimated}h</span><span className={styles.kpiLabel}>Horas reales vs estimadas</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(selectedProjectStats.budgeted)}</span><span className={styles.kpiLabel}>Total presupuestado</span></div>
                <div className={styles.kpiCard}><span className={styles.kpiValue}>{fmt(selectedProjectStats.pending)}</span><span className={styles.kpiLabel}>Factura / pendiente de cobro</span></div>
              </>
            )}
          </section>

          <div className={styles.dashboardGrid}>
            <section className={styles.panel}>
              <h2>Actividad reciente</h2>
              <div className={styles.activityList}>
                {activityLogs.length === 0 && <p className={styles.emptyText}>Aún no hay actividad para este contexto</p>}
                {visibleActivityLogs.map((log) => (
                  <div key={log.id} className={styles.activityItem}>
                    <span className={styles.activityAction}>{activityLabels[log.action] ?? log.action}</span>
                    <span className={styles.activityTarget}>{log.targetType}</span>
                    <span className={styles.activityName}>{log.targetName}</span>
                    <span className={styles.activityTime}>{fmtDate(log.createdAt)}</span>
                  </div>
                ))}
                {activityLogs.length > visibleActivityLogs.length && (
                  <p className={styles.listLimitNote}>
                    Mostrando {visibleActivityLogs.length} de {activityLogs.length} acciones recientes.
                  </p>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <h2>{mode === "project" ? "Seguimiento del proyecto" : "Proyectos activos"}</h2>
              {activeProjects.length === 0 ? (
                <p className={styles.emptyText}>No hay proyectos activos en este contexto</p>
              ) : (
                <div className={styles.projectProgressList}>
                  {visibleActiveProjects.map((project) => {
                    const stats = projectStats(project);
                    const proformaStatus = project.proformas[0] ? swapDocsStatusLabel(locale, project.proformas[0].status) : "sin proforma";
                    const invoiceStatus = project.proformas.flatMap((proforma) => proforma.invoices)[0]?.status;

                    return (
                      <div key={project.id} className={styles.projectProgressRow}>
                        <a href={`/${locale}/account/tools/docs/projects/${project.id}`} className={styles.rowOverlay} aria-label={`Abrir proyecto ${project.name}`} />
                        <div className={styles.projectProgressHeader}>
                          <a href={`/${locale}/account/tools/docs/projects/${project.id}`} className={styles.projectProgressName}>
                            {project.name}
                          </a>
                          <span className={styles.projectProgressClient}>{project.code ? `${project.code} · ` : ""}{project.client.name}</span>
                          <span className={`${styles.statusBadge} ${styles[`status${project.status}`]}`}>{swapDocsStatusLabel(locale, project.status)}</span>
                        </div>
                        <div className={styles.projectProgressBars}>
                          <div className={styles.progressLabeled}><span>Tareas: {stats.doneTasks}/{stats.totalTasks}</span>{progressBar(stats.taskPct)}</div>
                          <div className={styles.progressLabeled}><span>Horas: {stats.actual}h / {stats.estimated}h</span>{progressBar(stats.hoursPct)}</div>
                          <div className={styles.progressLabeled}><span>Proformas: {fmt(stats.budgeted)}</span><span className={styles.proformaStatusTag}>{proformaStatus}</span></div>
                          <div className={styles.progressLabeled}><span>Cobro: {fmt(stats.paid)} / {fmt(stats.invoiced)}</span><span className={styles.proformaStatusTag}>{invoiceStatus ? swapDocsStatusLabel(locale, invoiceStatus) : "sin factura"}</span></div>
                        </div>
                      </div>
                    );
                  })}
                  {activeProjects.length > visibleActiveProjects.length && (
                    <div className={styles.listLimitNote}>
                      Mostrando {visibleActiveProjects.length} de {activeProjects.length} proyectos activos.
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {mode === "general" && (
            <section className={styles.panel}>
              <h2>Servicios y vencimientos</h2>
              <div className={styles.list}>
                {upcomingServices.map((service) => (
                  <article key={service.id} className={styles.row}>
                    <div>
                      <strong className={styles.docTitle}>{service.code ? `${service.code} · ` : ""}{service.name}</strong>
                      <p>{service.client.name} · {service.project?.name ?? "sin proyecto"} · {service.provider ?? "proveedor sin definir"}</p>
                    </div>
                    <div className={styles.rowActions}>
                      <span>{service.renewalDate ? fmtDate(service.renewalDate) : "Sin vencimiento"}</span>
                      <span>{fmt(service.clientPrice)} · margen {fmt(service.margin)}</span>
                    </div>
                  </article>
                ))}
                {upcomingServices.length === 0 && <p className={styles.emptyText}>No hay renovaciones registradas.</p>}
              </div>
            </section>
          )}

          <section className={styles.quickActionsPanel}>
            <div className={styles.quickActionsHeader}>
              <div>
                <span className={styles.kicker}>Accesos rápidos inteligentes</span>
                <h2>Nuevo cliente → Nuevo proyecto → Proforma rápida desde plantilla</h2>
              </div>
              {selectedClient && <span className={styles.contextChip}>Cliente: {selectedClient.name}</span>}
              {selectedProject && <span className={styles.contextChip}>Proyecto: {selectedProject.name}</span>}
            </div>

            <div className={styles.formGrid}>
              <form action={createClient.bind(null, locale)} className={styles.panel}>
                <h3>Nuevo cliente</h3>
                <label className={styles.formField}>Nombre / empresa<input name="name" required autoComplete="organization" /></label>
                <label className={styles.formField}>Tipo de cliente<select name="clientType" defaultValue="company"><option value="company">Empresa</option><option value="person">Persona física</option></select></label>
                <label className={styles.formField}>NIF/CIF/DNI/NIE<input name="nifCif" placeholder="Recomendado para empresa" autoComplete="off" /></label>
                <label className={styles.formField}>Email<input name="email" type="email" autoComplete="email" /></label>
                <label className={styles.formField}>Dirección<input name="address" autoComplete="street-address" /></label>
                <label className={styles.formField}>País<input name="country" defaultValue="ES" autoComplete="country-name" /></label>
                <button type="submit">Guardar cliente</button>
              </form>

              <form action={createProject.bind(null, locale)} className={styles.panel}>
                <h3>Nuevo proyecto</h3>
                <label className={styles.formField}>Nombre del proyecto<input name="name" required autoComplete="off" /></label>
                <label className={styles.formField}>
                  Cliente
                  <select key={defaultClientId || "manual-client"} name="clientId" required defaultValue={defaultClientId}>
                    <option value="">Seleccionar cliente</option>
                    {allClients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </label>
                <p>Si hay cliente seleccionado, se usa automáticamente. Puedes cambiarlo antes de guardar.</p>
                <button type="submit" disabled={allClients.length === 0}>Guardar proyecto</button>
              </form>

              <form action={createProformaFromServiceTemplate.bind(null, locale)} className={styles.panelFeatured}>
                <h3>Proforma rápida</h3>
                <label className={styles.formField}>
                  Proyecto
                  <select key={defaultProjectId || "manual-project"} name="projectId" required defaultValue={defaultProjectId}>
                    <option value="">Seleccionar proyecto</option>
                    {contextProjects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name} · {project.client.name}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.formField}>
                  Plantilla
                  <select name="serviceTemplateId" required>
                    <option value="">Seleccionar plantilla</option>
                    {SERVICE_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>{swapDocsProfessionalLabel(locale, template.name)} · {swapDocsSummaryLabel(locale, template.summary)}</option>
                    ))}
                  </select>
                </label>
                <p>La plantilla copiará sus líneas a la proforma. Tareas y servicios se generan cuando la proforma se acepta.</p>
                <label className={styles.formField}>Descuento<input name="discount" type="number" step="0.01" min="0" placeholder="0,00" autoComplete="off" /></label>
                <label className={styles.formField}>IVA %<input name="ivaRate" type="number" step="0.01" min="0" defaultValue="21" autoComplete="off" /></label>
                <label className={styles.formField}>Forma de pago<select name="paymentMethod" defaultValue="bank_transfer"><option value="bank_transfer">Transferencia bancaria</option><option value="card">Tarjeta</option><option value="paypal">PayPal</option><option value="bizum">Bizum</option><option value="cash">Efectivo</option><option value="other">Otro método</option></select></label>
                <PaymentTermsField className={styles.formField} locale={locale} />
                <button type="submit" disabled={contextProjects.length === 0}>Crear proforma desde plantilla</button>
              </form>
            </div>
          </section>
        </>
      )}
    </>
  );
}
