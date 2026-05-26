"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { Tabs } from "@/components/ui/Tabs";
import { ClientDetailsEditor } from "./ClientDetailsEditor";
import {
  createInvoiceFromProforma,
  createProject,
  createProformaFromServiceTemplate,
  generateWorkItemsFromAcceptedProforma,
  sendInvoiceByEmail,
  updateProformaStatus,
  updateProforma,
} from "@/modules/tools/SwapDocsPage/actions";
import { ProformaActions } from "@/modules/tools/SwapDocsPage/ProformaActions";
import { ProjectActions } from "@/modules/tools/SwapDocsPage/ProjectActions";
import { SERVICE_TEMPLATES } from "@/modules/tools/SwapDocsPage/templates";
import { PaymentTermsField } from "@/modules/tools/PaymentTermsField";
import {
  formatSwapDocsCurrency,
  formatSwapDocsDate,
  swapDocsCategoryLabel,
  swapDocsLineTypeLabel,
  swapDocsProfessionalLabel,
  swapDocsStatusLabel,
  swapDocsSummaryLabel,
  swapDocsUnitLabel,
} from "@/modules/tools/swapdocs-i18n";
import styles from "./styles.module.css";

type EmailLogMini = { id: string; status: string; to: string; createdAt: Date };
type InvoiceMini = { id: string; number: string; total: number; status: string; payments: Array<{ amount: number }>; emailLogs?: EmailLogMini[] };

type ClientData = {
  id: string; code: string | null; name: string; email: string | null; phone: string | null; nifCif: string | null;
  vatId: string | null; country: string; address: string | null; createdAt: Date; isCompany: boolean;
  services: Array<{
    id: string; code: string | null; name: string; provider: string | null; status: string; unitType: string;
    internalCost: number; clientPrice: number; margin: number; startedAt: Date;
    endsAt: Date | null; renewalDate: Date | null; recurrenceMonths: number | null; notes: string | null;
    projectId: string | null;
  }>;
  projects: Array<{
    id: string; code: string | null; name: string; status: string; createdAt: Date;
    estimations: Array<{ tpe: number }>;
    costItems: Array<{ total: number }>;
    workItems: Array<{ actualHours: number; estimatedHours: number; status: string }>;
    proformas: Array<{ id: string; number: string; status: string; total: number; invoices: InvoiceMini[] }>;
  }>;
};

type ProformaRow = {
  id: string;
  number: string;
  issueDate: Date;
  status: string;
  subtotal: number;
  discount: number;
  ivaRate: number;
  ivaAmount: number;
  total: number;
  notes: string | null;
  projectId: string;
  items: Array<{ id: string; description: string; hours: number; rate: number; amount: number; lineType: string; unitType: string; internalCost: number; provider: string | null; recurrenceMonths: number | null }>;
  invoices: InvoiceMini[];
  emailLogs: EmailLogMini[];
  project: { id: string; name: string; status: string; workItems: Array<{ status: string }> };
};
type InvoiceRow = InvoiceMini & { proforma: { id: string; number: string; projectId: string; project: { id: string; name: string } } };
type ActivityRow = { id: string; action: string; targetType: string; targetName: string; createdAt: Date };
type PreviewLine = {
  id: string; itemId?: string; category: string; description: string; hours: number; rate: number; amount: number;
  lineType: string; unitType: string; internalCost: number; provider: string; recurrenceMonths: number | null;
};

function categoryFromTemplateLine(description: string, lineType?: string) {
  const lower = description.toLowerCase();
  if (lineType === "recurring_service" || /\b(hosting|vps|servidor|dominio|licencia)\b/.test(lower)) return "Infrastructure";
  if (lineType === "margin" || /\b(margen|gestión|gestion|contingencia|management)\b/.test(lower)) return "Management";
  if (/\b(análisis|analisis|diseño|diseno|analysis|design|requirements)\b/.test(lower)) return "Analysis";
  if (/\b(backend|api|endpoint)\b/.test(lower)) return "Backend";
  if (/\b(frontend|interfaz|maquetado|ui)\b/.test(lower)) return "Frontend";
  if (/\b(base de datos|bbdd|modelo|database|migrations)\b/.test(lower)) return "Database";
  if (/\b(testing|prueba|pruebas|correcciones|bugs?)\b/.test(lower)) return "Testing";
  if (/\b(deploy|deployment|despliegue|configuración|configuracion)\b/.test(lower)) return "Deployment";
  return "General";
}

const inferredCategories = new Set(["Infrastructure", "Gestión", "Management", "Análisis", "Analysis", "Backend", "Frontend", "BBDD", "Database", "Testing", "Deploy", "Deployment", "General", "Plantilla", "Template", "Proforma"]);

function linesFromTemplate(templateId: string): PreviewLine[] {
  const template = SERVICE_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return [];
  return template.proformaItems.map((item, index) => {
    const lineType = "lineType" in item ? item.lineType : "own_work";
    return {
      id: `${template.id}-${index}`,
      category: categoryFromTemplateLine(item.description, lineType),
      description: item.description,
      hours: item.hours,
      rate: item.rate,
      amount: item.hours * item.rate,
      lineType,
      unitType: "unitType" in item ? item.unitType : "hour",
      internalCost: "internalCost" in item ? item.internalCost : 0,
      provider: "provider" in item ? item.provider ?? "" : "",
      recurrenceMonths: "recurrenceMonths" in item ? item.recurrenceMonths ?? null : null,
    };
  });
}

function splitLineDescription(value: string) {
  const match = value.match(/^\[([^\]]+)\]\s*(.+)$/);
  return {
    category: match?.[1] ?? "Proforma",
    description: match?.[2] ?? value,
  };
}

