"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { Tabs } from "@/components/ui/Tabs";
import {
  applyServiceTemplateToProject,
  createInvoiceFromProforma,
  createProformaFromServiceTemplate,
  createWorkItem,
  generateWorkItemsFromAcceptedProforma,
  updateWorkItem,
  deleteWorkItem,
  deleteProject,
  swapWorkItemOrder,
} from "@/modules/tools/SwapDocsPage/actions";
import { ProformaActions } from "@/modules/tools/SwapDocsPage/ProformaActions";
import { ProjectDetailsEditor } from "./ProjectDetailsEditor";
import { SERVICE_TEMPLATES } from "@/modules/tools/SwapDocsPage/templates";
import { PaymentTermsField } from "@/modules/tools/PaymentTermsField";
import {
  formatSwapDocsCurrency,
  formatSwapDocsDate,
  publicDocumentDescription,
  swapDocsLineTypeLabel,
  swapDocsProfessionalLabel,
  swapDocsStatusLabel,
  swapDocsUnitLabel,
} from "@/modules/tools/swapdocs-i18n";
import styles from "./styles.module.css";

type ProjectData = {
  id: string;
  code: string | null;
  name: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "completed";
  createdAt: Date;
  client: { id: string; code: string | null; name: string; email: string | null; nifCif: string | null; address: string | null };
  estimations: Array<{ id: string; category: string; task: string; optimistic: number; probable: number; pessimistic: number; tpe: number }>;
  costItems: Array<{
    id: string; stage: string; task: string; hours: number; unitCost: number; total: number; notes: string | null;
    lineType: string; unitType: string; internalUnitCost: number; clientUnitPrice: number; margin: number; provider: string | null; isRecurring: boolean; recurrenceMonths: number | null;
  }>;
  workItems: Array<{ id: string; category: string; task: string; estimatedHours: number; actualHours: number; lineType: string; hourlyRate: number; billable: boolean; status: string; sortOrder: number; notes: string | null; startedAt: Date | null; completedAt: Date | null }>;
  proformas: Array<{
    id: string;
    projectId?: string;
    number: string;
    status: string;
    total: number;
    subtotal: number;
    items: Array<{ description: string; lineType: string; internalCost: number; clientPrice: number; amount: number; isRecurring: boolean; recurrenceMonths: number | null }>;
    invoices: Array<{ id: string; number: string; status: string }>;
  }>;
  clientServices: Array<{ id: string; code: string | null; name: string; provider: string | null; status: string; unitType: string; internalCost: number; clientPrice: number; margin: number; renewalDate: Date | null; recurrenceMonths: number | null }>;
};

type ServiceTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  lines: Array<{ id: string; description: string; hours: number | null; sortOrder: number }>;
};

const statusStyles: Record<string, string> = {
  draft: styles.statusdraft,
  sent: styles.statussent,
  accepted: styles.statusaccepted,
  rejected: styles.statusrejected,
  completed: styles.statuscompleted,
  pending: styles.statusdraft,
  in_progress: styles.statussent,
  done: styles.statusaccepted,
};

