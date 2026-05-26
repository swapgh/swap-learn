import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import {
  applyCostTemplate,
  applyEstimationTemplate,
  createCostItem,
  createEstimationItem,
  generateProformaFromProjectCosts,
} from "@/modules/tools/SwapDocsPage/actions";
import {
  COST_TEMPLATES,
  ESTIMATION_TEMPLATES,
} from "@/modules/tools/SwapDocsPage/templates";
import styles from "./styles.module.css";

type BudgetStep = "estimations" | "costs" | "proforma";

function formatCurrency(value: number) {
  return value.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export async function SwapDocsProjectBudgetPage({
  locale,
  id,
  step,
  success,
  error,
}: {
  locale: Locale;
  id: string;
  step: BudgetStep;
  success?: string;
  error?: string;
}) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      estimations: { orderBy: [{ category: "asc" }, { task: "asc" }] },
      costItems: { orderBy: [{ stage: "asc" }, { task: "asc" }] },
    },
  });

  if (!project) {
    notFound();
  }

  const base = `/${locale}/account/tools/docs/projects/${project.id}`;
  const estimatedHours = project.estimations.reduce((sum, item) => sum + item.tpe, 0);
  const subtotal = project.costItems.reduce((sum, item) => sum + item.total, 0);
  const ownCostItems = project.costItems.filter((item) => item.lineType === "own_work");
  const externalCostItems = project.costItems.filter((item) => item.lineType === "external_cost" || item.lineType === "recurring_service" || item.isRecurring);
  const marginCostItems = project.costItems.filter((item) => item.lineType === "margin");
  const ownCostTotal = ownCostItems.reduce((sum, item) => sum + item.total, 0);
  const externalCostTotal = externalCostItems.reduce((sum, item) => sum + item.total, 0);
  const marginTotal = marginCostItems.reduce((sum, item) => sum + item.total, 0);

  const toastMessage = success ?? error ?? null;

  return (
        <><Toast message={toastMessage} />

        <nav className={styles.breadcrumb}>
          <a href={`/${locale}/account/tools/docs`}>SwapDocs</a>
          <span aria-hidden>/</span>
          <a href={base}>{project.name}</a>
          <span aria-hidden>/</span>
          <span>{step === "estimations" ? "Plan de trabajo" : step === "costs" ? "Costes y precios" : "Proforma"}</span>
        </nav>

        <div className={styles.toolbar}>
          <a href={base}>Volver al proyecto</a>
          <a href={`/${locale}/account/tools/docs`}>SwapDocs</a>
        </div>

        <header className={styles.header}>
          <p className={styles.kicker}>Preparar proforma</p>
          <h1>{project.name}</h1>
          <p>
            {project.client.name} · Proyecto -&gt; Trabajo propio -&gt; Costes externos/precios -&gt; Proforma
          </p>
        </header>

        <nav className={styles.stepper} aria-label="Flujo de proforma">
          <a href={base} className={styles.done}>1. Proyecto</a>
          <a href={`${base}/estimations`} className={step === "estimations" ? styles.active : styles.done}>2. Trabajo propio</a>
          <a href={`${base}/costs`} className={step === "costs" ? styles.active : step === "proforma" ? styles.done : undefined}>3. Costes y precios</a>
          <a href={`${base}/proforma`} className={step === "proforma" ? styles.active : undefined}>4. Proforma</a>
        </nav>

        <section className={styles.summaryCards} aria-label="Resumen de preparación">
          <div><span>Tareas propias</span><strong>{project.estimations.length}</strong><small>{estimatedHours.toFixed(2)}h estimadas</small></div>
          <div><span>Trabajo valorado</span><strong>{formatCurrency(ownCostTotal)}</strong><small>{ownCostItems.length} líneas</small></div>
          <div><span>Costes externos</span><strong>{formatCurrency(externalCostTotal)}</strong><small>{externalCostItems.length} líneas</small></div>
          <div><span>Gestión / margen</span><strong>{formatCurrency(marginTotal)}</strong><small>{marginCostItems.length} líneas</small></div>
        </section>

        {step === "estimations" && (
          <Panel title="Plan de trabajo propio">
            <p className={styles.muted}>
              Aquí van solo las tareas que haces tú: análisis, backend, frontend, testing, despliegue y entrega. Los hosting, dominios, licencias o servidores van en la pantalla de costes y precios.
            </p>
            <Table
              headers={["Categoría", "Tarea", "O", "M", "P", "TPE"]}
              rows={project.estimations.map((item) => [
                item.category,
                item.task,
                `${item.optimistic}h`,
                `${item.probable}h`,
                `${item.pessimistic}h`,
                `${item.tpe.toFixed(2)}h`,
              ])}
              empty="Sin tareas estimadas."
            />
            <p className={styles.muted}>Total PERT: {estimatedHours.toFixed(2)}h</p>
            <form action={applyEstimationTemplate.bind(null, locale)} className={styles.templateForm}>
              <input type="hidden" name="projectId" value={project.id} />
              <select name="estimationTemplateId">
                {ESTIMATION_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <button type="submit">Añadir plantilla</button>
            </form>
            <form action={createEstimationItem.bind(null, locale)} className={styles.formGrid}>
              <input type="hidden" name="projectId" value={project.id} />
              <label>
                Categoría
                <input name="category" required placeholder="Backend, frontend..." />
              </label>
              <label className={styles.full}>
                Tarea
                <input name="task" required placeholder="Descripción de la tarea" />
              </label>
              <label>
                Optimista h
                <input name="optimistic" required type="number" step="0.1" min="0" />
              </label>
              <label>
                Probable h
                <input name="probable" required type="number" step="0.1" min="0" />
              </label>
              <label>
                Pesimista h
                <input name="pessimistic" required type="number" step="0.1" min="0" />
              </label>
              <div className={styles.formActions}>
                <button type="submit">Añadir tarea propia</button>
              </div>
            </form>
            <div className={styles.toolbar}>
              <a className={styles.primaryLink} href={`${base}/costs`}>Continuar con costes y precios</a>
            </div>
          </Panel>
        )}

        {step === "costs" && (
          <Panel title="Costes y precios del proyecto">
            <p className={styles.muted}>
              Separa lo que haces tú, lo que alquilas o compras a terceros, y el margen/gestión. Estas líneas serán la base de la proforma.
            </p>
            <h3 className={styles.tableTitle}>Trabajo propio facturable</h3>
            <Table
              headers={["Etapa", "Tarea", "Tipo", "Horas", "Coste", "Precio cliente", "Total coste"]}
              rows={ownCostItems.map((item) => [
                item.stage,
                item.task,
                "Trabajo",
                `${item.hours}h`,
                formatCurrency(item.internalUnitCost || item.unitCost),
                formatCurrency(item.clientUnitPrice || item.unitCost),
                formatCurrency(item.total),
              ])}
              empty="Sin trabajo propio valorado."
            />
            <h3 className={styles.tableTitle}>Servicios externos y recurrentes</h3>
            <Table
              headers={["Etapa", "Servicio", "Tipo", "Horas/unid.", "Coste proveedor", "Precio cliente", "Total coste"]}
              rows={externalCostItems.map((item) => [
                item.stage,
                item.task,
                item.lineType === "recurring_service" || item.isRecurring ? "Recurrente" : "Externo",
                `${item.hours}`,
                formatCurrency(item.internalUnitCost || item.unitCost),
                formatCurrency(item.clientUnitPrice || item.unitCost),
                formatCurrency(item.total),
              ])}
              empty="Sin hosting, dominios, licencias o costes externos."
            />
            <h3 className={styles.tableTitle}>Gestión, margen y contingencia</h3>
            <Table
              headers={["Etapa", "Concepto", "Tipo", "Horas/unid.", "Coste", "Precio cliente", "Total"]}
              rows={marginCostItems.map((item) => [
                item.stage,
                item.task,
                "Margen",
                `${item.hours}`,
                formatCurrency(item.internalUnitCost || item.unitCost),
                formatCurrency(item.clientUnitPrice || item.unitCost),
                formatCurrency(item.total),
              ])}
              empty="Sin líneas de margen o gestión."
            />
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
            </div>
            <form action={applyCostTemplate.bind(null, locale)} className={styles.templateForm}>
              <input type="hidden" name="projectId" value={project.id} />
              <select name="costTemplateId">
                {COST_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <button type="submit">Añadir plantilla</button>
            </form>
            <form action={createCostItem.bind(null, locale)} className={styles.formGrid}>
              <input type="hidden" name="projectId" value={project.id} />
              <label>
                Etapa
                <input name="stage" required placeholder="Análisis, backend..." />
              </label>
              <label className={styles.full}>
                Tarea
                <input name="task" required placeholder="Concepto" />
              </label>
              <label>
                Horas
                <input name="hours" required type="number" step="0.5" min="0" />
              </label>
              <label>
                Tipo
                <select name="lineType" defaultValue="own_work">
                  <option value="own_work">Trabajo propio</option>
                  <option value="external_cost">Coste externo</option>
                  <option value="recurring_service">Servicio recurrente</option>
                  <option value="margin">Margen / gestión</option>
                </select>
              </label>
              <label>
                Unidad
                <select name="unitType" defaultValue="hour">
                  <option value="hour">Hora</option>
                  <option value="fixed">Fijo</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </label>
              <label>
                Coste interno
                <input name="internalUnitCost" required type="number" step="0.5" min="0" />
              </label>
              <label>
                Precio cliente
                <input name="clientUnitPrice" required type="number" step="0.5" min="0" />
              </label>
              <input name="unitCost" type="hidden" value="0" />
              <label>
                Proveedor
                <input name="provider" placeholder="VPS, registrador, licencia..." />
              </label>
              <label>
                Recurrencia meses
                <input name="recurrenceMonths" type="number" step="1" min="0" placeholder="1, 12..." />
              </label>
              <label className={styles.full}>
                Notas
                <input name="notes" placeholder="Opcional" />
              </label>
              <div className={styles.formActions}>
                <button type="submit">Añadir coste</button>
              </div>
            </form>
            <div className={styles.toolbar}>
              <a className={styles.buttonLink} href={`${base}/estimations`}>Volver a trabajo propio</a>
              <a className={styles.primaryLink} href={`${base}/proforma`}>Continuar a proforma</a>
            </div>
          </Panel>
        )}

        {step === "proforma" && (
          <Panel title="Revisar y generar proforma">
            <p className={styles.muted}>
              Vista previa basada en las partidas de coste. Al generar, se crea una proforma editable y descargable.
            </p>
            <Table
              headers={["Descripción", "Tipo", "Horas/unid.", "Precio cliente", "Total"]}
              rows={project.costItems.map((item) => [
                `[${item.stage}] ${item.task}`,
                item.lineType === "external_cost" ? "Externo" : item.lineType === "margin" ? "Margen" : item.isRecurring ? "Recurrente" : "Trabajo",
                `${item.hours}h`,
                formatCurrency(item.clientUnitPrice || item.unitCost),
                formatCurrency(item.total),
              ])}
              empty="No hay costes para generar proforma."
            />
            <form action={generateProformaFromProjectCosts.bind(null, locale)} className={styles.formGrid}>
              <input type="hidden" name="projectId" value={project.id} />
              <label>
                Descuento
                <input name="discount" type="number" step="0.01" min="0" defaultValue="0" />
              </label>
              <label>
                IVA %
                <input name="ivaRate" type="number" step="0.01" min="0" defaultValue="21" />
              </label>
              <label className={styles.full}>
                Notas
                <textarea name="notes" rows={3} placeholder="Condiciones, validez, plazos..." />
              </label>
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className={styles.totalRow}>
                  <span>IVA base</span>
                  <strong>Según descuento e IVA</strong>
                </div>
                <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                  <span>Total</span>
                  <strong>Se calcula al generar</strong>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="submit" disabled={project.costItems.length === 0}>
                  Generar proforma
                </button>
              </div>
            </form>
            <div className={styles.toolbar}>
              <a className={styles.buttonLink} href={`${base}/costs`}>Volver a costes y precios</a>
            </div>
          </Panel>
        )}
  </>);
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (!rows.length) return (
    <div className={styles.emptyState}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
      <p>{empty}</p>
    </div>
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