function linesFromProforma(proforma: ProformaRow): PreviewLine[] {
  return proforma.items.map((item) => {
    const parsed = splitLineDescription(item.description);
    const category = parsed.category.toLowerCase() === "plantilla"
      ? categoryFromTemplateLine(parsed.description)
      : parsed.category;
    return {
      id: item.id,
      itemId: item.id,
      category,
      description: parsed.description,
      hours: item.hours,
      rate: item.rate,
      amount: item.amount,
      lineType: item.lineType,
      unitType: item.unitType,
      internalCost: item.internalCost,
      provider: item.provider ?? "",
      recurrenceMonths: item.recurrenceMonths,
    };
  });
}

function lineTotals(lines: PreviewLine[], discount: number, ivaRate: number) {
  const subtotal = lines.reduce((sum, item) => sum + item.amount, 0);
  const base = Math.max(0, subtotal - discount);
  const iva = base * (ivaRate / 100);
  return { subtotal, base, iva, total: base + iva };
}

function templateOrigin(notes: string | null) {
  return notes?.startsWith("Plantilla origen: ") ? notes.replace("Plantilla origen: ", "") : null;
}

function projectSummary(project: ClientData["projects"][number]) {
  const mainProforma = project.proformas[0] ?? null;
  const invoices = project.proformas.flatMap((proforma) => proforma.invoices);
  const mainInvoice = invoices[0] ?? null;
  const estimatedHours = project.workItems.reduce((sum, item) => sum + item.estimatedHours, 0);
  const actualHours = project.workItems.reduce((sum, item) => sum + item.actualHours, 0);
  const doneTasks = project.workItems.filter((item) => item.status === "done").length;
  const totalTasks = project.workItems.length;
  const budgeted = project.proformas.reduce((sum, item) => sum + item.total, 0);
  const costs = project.costItems.reduce((sum, item) => sum + item.total, 0);
  const paid = invoices.reduce((sum, invoice) => sum + invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0);
  const acceptedProforma = project.proformas.find((proforma) => proforma.status === "accepted");
  const acceptedWithoutTracking = Boolean(acceptedProforma && totalTasks === 0);
  const completedWithoutInvoice = project.status === "completed" && invoices.length === 0;

  return {
    mainProforma,
    mainInvoice,
    acceptedProforma,
    acceptedWithoutTracking,
    completedWithoutInvoice,
    estimatedHours,
    actualHours,
    doneTasks,
    totalTasks,
    progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    budgeted,
    paid,
    margin: budgeted - costs,
  };
}

function nextAction(client: ClientData) {
  if (client.projects.length === 0) {
    return { text: "Este cliente no tiene proyectos activos.", cta: "Crear proyecto", href: "projects-tab" };
  }

  for (const project of client.projects) {
    const summary = projectSummary(project);
    if (summary.acceptedWithoutTracking) {
      return { text: `Proyecto ${project.name} tiene proforma aceptada pero no seguimiento.`, cta: "Generar seguimiento", href: `#project-${project.id}` };
    }
    if (summary.completedWithoutInvoice) {
      return { text: `Proyecto ${project.name} está completado y pendiente de factura.`, cta: "Crear factura", href: `#project-${project.id}` };
    }
    const pendingInvoice = project.proformas.flatMap((p) => p.invoices).find((invoice) => invoice.status === "sent" || invoice.status === "overdue");
    if (pendingInvoice) {
      return { text: `Factura ${pendingInvoice.number} está pendiente de cobro.`, cta: "Abrir factura", href: `invoice:${pendingInvoice.id}` };
    }
  }

  return { text: "No hay bloqueos claros. Revisa proyectos activos y cobros pendientes.", cta: "Ver proyectos", href: "#proyectos-cliente" };
}