function pct(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function displayWorkCategory(category: string) {
  return category.trim().toLowerCase() === "proforma" ? "General" : category;
}

function displayWorkTask(task: string) {
  return task.replace(/^\[plantilla\]\s*/i, "").trim() || task;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ProjectTabsView({
  locale,
  activeTab,
  project,
  serviceTemplates,
}: {
  locale: Locale;
  activeTab: string;
  project: ProjectData;
  serviceTemplates: ServiceTemplate[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const formatCurrency = (value: number) => formatSwapDocsCurrency(locale, value);
  const formatDate = (value: Date) => formatSwapDocsDate(locale, value);

  function onTabChange(id: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", id);
    router.push(`/${locale}/account/tools/docs/projects/${project.id}?${params}`);
  }

  const estimatedPert = project.estimations.reduce((s, e) => s + e.tpe, 0);
  const estimatedWorkHours = project.workItems.reduce((s, w) => s + w.estimatedHours, 0);
  const actualHours = project.workItems.reduce((s, w) => s + w.actualHours, 0);
  const doneTasks = project.workItems.filter((w) => w.status === "done").length;
  const inProgressTasks = project.workItems.filter((w) => w.status === "in_progress").length;
  const taskProgress = pct(doneTasks, project.workItems.length);
  const hourProgress = estimatedWorkHours > 0 ? Math.min(100, Math.round((actualHours / estimatedWorkHours) * 100)) : 0;
  const costTotal = project.costItems.reduce((s, c) => s + c.total, 0);
  const acceptedFinancialItems = project.proformas
    .filter((pf) => pf.status === "accepted" || pf.status === "converted")
    .flatMap((pf) => pf.items);
  const externalCostTotal = acceptedFinancialItems.filter((item) => item.lineType === "external_cost" || item.lineType === "recurring_service" || item.isRecurring).reduce((s, item) => s + item.internalCost, 0);
  const ownWorkCostTotal = acceptedFinancialItems.filter((item) => item.lineType === "own_work").reduce((s, item) => s + item.internalCost, 0);
  const internalCostTotal = acceptedFinancialItems.reduce((s, item) => s + item.internalCost, 0);
  const recurringItems = acceptedFinancialItems.filter((item) => item.isRecurring || item.lineType === "recurring_service");
  const proformaTotal = project.proformas.reduce((s, pf) => s + pf.total, 0);
  const acceptedProformaTotal = project.proformas.filter((pf) => pf.status === "accepted" || pf.status === "converted").reduce((s, pf) => s + pf.subtotal, 0);
  const estimatedMargin = acceptedProformaTotal - internalCostTotal;
  const acceptedProformas = project.proformas.filter((pf) => pf.status === "accepted").length;
  const acceptedProforma = project.proformas.find((pf) => pf.status === "accepted");
  const latestProforma = project.proformas[0];

  const taskGroups = Object.entries(
    project.workItems.reduce<Record<string, ProjectData["workItems"]>>((acc, item) => {
      const category = displayWorkCategory(item.category);
      acc[category] ??= [];
      acc[category].push(item);
      return acc;
    }, {}),
  );

  return (
    <>
      <Tabs
        tabs={[
          { id: "resumen", label: "Resumen" },
          { id: "presupuestos", label: "Proformas" },
          { id: "tareas", label: "Tareas" },
          { id: "servicios", label: "Servicios activos" },
          { id: "finanzas", label: "Finanzas internas" },
        ]}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {activeTab === "resumen" && (
        <>
          <section className={styles.kpiRow}>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{taskProgress}%</span><span className={styles.kpiLabel}>Avance del checklist</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{doneTasks}/{project.workItems.length}</span><span className={styles.kpiLabel}>Tareas completadas</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{actualHours.toFixed(1)}h / {estimatedWorkHours.toFixed(1)}h</span><span className={styles.kpiLabel}>Horas reales vs plan</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(proformaTotal)}</span><span className={styles.kpiLabel}>Presupuestado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(costTotal)}</span><span className={styles.kpiLabel}>Coste base</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{recurringItems.length}</span><span className={styles.kpiLabel}>Servicios recurrentes</span></div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Progreso operativo</h2>
                <p>El avance sale directamente del checklist de tareas del proyecto.</p>
              </div>
              <a href={`/${locale}/account/tools/docs/projects/${project.id}?tab=tareas`} className={styles.secondaryBtn}>Abrir tareas</a>
            </div>
            <div className={styles.progressBars}>
              <div className={styles.progressRow}>
                <span>Tareas: {doneTasks}/{project.workItems.length} completadas</span>
                <ProgressBar value={taskProgress} />
              </div>
              <div className={styles.progressRow}>
                <span>Horas: {actualHours.toFixed(1)}h / {estimatedWorkHours.toFixed(1)}h</span>
                <ProgressBar value={hourProgress} />
              </div>
              <div className={styles.progressRow}>
                <span>PERT: {estimatedPert.toFixed(1)}h estimadas</span>
                <ProgressBar value={estimatedPert > 0 ? Math.min(100, Math.round((estimatedWorkHours / estimatedPert) * 100)) : 0} />
              </div>
            </div>
          </section>

          <div className={styles.splitRow}>
            <section className={styles.panel}>
              <h2>Datos del proyecto</h2>
              <ProjectDetailsEditor locale={locale} project={project} />
            </section>
            <section className={styles.panel}>
              <h2>Cliente y documentos</h2>
              <div className={styles.clientBox}>
                <a href={`/${locale}/account/tools/docs/clients/${project.client.id}`} className={styles.docTitle}>{project.client.name}</a>
                <span>{project.client.code ?? "Sin código"} · {project.client.email || "Sin email"}</span>
                <span>{project.client.nifCif || "Sin NIF/CIF"}</span>
                <span>{project.proformas.length} proformas · {acceptedProformas} aceptadas</span>
                <span>{latestProforma ? `Última: ${latestProforma.number} · ${swapDocsStatusLabel(locale, latestProforma.status)}` : "Sin proformas"}</span>
              </div>
            </section>
          </div>

          <details className={styles.dangerZone}>
            <summary>Eliminar proyecto</summary>
            <form action={deleteProject.bind(null, locale, project.id)}>
              <p>Vas a eliminar <strong>{project.name}</strong>. Esta acción no se puede deshacer.</p>
              <button type="submit">Eliminar proyecto</button>
            </form>
          </details>
        </>
      )}

      {activeTab === "presupuestos" && (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Proformas ({project.proformas.length})</h2>
              <p>Total presupuestado: {formatCurrency(proformaTotal)}</p>
            </div>
            <span className={`${styles.statusBadge} ${statusStyles[latestProforma?.status ?? "draft"] ?? ""}`}>
              {latestProforma ? `Última ${swapDocsStatusLabel(locale, latestProforma.status)}` : "Sin proforma"}
            </span>
          </div>

          <details className={styles.quickCreate} open={project.proformas.length === 0}>
            <summary>Crear proforma desde plantilla</summary>
            <form action={createProformaFromServiceTemplate.bind(null, locale)} className={styles.quickProformaForm}>
              <input type="hidden" name="projectId" value={project.id} />
              <select name="serviceTemplateId" required>
                {SERVICE_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{swapDocsProfessionalLabel(locale, t.name)}</option>)}
              </select>
              <input name="discount" type="number" step="0.01" min="0" placeholder="Descuento" />
              <input name="ivaRate" type="number" step="0.01" min="0" defaultValue="21" placeholder="IVA %" />
              <select name="paymentMethod" defaultValue="bank_transfer">
                <option value="bank_transfer">Transferencia bancaria</option>
                <option value="card">Tarjeta</option>
                <option value="paypal">PayPal</option>
                <option value="bizum">Bizum</option>
                <option value="cash">Efectivo</option>
                <option value="other">Otro método</option>
              </select>
              <PaymentTermsField className={styles.full} locale={locale} />
              <button type="submit">Crear proforma</button>
            </form>
          </details>

          <div className={styles.documentList}>
            {project.proformas.map((pf) => {
              const returnTo = `/${locale}/account/tools/docs/projects/${project.id}?tab=presupuestos`;
              const detailHref = `/${locale}/account/tools/docs/proformas/${pf.id}?returnTo=${encodeURIComponent(returnTo)}`;
              const hasTracking = project.workItems.length > 0;
              const hasInvoice = pf.invoices.length > 0;
              return (
              <article key={pf.id} className={styles.documentRow}>
                <a href={detailHref} className={styles.rowOverlay} aria-label={`Abrir proforma ${pf.number}`} />
                <div>
                  <a href={detailHref} className={styles.docTitle}>{pf.number}</a>
                  <p>{swapDocsStatusLabel(locale, pf.status)} · {pf.items.length} líneas{hasInvoice ? ` · Factura ${pf.invoices[0]?.number}` : ""}</p>
                </div>
                <div className={styles.rowActions}>
                  <strong>{formatCurrency(pf.total)}</strong>
                  {pf.status === "accepted" && !hasTracking && (
                    <form action={generateWorkItemsFromAcceptedProforma.bind(null, locale)}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="proformaId" value={pf.id} />
                      <button type="submit">Generar seguimiento</button>
                    </form>
                  )}
                  {(pf.status === "accepted" || pf.status === "converted") && hasTracking && (
                    <a href={`/${locale}/account/tools/docs/projects/${project.id}?tab=tareas`}>Ver seguimiento</a>
                  )}
                  {pf.status === "accepted" && !hasInvoice && (
                    <form action={createInvoiceFromProforma.bind(null, locale)}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="proformaId" value={pf.id} />
                      <input type="hidden" name="paymentMethod" value="bank_transfer" />
                      <button type="submit">Crear factura</button>
                    </form>
                  )}
                  <ProformaActions
                    locale={locale}
                    id={pf.id}
                    number={pf.number}
                    returnTo={`/${locale}/account/tools/docs/projects/${project.id}?tab=presupuestos`}
                    editHref={`/${locale}/account/tools/docs/clients/${project.client.id}?tab=presupuestos&editProforma=${pf.id}#crear-proforma`}
                  />
                </div>
              </article>
              );
            })}
            {project.proformas.length === 0 && <p className={styles.emptyText}>Este proyecto todavía no tiene proformas.</p>}
          </div>
        </section>
      )}

      {activeTab === "tareas" && (
        <section className={styles.panel}>
          <div className={styles.taskBoardHeader}>
            <div>
              <h2>Checklist de trabajo</h2>
              <p>{doneTasks}/{project.workItems.length} tareas completadas · {inProgressTasks} en curso · {actualHours.toFixed(1)}h reales</p>
            </div>
            <div className={styles.taskProgressSummary}>
              <strong>{taskProgress}%</strong>
              <ProgressBar value={taskProgress} />
            </div>
          </div>

          {acceptedProforma && (
            <form action={generateWorkItemsFromAcceptedProforma.bind(null, locale)} className={styles.syncTrackingForm}>
              <input type="hidden" name="returnTo" value={`/${locale}/account/tools/docs/projects/${project.id}?tab=tareas`} />
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="proformaId" value={acceptedProforma.id} />
              <div>
                <strong>Proforma aceptada: {acceptedProforma.number}</strong>
                <span>Añade pasos faltantes sin tocar notas, estados ni horas ya registradas.</span>
              </div>
              <button type="submit">Sincronizar desde proforma aceptada</button>
            </form>
          )}

          <form action={applyServiceTemplateToProject.bind(null, locale)} className={styles.templateApplyForm}>
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Aplicar plantilla
              <select name="templateId" required defaultValue="">
                <option value="" disabled>Seleccionar servicio o plantilla</option>
                {serviceTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.lines.length} pasos
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={serviceTemplates.length === 0}>Añadir pasos</button>
          </form>

          {taskGroups.length > 0 ? (
            <div className={styles.checklistGroups}>
              {taskGroups.map(([category, items]) => {
                const groupDone = items.filter((item) => item.status === "done").length;
                const groupProgress = pct(groupDone, items.length);

                return (
                  <section key={category} className={styles.checklistGroup}>
                    <div className={styles.groupHeader}>
                      <div>
                        <h3>{category}</h3>
                        <p>{groupDone}/{items.length} pasos · {groupProgress}%</p>
                      </div>
                      <ProgressBar value={groupProgress} />
                    </div>

                    <div className={styles.checklistItems}>
                      {items.map((item, index) => {
                        const isFirst = index === 0;
                        const isLast = index === items.length - 1;
                        const displayCategory = displayWorkCategory(item.category);
                        const displayTask = displayWorkTask(item.task);

                        return (
                          <article
                            key={item.id}
                            className={`${styles.checklistItem} ${item.status === "done" ? styles.checklistItemDone : ""} ${item.status === "in_progress" ? styles.checklistItemProgress : ""}`}
                          >
                            <form id={`task-edit-${item.id}`} action={updateWorkItem.bind(null, locale)} className={styles.taskContentForm}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="status" value={item.status} />
                              <input type="hidden" name="category" value={displayCategory} />
                              <input type="hidden" name="task" value={displayTask} />
                              <input type="hidden" name="estimatedHours" value={item.estimatedHours} />
                              <div className={styles.taskTextFields}>
                                <span className={styles.taskCategoryBadge}>{displayCategory}</span>
                                <strong className={styles.taskName}>{displayTask}</strong>
                                <input name="notes" defaultValue={item.notes ?? ""} placeholder="Añadir nota de trabajo" aria-label={`Notas de trabajo de ${displayTask}`} />
                              </div>
                              <div className={styles.taskHoursFields}>
                                <input name="actualHours" type="number" step="0.25" min="0" defaultValue={item.actualHours} aria-label={`Horas reales de ${displayTask}`} />
                                <span>/ {item.estimatedHours}h</span>
                              </div>
                            </form>
                            <form action={updateWorkItem.bind(null, locale)} className={styles.taskStatusForm}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="category" value={displayCategory} />
                              <input type="hidden" name="task" value={displayTask} />
                              <input type="hidden" name="estimatedHours" value={item.estimatedHours} />
                              <input type="hidden" name="actualHours" value={item.actualHours} />
                              <input type="hidden" name="notes" value={item.notes ?? ""} />
                              <select name="status" defaultValue={item.status} aria-label={`Estado de ${displayTask}`} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En curso</option>
                                <option value="done">Hecha</option>
                              </select>
                            </form>
                            <div className={styles.taskOrderActions} aria-label={`Orden de ${displayTask}`}>
                              <form action={swapWorkItemOrder.bind(null, locale)}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="direction" value="up" />
                                <button type="submit" aria-label={`Subir ${displayTask}`} disabled={isFirst}>↑</button>
                              </form>
                              <form action={swapWorkItemOrder.bind(null, locale)}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="direction" value="down" />
                                <button type="submit" aria-label={`Bajar ${displayTask}`} disabled={isLast}>↓</button>
                              </form>
                            </div>
                            <div className={styles.taskInlineActions}>
                              <button type="submit" form={`task-edit-${item.id}`}>Guardar</button>
                              <details>
                                <summary className={styles.dangerButton}>Eliminar</summary>
                                <form action={deleteWorkItem.bind(null, locale)}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <p>Vas a eliminar esta tarea del seguimiento.</p>
                                  <button type="submit" className={styles.dangerButton}>Confirmar eliminación</button>
                                </form>
                              </details>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyText}>Aplica una plantilla o añade tu primera tarea para empezar el seguimiento.</p>
          )}

          <details className={styles.quickCreate}>
            <summary>Añadir tarea manual</summary>
            <form action={createWorkItem.bind(null, locale)} className={styles.formGrid}>
              <input type="hidden" name="projectId" value={project.id} />
              <label>Categoría<input name="category" required placeholder="Frontend, deploy..." /></label>
              <label>Tarea<input name="task" required placeholder="Paso concreto" /></label>
              <input type="hidden" name="sortOrder" value={project.workItems.length} />
              <label>Horas est.<input name="estimatedHours" type="number" step="0.25" min="0" /></label>
              <label>Horas reales<input name="actualHours" type="number" step="0.25" min="0" /></label>
              <label>Estado<select name="status" defaultValue="pending">
                <option value="pending">Pendiente</option>
                <option value="in_progress">En curso</option>
                <option value="done">Hecha</option>
              </select></label>
              <label className={styles.full}>Notas<input name="notes" placeholder="Opcional" /></label>
              <div className={styles.formActions}><button type="submit">Añadir</button></div>
            </form>
          </details>
        </section>
      )}

      {activeTab === "servicios" && (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Servicios activos</h2>
              <p>Hosting, dominios, servidores y otros servicios recurrentes creados desde proformas aceptadas.</p>
            </div>
          </div>
          <div className={styles.costTable}>
            {project.clientServices.map((service) => (
              <div key={service.id} className={styles.costRow}>
                <div>
                  <strong>{service.code ? `${service.code} · ` : ""}{service.name}</strong>
                  <p className={styles.costMeta}>
                    {service.provider ? swapDocsProfessionalLabel(locale, service.provider) : "Proveedor sin definir"} · {swapDocsStatusLabel(locale, service.status)} · {swapDocsUnitLabel(locale, service.unitType)}
                    {service.recurrenceMonths ? ` · cada ${service.recurrenceMonths} mes${service.recurrenceMonths === 1 ? "" : "es"}` : ""}
                    {service.renewalDate ? ` · renueva ${formatDate(new Date(service.renewalDate))}` : ""}
                  </p>
                </div>
                <span className={styles.costTotal}>{formatCurrency(service.clientPrice)}</span>
              </div>
            ))}
            {project.clientServices.length === 0 && <p className={styles.emptyText}>Todavía no hay servicios activos en este proyecto.</p>}
          </div>
        </section>
      )}

      {activeTab === "finanzas" && (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Finanzas internas</h2>
              <p>Vista privada: precios vendidos, costes internos, servicios externos y margen estimado.</p>
            </div>
          </div>
          <section className={styles.kpiRow}>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(acceptedProformaTotal)}</span><span className={styles.kpiLabel}>Precio cliente aceptado</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(ownWorkCostTotal)}</span><span className={styles.kpiLabel}>Trabajo propio</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(externalCostTotal)}</span><span className={styles.kpiLabel}>Servicios externos</span></div>
            <div className={styles.kpiCard}><span className={styles.kpiValue}>{formatCurrency(estimatedMargin)}</span><span className={styles.kpiLabel}>Margen estimado</span></div>
          </section>
          <div className={styles.costTable}>
            {acceptedFinancialItems.map((item, index) => (
              <div key={`${item.description}-${index}`} className={styles.costRow}>
                <div>
                  <strong>{publicDocumentDescription(locale, item.description)}</strong>
                  <p className={styles.costMeta}>
                    {swapDocsLineTypeLabel(locale, item.lineType)}
                    {" · "}coste interno {formatCurrency(item.internalCost)} · precio cliente {formatCurrency(item.clientPrice || item.amount)}
                  </p>
                  {item.isRecurring && <p className={styles.taskNotes}>Renovación cada {item.recurrenceMonths ?? 1} mes(es)</p>}
                </div>
                <span className={styles.costTotal}>{formatCurrency((item.clientPrice || item.amount) - item.internalCost)}</span>
              </div>
            ))}
            {acceptedFinancialItems.length > 0 && (
              <div className={styles.costTotalRow}>
                <strong>Margen estimado</strong>
                <span>{formatCurrency(estimatedMargin)}</span>
              </div>
            )}
            {acceptedFinancialItems.length === 0 && <p className={styles.emptyText}>Todavía no hay proformas aceptadas para calcular finanzas internas.</p>}
          </div>
        </section>
      )}
    </>
  );
}
