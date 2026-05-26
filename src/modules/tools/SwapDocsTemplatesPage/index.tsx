"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import {
  createServiceTemplateFromDb,
  updateServiceTemplateFromDb,
  deleteServiceTemplateFromDb,
} from "@/modules/tools/SwapDocsPage/actions";
import baseStyles from "@/modules/tools/SwapDocsPage/styles.module.css";
import styles from "./styles.module.css";

type TemplateLine = {
  id: string; description: string; hours: number | null; rate: number | null; amount: number; sortOrder: number;
  lineType: string; unitType: string; internalCost: number; clientPrice: number; provider: string | null; recurrenceMonths: number | null;
};
type Template = { id: string; name: string; description: string | null; category: string | null; lines: TemplateLine[] };

function emptyLine() {
  return { description: "", hours: null, rate: null, amount: 0, lineType: "own_work", unitType: "hour", internalCost: 0, provider: "", recurrenceMonths: null };
}

export function SwapDocsTemplatesPage({
  locale,
  templates,
  success,
  error,
}: {
  locale: Locale;
  templates: Template[];
  success?: string;
  error?: string;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("web_app");
  const [formLines, setFormLines] = useState<{ description: string; hours: number | null; rate: number | null; amount: number; lineType: string; unitType: string; internalCost: number; provider: string; recurrenceMonths: number | null }[]>([emptyLine()]);

  const toastMessage = success ?? error ?? null;

  function startCreate() {
    setIsCreating(true);
    setEditId(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("web_app");
    setFormLines([emptyLine()]);
  }

  function startEdit(t: Template) {
    setIsCreating(false);
    setEditId(t.id);
    setFormName(t.name);
    setFormDescription(t.description ?? "");
    setFormCategory(t.category ?? "web_app");
    setFormLines(t.lines.length > 0
      ? t.lines.map((l) => ({ description: l.description, hours: l.hours, rate: l.rate, amount: l.amount, lineType: l.lineType, unitType: l.unitType, internalCost: l.internalCost, provider: l.provider ?? "", recurrenceMonths: l.recurrenceMonths }))
      : [emptyLine()]
    );
  }

  function cancel() {
    setIsCreating(false);
    setEditId(null);
  }

  function updateLine(i: number, field: string, value: string) {
    const updated = [...formLines];
    if (field === "description") {
      updated[i] = { ...updated[i], description: value };
    } else if (field === "hours") {
      updated[i] = { ...updated[i], hours: value ? Number(value) : null };
    } else if (field === "rate") {
      updated[i] = { ...updated[i], rate: value ? Number(value) : null };
    } else if (field === "lineType") {
      updated[i] = { ...updated[i], lineType: value };
    } else if (field === "unitType") {
      updated[i] = { ...updated[i], unitType: value };
    } else if (field === "internalCost") {
      updated[i] = { ...updated[i], internalCost: value ? Number(value) : 0 };
    } else if (field === "provider") {
      updated[i] = { ...updated[i], provider: value };
    } else if (field === "recurrenceMonths") {
      updated[i] = { ...updated[i], recurrenceMonths: value ? Number(value) : null };
    }
    updated[i] = { ...updated[i], amount: (updated[i].hours ?? 0) * (updated[i].rate ?? 0) };
    setFormLines(updated);
  }

  function addLine() {
    setFormLines([...formLines, emptyLine()]);
  }

  function removeLine(i: number) {
    if (formLines.length <= 1) return;
    setFormLines(formLines.filter((_, idx) => idx !== i));
  }

  function handleSubmit(formData: FormData) {
    formLines.forEach((line) => {
      formData.append("lineDescription", line.description);
      formData.append("lineHours", String(line.hours ?? ""));
      formData.append("lineRate", String(line.rate ?? ""));
      formData.append("lineAmount", String(line.amount));
      formData.append("lineType", line.lineType);
      formData.append("lineUnitType", line.unitType);
      formData.append("lineInternalCost", String(line.internalCost));
      formData.append("lineProvider", line.provider);
      formData.append("lineRecurrenceMonths", String(line.recurrenceMonths ?? ""));
    });

    if (editId) {
      updateServiceTemplateFromDb(locale, editId, formData);
    } else {
      createServiceTemplateFromDb(locale, formData);
    }
  }

  const categories = ["web_app", "backend_api", "frontend", "database", "deployment", "hosting", "maintenance", "consulting", "other"] as const;
  const categoryLabels: Record<string, string> = {
    web_app: "Web / App",
    backend_api: "Backend / API",
    frontend: "Frontend",
    database: "Base de datos",
    deployment: "Despliegue",
    hosting: "Hosting",
    maintenance: "Mantenimiento",
    consulting: "Consultoría",
    other: "Otros",
  };

  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category && (Object.keys(categories) as string[]).includes(t.category) ? t.category : "other";
    acc[cat] ??= [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
        <><Toast message={toastMessage} />

        <div className={baseStyles.header}>
          <div>
            <p className={baseStyles.kicker}>Private tool</p>
            <h1>Plantillas</h1>
            <p>Gestiona plantillas profesionales de proforma con líneas internas y precios cliente.</p>
          </div>
          <button className={baseStyles.headerLink} onClick={startCreate}>
            + Nueva plantilla
          </button>
        </div>

        {/* Create / Edit form */}
        {(isCreating || editId) && (
          <form action={handleSubmit} className={styles.formPanel}>
            <h2>{editId ? "Editar plantilla" : "Nueva plantilla"}</h2>
            <div className={styles.formGrid}>
              <label>
                Nombre
                <input name="name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
              </label>
              <label>
                Categoría
                <select name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{categoryLabels[c]}</option>
                  ))}
                </select>
              </label>
              <label className={styles.full}>
                Descripción
                <input name="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </label>
            </div>

            <h3>Líneas</h3>
            <div className={styles.linesWrap}>
              <table className={styles.linesTable}>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Horas</th>
                    <th>€/h</th>
                    <th>Total</th>
                    <th>Tipo</th>
                    <th>Coste</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formLines.map((line, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          value={line.description}
                          onChange={(e) => updateLine(i, "description", e.target.value)}
                          placeholder="Descripción del servicio..."
                        />
                      </td>
                      <td>
                        <input
                          type="number" step="0.25" min="0"
                          value={line.hours ?? ""}
                          onChange={(e) => updateLine(i, "hours", e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number" step="0.01" min="0"
                          value={line.rate ?? ""}
                          onChange={(e) => updateLine(i, "rate", e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className={styles.amountCell}>
                        {((line.hours ?? 0) * (line.rate ?? 0)).toFixed(2)} €
                      </td>
                      <td>
                        <select value={line.lineType} onChange={(e) => updateLine(i, "lineType", e.target.value)}>
                          <option value="own_work">Trabajo</option>
                          <option value="external_cost">Externo</option>
                          <option value="recurring_service">Recurrente</option>
                          <option value="margin">Margen</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number" step="0.01" min="0"
                          value={line.internalCost || ""}
                          onChange={(e) => updateLine(i, "internalCost", e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <button type="button" className={styles.removeBtn} onClick={() => removeLine(i)} disabled={formLines.length <= 1}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={styles.addLineBtn} onClick={addLine}>+ Añadir línea</button>

            <div className={styles.formActions}>
              <button type="submit">{editId ? "Guardar cambios" : "Crear plantilla"}</button>
              <button type="button" className={styles.cancelBtn} onClick={cancel}>Cancelar</button>
            </div>
          </form>
        )}

        {/* Template list grouped by category */}
        {categories.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <section key={cat} className={styles.categorySection}>
              <h2>{categoryLabels[cat]} ({items.length})</h2>
              <div className={styles.templateGrid}>
                {items.map((t) => (
                  <article key={t.id} className={styles.templateCard}>
                    <div className={styles.cardHeader}>
                      <strong className={styles.cardTitle}>{t.name}</strong>
                      <span className={styles.lineCount}>{t.lines.length} líneas</span>
                    </div>
                    {t.description && <p className={styles.cardDesc}>{t.description}</p>}
                    <div className={styles.cardActions}>
                      <button className={styles.cardActionBtn} onClick={() => startEdit(t)}>Editar</button>
                      <button className={styles.cardActionBtnDanger} onClick={() => { setDeleteId(t.id); setDeleteName(t.name); }}>
                        Eliminar
                      </button>
                    </div>

                    {/* Inline lines preview */}
                    {t.lines.length > 0 && (
                      <details className={styles.linesPreview}>
                        <summary>Ver líneas</summary>
                        <div className={styles.previewTableWrap}>
                          <table className={styles.previewTable}>
                            <thead>
                              <tr>
                                <th>Descripción</th>
                                <th>Horas</th>
                                <th>€/h</th>
                                <th>Total</th>
                                <th>Tipo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.lines.sort((a, b) => a.sortOrder - b.sortOrder).map((l) => (
                                <tr key={l.id}>
                                  <td>{l.description}</td>
                                  <td>{l.hours ?? "-"}</td>
                                  <td>{l.rate != null ? `${l.rate.toFixed(2)}` : "-"}</td>
                                  <td>{l.amount.toFixed(2)} €</td>
                                  <td>{l.lineType === "recurring_service" ? "Recurrente" : l.lineType === "external_cost" ? "Externo" : l.lineType === "margin" ? "Margen" : "Trabajo"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {templates.length === 0 && !isCreating && (
          <div className={baseStyles.emptyState}>
            <p>No hay plantillas todavía</p>
            <span>Crea tu primera plantilla con el botón de arriba</span>
          </div>
        )}

        {/* Delete confirmation */}
        {deleteId && (
          <div className={styles.overlay}>
            <div className={styles.confirmBox}>
              <h3>Eliminar plantilla</h3>
              <p>Vas a eliminar <strong>{deleteName}</strong>. Esta acción no se puede deshacer.</p>
              <form action={deleteServiceTemplateFromDb.bind(null, locale, deleteId)}>
                <div className={styles.formActions}>
                  <button type="submit">Eliminar</button>
                  <button type="button" className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
  </>);
}
