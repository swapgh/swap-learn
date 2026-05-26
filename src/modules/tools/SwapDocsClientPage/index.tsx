import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import { ClientTabsView } from "./ClientTabsView";
import { DeleteClientAction } from "./DeleteClientAction";
import styles from "./styles.module.css";

export async function SwapDocsClientPage({
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
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        include: {
          estimations: true,
          costItems: true,
          workItems: true,
          proformas: {
            include: {
              items: true,
              emailLogs: { orderBy: { createdAt: "desc" }, take: 3 },
              invoices: {
                include: {
                  payments: true,
                  emailLogs: { orderBy: { createdAt: "desc" }, take: 3 },
                },
                orderBy: { createdAt: "desc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      services: {
        orderBy: [{ renewalDate: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!client) {
    notFound();
  }

  const proformas = client.projects.flatMap((project) =>
    project.proformas.map((proforma) => ({ ...proforma, project }))
  );
  const invoices = proformas.flatMap((proforma) =>
    proforma.invoices.map((invoice) => ({ ...invoice, proforma }))
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const projectIds = client.projects.map((project) => project.id);
  const proformaIds = proformas.map((proforma) => proforma.id);
  const invoiceIds = invoices.map((invoice) => invoice.id);

  const activity = await prisma.activityLog.findMany({
    where: {
      OR: [
        { targetId: id, targetType: "client" },
        { targetType: "project", targetId: { in: projectIds } },
        { targetType: "proforma", targetId: { in: proformaIds } },
        { targetType: "invoice", targetId: { in: invoiceIds } },
        ...projectIds.map((projectId) => ({ targetType: "workItem", metadata: { path: ["projectId"], equals: projectId } })),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const totalProformas = proformas.reduce((sum, proforma) => sum + proforma.total, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0);
  const openInvoices = invoices.filter((inv) => inv.status === "draft" || inv.status === "sent" || inv.status === "overdue").length;
  const activeProjects = client.projects.filter((project) => project.status === "draft" || project.status === "sent" || project.status === "accepted").length;
  const pendingProformas = proformas.filter((proforma) => proforma.status === "draft" || proforma.status === "sent").length;
  const totalEstimatedHours = client.projects.reduce((sum, project) => sum + project.workItems.reduce((itemSum, item) => itemSum + item.estimatedHours, 0), 0);
  const totalActualHours = client.projects.reduce((sum, project) => sum + project.workItems.reduce((itemSum, item) => itemSum + item.actualHours, 0), 0);
  const totalCosts = client.projects.reduce((sum, project) => sum + project.costItems.reduce((itemSum, item) => itemSum + item.total, 0), 0);
  const activeServices = client.services.filter((service) => service.status === "active" || service.status === "pending");
  const servicesCost = activeServices.reduce((sum, service) => sum + service.internalCost, 0);
  const servicesRevenue = activeServices.reduce((sum, service) => sum + service.clientPrice, 0);

  const toastMessage = success ?? error ?? null;

  return (
    <>
      <Toast message={toastMessage} />

      <header className={styles.stickyHeader}>
        <div className={styles.headerMain}>
          <div>
            <p className={styles.kicker}>Cliente</p>
            <h1>{client.name}</h1>
            <p className={styles.headerMeta}>
              {client.code ?? "Sin código"} · {client.isCompany ? "Empresa" : "Persona física"} · {client.email ?? "Sin email"} · {client.nifCif ?? "Sin NIF/DNI"} · {client.country}
            </p>
            <p className={styles.headerMeta}>
              {activeProjects} proyectos activos · {pendingProformas} proformas pendientes · {formatCurrency(totalInvoiced - totalPaid)} pendiente de cobro
            </p>
            <p className={styles.headerMeta}>
              {activeServices.length} servicios activos · {formatCurrency(servicesRevenue - servicesCost)} margen recurrente estimado
            </p>
          </div>
          <div className={styles.headerActions}>
            <a href={`/${locale}/account/tools/docs/clients/${client.id}?tab=proyectos#nuevo-proyecto`}>Nuevo proyecto</a>
            <a href={`/${locale}/account/tools/docs/clients/${client.id}?tab=presupuestos#crear-proforma`}>Crear proforma</a>
            <a href="#datos-cliente">Editar cliente</a>
            <DeleteClientAction locale={locale} clientId={client.id} clientName={client.name} />
          </div>
        </div>
      </header>

      <ClientTabsView
        locale={locale}
        activeTab={tab}
        client={client}
        proformas={proformas}
        invoices={invoices}
        activity={activity}
        totalProformas={totalProformas}
        totalInvoiced={totalInvoiced}
        totalPaid={totalPaid}
        openInvoices={openInvoices}
        activeProjects={activeProjects}
        pendingProformas={pendingProformas}
        totalEstimatedHours={totalEstimatedHours}
        totalActualHours={totalActualHours}
        estimatedProfit={totalProformas - totalCosts + (servicesRevenue - servicesCost)}
      />
    </>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}