export function ClientTabsView({
  locale, activeTab, client, proformas, invoices, activity,
  totalProformas, totalInvoiced, totalPaid, openInvoices,
  activeProjects, pendingProformas, totalEstimatedHours, totalActualHours, estimatedProfit,
}: {
  locale: Locale; activeTab: string;
  client: ClientData;
  proformas: ProformaRow[];
  invoices: InvoiceRow[];
  activity: ActivityRow[];
  totalProformas: number;
  totalInvoiced: number; totalPaid: number; openInvoices: number;
  activeProjects: number; pendingProformas: number; totalEstimatedHours: number; totalActualHours: number; estimatedProfit: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = activeTab;
  const formatCurrency = (value: number) => formatSwapDocsCurrency(locale, value);
  const formatDate = (value: Date) => formatSwapDocsDate(locale, value);
  const requestedEditProformaId = sp.get("editProforma");
  const recommended = nextAction(client);
  const currentClientTabPath = `/${locale}/account/tools/docs/clients/${client.id}?tab=${tab}`;
  const proformaReturnTo = `/${locale}/account/tools/docs/clients/${client.id}?tab=presupuestos`;
  const invoiceReturnTo = `/${locale}/account/tools/docs/clients/${client.id}?tab=facturas`;
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [ivaRate, setIvaRate] = useState(21);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [editingPreview, setEditingPreview] = useState(false);
  const [showAllPreviewLines, setShowAllPreviewLines] = useState(false);
  const [previewLines, setPreviewLines] = useState<PreviewLine[]>([]);
  const [proformaStatusFilter, setProformaStatusFilter] = useState("all");
  const [editingProformaId, setEditingProformaId] = useState<string | null>(null);
  const [dismissedEditProformaId, setDismissedEditProformaId] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState("draft");
  const [workspaceNotes, setWorkspaceNotes] = useState("");
  const [deletedLineIds, setDeletedLineIds] = useState<string[]>([]);
  const selectedTemplate = SERVICE_TEMPLATES.find((item) => item.id === selectedTemplateId) ?? null;
  const editingProforma = proformas.find((proforma) => proforma.id === editingProformaId) ?? null;
  const previewTotals = useMemo(() => lineTotals(previewLines, discount, ivaRate), [previewLines, discount, ivaRate]);
  const visiblePreviewLines = showAllPreviewLines || editingPreview ? previewLines : previewLines.slice(0, 8);
  const filteredProformas = useMemo(
    () => proformaStatusFilter === "all" ? proformas : proformas.filter((proforma) => proforma.status === proformaStatusFilter),
    [proformaStatusFilter, proformas]
  );
  const recommendedHref =
    recommended.href === "projects-tab"
      ? `/${locale}/account/tools/docs/clients/${client.id}?tab=proyectos#nuevo-proyecto`
      : recommended.href.startsWith("invoice:")
        ? `/${locale}/account/tools/docs/invoices/${recommended.href.replace("invoice:", "")}?returnTo=${encodeURIComponent(`/${locale}/account/tools/docs/clients/${client.id}`)}`
      : recommended.href.startsWith("/account")
        ? `/${locale}${recommended.href}`
        : recommended.href;

  useEffect(() => {
    if (
      tab !== "presupuestos" ||
      !requestedEditProformaId ||
      dismissedEditProformaId === requestedEditProformaId ||
      editingProformaId === requestedEditProformaId
    ) {
      return;
    }
    const proforma = proformas.find((item) => item.id === requestedEditProformaId);
    if (!proforma) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setEditingProformaId(proforma.id);
      setDismissedEditProformaId(null);
      setDiscount(proforma.discount);
      setIvaRate(proforma.ivaRate);
      setWorkspaceStatus(proforma.status);
      setWorkspaceNotes(proforma.notes ?? "");
      setDeletedLineIds([]);
      setPreviewLines(linesFromProforma(proforma));
      setPreviewOpen(true);
      setEditingPreview(true);
      setShowAllPreviewLines(true);
      document.getElementById("crear-proforma")?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [dismissedEditProformaId, editingProformaId, proformas, requestedEditProformaId, tab]);

  function onTabChange(id: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", id);
    router.push(`/${locale}/account/tools/docs/clients/${client.id}?${params}`);
  }

  function changeTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    setEditingProformaId(null);
    setWorkspaceStatus("draft");
    setWorkspaceNotes("");
    setDeletedLineIds([]);
    setPreviewLines(linesFromTemplate(templateId));
    setShowAllPreviewLines(false);
    setEditingPreview(false);
  }

  function updatePreviewLine(id: string, patch: Partial<PreviewLine>) {
    setPreviewLines((items) => items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      if ("hours" in patch || "rate" in patch) {
        next.amount = next.hours * next.rate;
      }
      if (("description" in patch || "lineType" in patch) && !("category" in patch) && inferredCategories.has(item.category)) {
        next.category = categoryFromTemplateLine(next.description, next.lineType);
      }
      return next;
    }));
  }

  function addPreviewLine() {
    setEditingPreview(true);
    setPreviewOpen(true);
    setShowAllPreviewLines(true);
    setPreviewLines((items) => [
      ...items,
      { id: `custom-${Date.now()}`, category: "Extra", description: "Línea personalizada", hours: 0, rate: 0, amount: 0, lineType: "own_work", unitType: "hour", internalCost: 0, provider: "", recurrenceMonths: null },
    ]);
  }

  function removePreviewLine(line: PreviewLine) {
    if (line.itemId) {
      setDeletedLineIds((items) => items.includes(line.itemId ?? "") ? items : [...items, line.itemId ?? ""]);
    }
    setPreviewLines((items) => items.filter((item) => item.id !== line.id));
  }

  function startEditingProforma(proforma: ProformaRow) {
    setEditingProformaId(proforma.id);
    setDismissedEditProformaId(null);
    setDiscount(proforma.discount);
    setIvaRate(proforma.ivaRate);
    setWorkspaceStatus(proforma.status);
    setWorkspaceNotes(proforma.notes ?? "");
    setDeletedLineIds([]);
    setPreviewLines(linesFromProforma(proforma));
    setPreviewOpen(true);
    setEditingPreview(true);
    setShowAllPreviewLines(true);
    requestAnimationFrame(() => document.getElementById("crear-proforma")?.scrollIntoView({ block: "start" }));
  }

  function resetWorkspace() {
    if (requestedEditProformaId) {
      setDismissedEditProformaId(requestedEditProformaId);
    }
    setEditingProformaId(null);
    setSelectedTemplateId("");
    setDiscount(0);
    setIvaRate(21);
    setWorkspaceStatus("draft");
    setWorkspaceNotes("");
    setDeletedLineIds([]);
    setPreviewLines([]);
    setEditingPreview(false);
    setShowAllPreviewLines(false);
    if (requestedEditProformaId) router.replace(proformaReturnTo, { scroll: false });
  }

  function resetWorkspaceLines() {
    if (editingProforma) {
      setPreviewLines(linesFromProforma(editingProforma));
      setDeletedLineIds([]);
      return;
    }
    setPreviewLines(linesFromTemplate(selectedTemplateId));
  }

  function movePreviewLine(id: string, direction: -1 | 1) {
    setPreviewLines((items) => {
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const tabsData = [
    { id: "resumen", label: "Resumen" },
    { id: "proyectos", label: "Proyectos" },
    { id: "servicios", label: "Servicios" },
    { id: "presupuestos", label: "Proformas" },
    { id: "facturas", label: "Facturas" },
    { id: "actividad", label: "Actividad" },
  ];

const activityLabels: Record<string, string> = {
    created: "creó", updated: "actualizó", update: "actualizó", deleted: "eliminó", delete: "eliminó", payment: "registró pago",
  };

  const projectCards = (items: ClientData["projects"]) => (
    <div className={styles.projectCards} id="proyectos-cliente">
      {items.map((project) => {
        const summary = projectSummary(project);
        return (
          <article key={project.id} id={`project-${project.id}`} className={styles.projectCard}>
            <a href={`/${locale}/account/tools/docs/projects/${project.id}`} className={styles.rowOverlay} aria-label={`Abrir proyecto ${project.name}`} />
            <div className={styles.projectCardHeader}>
              <div>
                <strong>{project.name}</strong>
                <span>Estado: {swapDocsStatusLabel(locale, project.status)}</span>
              </div>
              <span className={styles.statusPill}>{swapDocsStatusLabel(locale, project.status)}</span>
            </div>
            <div className={styles.projectFacts}>
              <span>Proforma: {summary.mainProforma ? `${summary.mainProforma.number} · ${swapDocsStatusLabel(locale, summary.mainProforma.status)}` : "Sin proforma"}</span>
              <span>Seguimiento: {summary.doneTasks}/{summary.totalTasks} tareas · {summary.progress}%</span>
              <span>Horas: {summary.estimatedHours}h estimadas / {summary.actualHours}h reales</span>
              <span>Proformas: {formatCurrency(summary.budgeted)}</span>
              <span>Factura: {summary.mainInvoice ? `${summary.mainInvoice.number} · ${swapDocsStatusLabel(locale, summary.mainInvoice.status)}` : "no generada"}</span>
            </div>
            <div className={styles.projectActions}>
              {!summary.mainProforma && (
                <a href={`/${locale}/account/tools/docs/clients/${client.id}?tab=presupuestos#crear-proforma`}>Crear proforma desde plantilla</a>
              )}
              {summary.acceptedWithoutTracking && summary.acceptedProforma && (
                <form action={generateWorkItemsFromAcceptedProforma.bind(null, locale)}>
                  <input type="hidden" name="returnTo" value={currentClientTabPath} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="proformaId" value={summary.acceptedProforma.id} />
                  <button type="submit">Generar seguimiento</button>
                </form>
              )}
              {summary.completedWithoutInvoice && summary.acceptedProforma && (
                <form action={createInvoiceFromProforma.bind(null, locale)}>
                  <input type="hidden" name="returnTo" value={currentClientTabPath} />
                  <input type="hidden" name="proformaId" value={summary.acceptedProforma.id} />
                  <input type="hidden" name="paymentMethod" value="bank_transfer" />
                  <button type="submit">Crear factura</button>
                </form>
              )}
              <ProjectActions locale={locale} id={project.id} name={project.name} returnTo={currentClientTabPath} />
            </div>
          </article>
        );
      })}
      {items.length === 0 && <p className={styles.emptyText}>Este cliente aún no tiene proyectos.</p>}
    </div>
  );

  return (
    <>
      <Tabs tabs={tabsData} activeTab={tab} onTabChange={onTabChange} />

      {tab === "resumen" && (
        <>
          <section className={styles.kpiRow}>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{activeProjects}</span><span className={styles.kpiLabel}>Proyectos activos</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{pendingProformas}</span><span className={styles.kpiLabel}>Proformas pendientes</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalProformas)}</span><span className={styles.kpiLabel}>Total presupuestado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalInvoiced)}</span><span className={styles.kpiLabel}>Total facturado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalPaid)}</span><span className={styles.kpiLabel}>Cobrado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalInvoiced - totalPaid)}</span><span className={styles.kpiLabel}>Pendiente de cobro</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{totalEstimatedHours}h</span><span className={styles.kpiLabel}>Horas estimadas</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{totalActualHours}h</span><span className={styles.kpiLabel}>Horas reales</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(estimatedProfit)}</span><span className={styles.kpiLabel}>Margen interno estimado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{client.services.length}</span><span className={styles.kpiLabel}>Servicios contratados</span></div>
          </section>

          <section className={styles.nextAction}>
            <div>
              <span className={styles.kicker}>Siguiente acción</span>
              <p>{recommended.text}</p>
            </div>
            <a href={recommendedHref}>{recommended.cta}</a>
          </section>

          <div className={styles.summaryGrid}>
            <section className={styles.panel}>
              <ClientDetailsEditor locale={locale} client={{
                id: client.id, name: client.name, email: client.email,
                phone: client.phone, nifCif: client.nifCif, vatId: client.vatId,
                country: client.country, address: client.address, isCompany: client.isCompany,
              }} />
            </section>
            <section className={styles.panel}>
              <h2>Proyectos activos</h2>
              {projectCards(client.projects.filter((project) => project.status !== "completed").slice(0, 4))}
            </section>
          </div>
        </>
      )}

      {tab === "proyectos" && (
        <section className={styles.panel}>
          <h2>Proyectos</h2>
          <details className={styles.quickCreate} id="nuevo-proyecto">
            <summary>Crear proyecto rápido</summary>
            <form action={createProject.bind(null, locale)} className={styles.compactForm}>
              <input type="hidden" name="returnTo" value={`/${locale}/account/tools/docs/clients/${client.id}?tab=proyectos`} />
              <input type="hidden" name="clientId" value={client.id} />
              <input name="name" required placeholder="Nuevo proyecto" />
              <button type="submit">Crear</button>
            </form>
          </details>
          {projectCards(client.projects)}
        </section>
      )}

      {tab === "servicios" && (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Servicios activos y renovaciones</h2>
              <p>Hosting, dominios, servidores, licencias y mantenimientos contratados por este cliente.</p>
            </div>
          </div>
          <section className={styles.kpiRow}>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{client.services.filter((service) => service.status === "active").length}</span><span className={styles.kpiLabel}>Activos</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(client.services.reduce((sum, service) => sum + service.clientPrice, 0))}</span><span className={styles.kpiLabel}>Precio cliente por ciclo</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(client.services.reduce((sum, service) => sum + service.internalCost, 0))}</span><span className={styles.kpiLabel}>Coste proveedor por ciclo</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(client.services.reduce((sum, service) => sum + service.margin, 0))}</span><span className={styles.kpiLabel}>Margen por ciclo</span></div>
          </section>
          <div className={styles.list}>
            {client.services.map((service) => (
              <article key={service.id} className={`${styles.row} ${service.projectId ? styles.clickableRow : ""}`}>
                {service.projectId && (
                  <a href={`/${locale}/account/tools/docs/projects/${service.projectId}`} className={styles.rowOverlay} aria-label={`Abrir proyecto de ${service.name}`} />
                )}
                <div>
                  <strong className={styles.docTitle}>{service.name}</strong>
                  <p>
                    {service.provider ? swapDocsProfessionalLabel(locale, service.provider) : "Proveedor sin definir"} · {swapDocsStatusLabel(locale, service.status)} · {swapDocsUnitLabel(locale, service.unitType)}
                    {service.recurrenceMonths ? ` · cada ${service.recurrenceMonths} mes${service.recurrenceMonths === 1 ? "" : "es"}` : ""}
                  </p>
                  <p>
                    Inicio: {formatDate(new Date(service.startedAt))} · Renovación: {service.renewalDate ? formatDate(new Date(service.renewalDate)) : "sin fecha"}
                  </p>
                  {service.notes && <p className={styles.templateNote}>{swapDocsSummaryLabel(locale, service.notes)}</p>}
                </div>
                <div className={styles.rowActions}>
                  <strong>{formatCurrency(service.clientPrice)}</strong>
                  <span className={styles.kpiLabel}>Coste: {formatCurrency(service.internalCost)} · Margen: {formatCurrency(service.margin)}</span>
                  {service.projectId && <a href={`/${locale}/account/tools/docs/projects/${service.projectId}`}>Abrir proyecto</a>}
                </div>
              </article>
            ))}
            {client.services.length === 0 && <p className={styles.emptyText}>Aún no hay hosting, dominios o servicios recurrentes asociados a este cliente.</p>}
          </div>
        </section>
      )}

      {tab === "presupuestos" && (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Proformas ({proformas.length})</h2>
              <p>Proformas del cliente, separadas por proyecto y estado.</p>
            </div>
          </div>

          <section className={styles.proformaBuilder} id="crear-proforma">
            <div className={styles.clientContextStrip}>
              <span>Cliente seleccionado</span>
              <strong>{client.name}</strong>
              <small>{client.isCompany ? "Empresa" : "Persona física"} · {client.email ?? "Sin email"} · {client.country}</small>
            </div>
            <div className={styles.proformaBuilderHeader}>
              <div>
                <span className={styles.kicker}>{editingProforma ? "Editando proforma" : "Crear nueva proforma"}</span>
                <h3>{editingProforma ? editingProforma.number : "Desde plantilla"}</h3>
              </div>
              <span className={styles.statusPill}>{editingProforma ? editingProforma.status : "Copia editable"}</span>
            </div>
            <p className={styles.templateNote}>
              {editingProforma
                ? `Estás editando ${editingProforma.number}. Los cambios se guardarán sobre esta proforma.`
                : `Estás creando una proforma para ${client.name}. Elige el proyecto y la plantilla.`}
            </p>
            <form action={editingProforma ? updateProforma.bind(null, locale, editingProforma.id) : createProformaFromServiceTemplate.bind(null, locale)} className={styles.proformaQuickForm}>
              <input type="hidden" name="returnTo" value={proformaReturnTo} />
              {!editingProforma && previewLines.map((line) => (
                <span key={line.id} hidden>
                  <input type="hidden" name="lineCategory" value={line.category} />
                  <input type="hidden" name="lineDescription" value={line.description} />
                  <input type="hidden" name="lineHours" value={line.hours} />
                  <input type="hidden" name="lineRate" value={line.rate} />
                  <input type="hidden" name="lineAmount" value={line.amount} />
                  <input type="hidden" name="lineType" value={line.lineType} />
                  <input type="hidden" name="lineUnitType" value={line.unitType} />
                  <input type="hidden" name="lineInternalCost" value={line.internalCost} />
                  <input type="hidden" name="lineProvider" value={line.provider} />
                  <input type="hidden" name="lineRecurrenceMonths" value={line.recurrenceMonths ?? ""} />
                </span>
              ))}
              {editingProforma && previewLines.map((line) => (
                <span key={line.id} hidden>
                  {line.itemId ? (
                    <>
                      <input type="hidden" name="itemId" value={line.itemId} />
                      <input type="hidden" name={`description_${line.itemId}`} value={line.category ? `[${line.category}] ${line.description}` : line.description} />
                      <input type="hidden" name={`hours_${line.itemId}`} value={line.hours} />
                      <input type="hidden" name={`rate_${line.itemId}`} value={line.rate} />
                      <input type="hidden" name={`amount_${line.itemId}`} value={line.amount} />
                      <input type="hidden" name={`lineType_${line.itemId}`} value={line.lineType} />
                      <input type="hidden" name={`unitType_${line.itemId}`} value={line.unitType} />
                      <input type="hidden" name={`internalCost_${line.itemId}`} value={line.internalCost} />
                      <input type="hidden" name={`provider_${line.itemId}`} value={line.provider} />
                      <input type="hidden" name={`recurrenceMonths_${line.itemId}`} value={line.recurrenceMonths ?? ""} />
                    </>
                  ) : (
                    <>
                      <input type="hidden" name="newDescription" value={line.category ? `[${line.category}] ${line.description}` : line.description} />
                      <input type="hidden" name="newHours" value={line.hours} />
                      <input type="hidden" name="newRate" value={line.rate} />
                      <input type="hidden" name="newAmount" value={line.amount} />
                      <input type="hidden" name="newLineType" value={line.lineType} />
                      <input type="hidden" name="newLineUnitType" value={line.unitType} />
                      <input type="hidden" name="newInternalCost" value={line.internalCost} />
                      <input type="hidden" name="newProvider" value={line.provider} />
                      <input type="hidden" name="newRecurrenceMonths" value={line.recurrenceMonths ?? ""} />
                    </>
                  )}
                </span>
              ))}
              {editingProforma && deletedLineIds.map((itemId) => (
                <input key={itemId} type="hidden" name="deleteItemId" value={itemId} />
              ))}
              <label>
                Proyecto
                <select key={editingProforma?.id ?? "new-proforma-project"} name="projectId" required disabled={client.projects.length === 0 || Boolean(editingProforma)} defaultValue={editingProforma?.projectId ?? ""}>
                  {editingProforma && <option value={editingProforma.projectId}>{editingProforma.project.name} · {swapDocsStatusLabel(locale, editingProforma.project.status)}</option>}
                  <option value="">Seleccionar proyecto</option>
                  {!editingProforma && client.projects.map((project) => {
                    const accepted = project.proformas.some((proforma) => proforma.status === "accepted");
                    const invoices = project.proformas.flatMap((proforma) => proforma.invoices);
                    const invoiceLabel = invoices.length > 0 ? `${invoices.length} factura${invoices.length === 1 ? "" : "s"}` : "sin factura";
                    return (
                      <option key={project.id} value={project.id}>
                        {project.name} · {swapDocsStatusLabel(locale, project.status)} · {project.proformas.length} proforma{project.proformas.length === 1 ? "" : "s"}{accepted ? " · aceptada" : ""} · {invoiceLabel}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                Plantilla
                <select name="serviceTemplateId" required value={selectedTemplateId} onChange={(event) => changeTemplate(event.target.value)} disabled={Boolean(editingProforma)}>
                  <option value="">Seleccionar plantilla</option>
                  {SERVICE_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{swapDocsProfessionalLabel(locale, template.name)}</option>)}
                </select>
              </label>
              <label>
                Estado
                <select name="status" value={workspaceStatus} onChange={(event) => setWorkspaceStatus(event.target.value)}>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="converted">Convertida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </label>
              <label>
                Descuento
                <input name="discount" type="number" step="0.01" min="0" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} placeholder="0,00" />
              </label>
              <label>
                IVA %
                <input name="ivaRate" type="number" step="0.01" min="0" value={ivaRate} onChange={(event) => setIvaRate(Number(event.target.value))} placeholder="21" />
              </label>
              <label>
                Forma de pago
                <select name="paymentMethod" defaultValue="bank_transfer">
                  <option value="bank_transfer">Transferencia bancaria</option>
                  <option value="card">Tarjeta</option>
                  <option value="paypal">PayPal</option>
                  <option value="bizum">Bizum</option>
                  <option value="cash">Efectivo</option>
                  <option value="other">Otro método</option>
                </select>
              </label>
              <PaymentTermsField className={styles.full} locale={locale} />
              {editingProforma && (
                <label className={styles.full}>
                  Notas
                  <textarea name="notes" rows={2} value={workspaceNotes} onChange={(event) => setWorkspaceNotes(event.target.value)} />
                </label>
              )}
              <div className={styles.proformaBuilderActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setPreviewOpen((value) => !value)}>
                  Vista previa
                </button>
                {editingProforma && <button type="button" className={styles.secondaryButton} onClick={resetWorkspace}>Cancelar edición</button>}
                <button type="submit" className={editingProforma ? styles.saveAction : undefined} disabled={client.projects.length === 0}>
                  {editingProforma ? "Guardar cambios" : "Crear proforma"}
                </button>
              </div>
            </form>

            {previewOpen && (
              <div className={styles.previewPanel}>
                <div className={styles.previewHeader}>
                  <div>
                    <span className={styles.kicker}>{editingProforma ? "Proforma" : "Plantilla"}</span>
                    <h4>{editingProforma ? editingProforma.number : selectedTemplate ? swapDocsProfessionalLabel(locale, selectedTemplate.name) : "Selecciona una plantilla"}</h4>
                  </div>
                  <div className={styles.previewActions}>
                    <span>{previewLines.length} líneas</span>
                    <button type="button" onClick={() => setEditingPreview((value) => !value)}>
                      {editingPreview ? "Vista compacta" : "Editar líneas"}
                    </button>
                    <button type="button" onClick={resetWorkspaceLines}>Restablecer</button>
                  </div>
                </div>
                <p className={styles.templateNote}>
                  {editingProforma
                    ? "Este panel es el área de edición de la proforma seleccionada."
                    : "Puedes ajustar estas líneas antes de crear la proforma. La plantilla original no se modificará."}
                </p>
                <div className={styles.previewTable} role="table" aria-label={`Líneas de ${editingProforma ? editingProforma.number : selectedTemplate ? swapDocsProfessionalLabel(locale, selectedTemplate.name) : "plantilla"}`}>
                  <div className={styles.previewTableHead} role="row">
                    <span>Categoría</span>
                    <span>Trabajo</span>
                    <span>Horas</span>
                    <span>Tarifa</span>
                    <span>Importe</span>
                    <span>Tipo</span>
                    {editingPreview && <span>Acciones</span>}
                  </div>
                  {visiblePreviewLines.map((item, index) => (
                    <div key={item.id} className={styles.previewTableRow} role="row">
                      {editingPreview ? (
                        <>
                          <input value={item.category} onChange={(event) => updatePreviewLine(item.id, { category: event.target.value })} aria-label="Categoría" />
                          <input value={item.description} onChange={(event) => updatePreviewLine(item.id, { description: event.target.value })} aria-label="Descripción" />
                          <input type="number" step="0.01" min="0" value={item.hours} onChange={(event) => updatePreviewLine(item.id, { hours: Number(event.target.value) })} aria-label="Horas" />
                          <input type="number" step="0.01" min="0" value={item.rate} onChange={(event) => updatePreviewLine(item.id, { rate: Number(event.target.value) })} aria-label="Tarifa" />
                          <input type="number" step="0.01" min="0" value={item.amount} onChange={(event) => updatePreviewLine(item.id, { amount: Number(event.target.value) })} aria-label="Importe" />
                          <select value={item.lineType} onChange={(event) => updatePreviewLine(item.id, { lineType: event.target.value })} aria-label="Tipo de línea">
                            <option value="own_work">{swapDocsLineTypeLabel(locale, "own_work")}</option>
                            <option value="external_cost">{swapDocsLineTypeLabel(locale, "external_cost")}</option>
                            <option value="recurring_service">{swapDocsLineTypeLabel(locale, "recurring_service")}</option>
                            <option value="margin">{swapDocsLineTypeLabel(locale, "margin")}</option>
                          </select>
                          <div className={styles.previewLineActions}>
                            <button type="button" onClick={() => movePreviewLine(item.id, -1)} disabled={index === 0} aria-label="Subir línea" title="Subir">↑</button>
                            <button type="button" onClick={() => movePreviewLine(item.id, 1)} disabled={index === previewLines.length - 1} aria-label="Bajar línea" title="Bajar">↓</button>
                            <button type="button" onClick={() => removePreviewLine(item)}>Eliminar</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>{swapDocsCategoryLabel(locale, item.category)}</span>
                          <span>{swapDocsProfessionalLabel(locale, item.description)}</span>
                          <span>{item.hours}h</span>
                          <span>{formatCurrency(item.rate)}/h</span>
                          <strong>{formatCurrency(item.amount)}</strong>
                          <span>{swapDocsLineTypeLabel(locale, item.lineType)}</span>
                        </>
                      )}
                    </div>
                  ))}
                  {previewLines.length === 0 && !editingPreview && (
                    <div className={styles.previewTableRow}>
                      <span>Sin plantilla</span>
                      <span>Selecciona una plantilla para cargar líneas.</span>
                      <span>-</span>
                      <span>-</span>
                      <strong>{formatCurrency(0)}</strong>
                      <span>-</span>
                    </div>
                  )}
                  {editingPreview && (
                    <button type="button" className={styles.addLineRow} onClick={addPreviewLine}>
                      + Agregar línea debajo
                      <span>Se añadirá como Extra · Línea personalizada</span>
                    </button>
                  )}
                </div>
                {previewLines.length > visiblePreviewLines.length && (
                  <button type="button" className={styles.secondaryButton} onClick={() => setShowAllPreviewLines(true)}>
                    Ver todas las líneas
                  </button>
                )}
                <dl className={styles.previewTotals}>
                  <div><dt>Subtotal</dt><dd>{formatCurrency(previewTotals.subtotal)}</dd></div>
                  <div><dt>Descuento</dt><dd>{formatCurrency(discount)}</dd></div>
                  <div><dt>IVA {ivaRate}%</dt><dd>{formatCurrency(previewTotals.iva)}</dd></div>
                  <div><dt>Total</dt><dd>{formatCurrency(previewTotals.total)}</dd></div>
                  <div><dt>Coste interno</dt><dd>{formatCurrency(previewLines.reduce((sum, item) => sum + item.internalCost, 0))}</dd></div>
                  <div><dt>Margen estimado</dt><dd>{formatCurrency(previewLines.reduce((sum, item) => sum + item.amount - item.internalCost, 0))}</dd></div>
                </dl>
              </div>
            )}
          </section>

          <section className={styles.sectionSubhead}>
            <div className={styles.sectionHeader}>
              <div>
                <h3>Proformas existentes</h3>
                <p>Abre una proforma para editar líneas, horas, tarifas y estado completo.</p>
              </div>
              <select className={styles.statusFilter} value={proformaStatusFilter} onChange={(event) => setProformaStatusFilter(event.target.value)} aria-label="Filtrar proformas por estado">
                <option value="all">Todos los estados</option>
                <option value="draft">{swapDocsStatusLabel(locale, "draft")}</option>
                <option value="sent">{swapDocsStatusLabel(locale, "sent")}</option>
                <option value="accepted">{swapDocsStatusLabel(locale, "accepted")}</option>
                <option value="rejected">{swapDocsStatusLabel(locale, "rejected")}</option>
                <option value="converted">{swapDocsStatusLabel(locale, "converted")}</option>
                <option value="cancelled">{swapDocsStatusLabel(locale, "cancelled")}</option>
              </select>
            </div>
            <div className={styles.proformaCards}>
              {filteredProformas.map((pf) => {
                const origin = templateOrigin(pf.notes);
                const originLabel = origin ? swapDocsProfessionalLabel(locale, origin) : null;
                const hasTracking = pf.project.workItems.length > 0;
                const hasInvoice = pf.invoices.length > 0;
                const detailHref = `/${locale}/account/tools/docs/proformas/${pf.id}?returnTo=${encodeURIComponent(proformaReturnTo)}`;
                return (
                  <article key={pf.id} className={styles.proformaCard}>
                    <a href={detailHref} className={styles.rowOverlay} aria-label={`Abrir proforma ${pf.number}`} />
                    <div className={styles.proformaCardHeader}>
                      <div>
                        <div className={styles.proformaTitleLine}>
                          <span className={styles.proformaTitleLink}>{pf.number}</span>
                          <span className={`${styles.statusPill} ${styles[`status${pf.status}`] ?? ""}`}>
                            {swapDocsStatusLabel(locale, pf.status)}
                          </span>
                        </div>
                        <p>Proyecto: {pf.project.name} · {swapDocsStatusLabel(locale, pf.project.status)}</p>
                      </div>
                    </div>
                    <div className={styles.proformaMeta}>
                      <span>Fecha: {formatDate(new Date(pf.issueDate))}</span>
                      <span>Plantilla: {originLabel ?? "sin referencia"}</span>
                      <span>Líneas: {pf.items.length}</span>
                      <span>IVA: {formatCurrency(pf.ivaAmount)} ({pf.ivaRate}%)</span>
                      <span>Email: {pf.emailLogs[0] ? `${pf.emailLogs[0].status} · ${pf.emailLogs[0].to}` : "sin enviar"}</span>
                    </div>
                    <dl className={styles.proformaTotals}>
                      <div><dt>Subtotal</dt><dd>{formatCurrency(pf.subtotal)}</dd></div>
                      <div><dt>Descuento</dt><dd>{formatCurrency(pf.discount)}</dd></div>
                      <div><dt>Total</dt><dd>{formatCurrency(pf.total)}</dd></div>
                    </dl>
                    {originLabel && <p className={styles.templateNote}>Creada desde {originLabel}. Los cambios solo afectan a esta proforma.</p>}
                    <div className={styles.proformaCardActions}>
                      {pf.status === "accepted" && !hasTracking && (
                        <form action={generateWorkItemsFromAcceptedProforma.bind(null, locale)}>
                          <input type="hidden" name="returnTo" value={proformaReturnTo} />
                          <input type="hidden" name="projectId" value={pf.projectId} />
                          <input type="hidden" name="proformaId" value={pf.id} />
                          <button type="submit" className={styles.primaryAction}>Generar seguimiento</button>
                        </form>
                      )}
                      {pf.status === "accepted" && hasTracking && !hasInvoice && (
                        <form action={createInvoiceFromProforma.bind(null, locale)}>
                          <input type="hidden" name="returnTo" value={proformaReturnTo} />
                          <input type="hidden" name="proformaId" value={pf.id} />
                          <input type="hidden" name="paymentMethod" value="bank_transfer" />
                          <button type="submit" className={styles.primaryAction}>Crear factura</button>
                        </form>
                      )}
                      <form action={updateProformaStatus.bind(null, locale)} className={styles.statusQuickForm}>
                        <input type="hidden" name="returnTo" value={proformaReturnTo} />
                        <input type="hidden" name="id" value={pf.id} />
                        <select name="status" defaultValue={pf.status} aria-label={`Cambiar estado de ${pf.number}`} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
                          <option value="draft">Borrador</option>
                          <option value="sent">Enviada</option>
                          <option value="accepted">Aceptada</option>
                          <option value="rejected">Rechazada</option>
                          <option value="converted">Convertida</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </form>
                      <button
                        type="button"
                        className={editingProformaId === pf.id || pf.status === "draft" || pf.status === "sent" ? styles.primaryAction : undefined}
                        onClick={() => editingProformaId === pf.id ? resetWorkspace() : startEditingProforma(pf)}
                      >
                        {editingProformaId === pf.id ? "Editando arriba" : "Editar"}
                      </button>
                      {(pf.status === "accepted" || pf.status === "converted") && hasTracking && (
                        <a href={`/${locale}/account/tools/docs/projects/${pf.projectId}?tab=tareas`}>Ver seguimiento</a>
                      )}
                      {(pf.status === "draft" || pf.status === "rejected" || pf.status === "cancelled") && (
                        <ProformaActions locale={locale} id={pf.id} number={pf.number} deleteOnly returnTo={proformaReturnTo} />
                      )}
                    </div>
                  </article>
                );
              })}
              {filteredProformas.length === 0 && <p className={styles.emptyText}>No hay proformas para este filtro.</p>}
            </div>
          </section>
        </section>
      )}

      {tab === "facturas" && (
        <section className={styles.panel}>
          <h2>Facturas ({invoices.length})</h2>
          <section className={styles.kpiRow}>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalInvoiced)}</span><span className={styles.kpiLabel}>Total facturado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalPaid)}</span><span className={styles.kpiLabel}>Cobrado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(totalInvoiced - totalPaid)}</span><span className={styles.kpiLabel}>Pendiente</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{openInvoices}</span><span className={styles.kpiLabel}>Facturas abiertas</span></div>
          </section>
          <div className={styles.list}>
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
              const pending = Math.max(0, inv.total - paid);
              const detailHref = `/${locale}/account/tools/docs/invoices/${inv.id}?returnTo=${encodeURIComponent(invoiceReturnTo)}`;
              return (
                <article key={inv.id} className={`${styles.row} ${styles.clickableRow}`}>
                  <a href={detailHref} className={styles.rowOverlay} aria-label={`Abrir factura ${inv.number}`} />
                  <div>
                    <strong className={styles.docTitle}>{inv.number}</strong>
                    <p>{inv.proforma.project.name} · {inv.status} · Email: {inv.emailLogs?.[0] ? `${inv.emailLogs[0].status} · ${inv.emailLogs[0].to}` : "sin enviar"}</p>
                  </div>
                  <div className={styles.rowActions}>
                    <strong>{formatCurrency(inv.total)}</strong>
                    <span className={styles.kpiLabel}>Cobrado: {formatCurrency(paid)} · Pendiente: {formatCurrency(pending)}</span>
                    <div className={styles.proformaCardActions}>
                      <a href={detailHref}>Ver detalle</a>
                      <a href={`/api/tools/docs/invoices/${inv.id}/download`}>Descargar PDF</a>
                      <details className={styles.cardEmailAction}>
                        <summary>Enviar por email</summary>
                        <form action={sendInvoiceByEmail.bind(null, locale, inv.id)}>
                          <input type="hidden" name="returnTo" value={invoiceReturnTo} />
                          <input name="to" type="email" defaultValue={client.email ?? ""} placeholder="cliente@email.com" required />
                          <input name="subject" defaultValue={`Factura ${inv.number}`} />
                          <textarea name="message" rows={2} placeholder="Mensaje opcional" />
                          <button type="submit">Enviar</button>
                        </form>
                      </details>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === "actividad" && (
        <section className={styles.panel}>
          <h2>Actividad</h2>
          <div className={styles.timeline}>
            {activity.map((log) => (
              <div key={log.id} className={styles.timelineItem}>
                <span className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <span className={styles.activityAction}>{activityLabels[log.action] ?? log.action}</span>
                  <span className={styles.activityTarget}>{log.targetType}</span>
                  <span className={styles.activityName}>{log.targetName}</span>
                  <span className={styles.activityTime}>{formatDate(new Date(log.createdAt))}</span>
                </div>
              </div>
            ))}
            {activity.length === 0 && <p className={styles.emptyText}>Sin actividad registrada</p>}
          </div>
        </section>
      )}
    </>
  );
}
