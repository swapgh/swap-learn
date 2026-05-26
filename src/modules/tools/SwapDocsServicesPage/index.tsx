"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import {
  createService,
  updateService,
  deleteService,
} from "@/modules/tools/SwapDocsPage/actions";
import baseStyles from "@/modules/tools/SwapDocsPage/styles.module.css";
import styles from "./styles.module.css";

type ServiceRate = { id: string; label: string; unitType: string; rate: number; internalCost: number; clientPrice: number };
type Service = {
  id: string; name: string; description: string | null; category: string | null; lineType: string;
  provider: string | null; defaultUnitType: string; isActive: boolean; rates: ServiceRate[];
};

function emptyRate() {
  return { label: "", unitType: "hour", rate: 0, internalCost: 0 };
}

export function SwapDocsServicesPage({
  locale,
  services,
  success,
  error,
}: {
  locale: Locale;
  services: Service[];
  success?: string;
  error?: string;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formLineType, setFormLineType] = useState("own_work");
  const [formProvider, setFormProvider] = useState("");
  const [formDefaultUnitType, setFormDefaultUnitType] = useState("hour");
  const [formRates, setFormRates] = useState<{ label: string; unitType: string; rate: number; internalCost: number }[]>([emptyRate()]);

  const toastMessage = success ?? error ?? null;

  function startCreate() {
    setIsCreating(true);
    setEditId(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("");
    setFormLineType("own_work");
    setFormProvider("");
    setFormDefaultUnitType("hour");
    setFormRates([emptyRate()]);
  }

  function startEdit(s: Service) {
    setIsCreating(false);
    setEditId(s.id);
    setFormName(s.name);
    setFormDescription(s.description ?? "");
    setFormCategory(s.category ?? "");
    setFormLineType(s.lineType);
    setFormProvider(s.provider ?? "");
    setFormDefaultUnitType(s.defaultUnitType);
    setFormRates(s.rates.length > 0
      ? s.rates.map((r) => ({ label: r.label, unitType: r.unitType === "hours" ? "hour" : r.unitType, rate: r.clientPrice || r.rate, internalCost: r.internalCost }))
      : [emptyRate()]
    );
  }

  function cancel() {
    setIsCreating(false);
    setEditId(null);
  }

  function updateRate(i: number, field: string, value: string) {
    const updated = [...formRates];
    if (field === "label") updated[i].label = value;
    else if (field === "unitType") updated[i].unitType = value;
    else if (field === "rate") updated[i].rate = value ? Number(value) : 0;
    else if (field === "internalCost") updated[i].internalCost = value ? Number(value) : 0;
    setFormRates(updated);
  }

  function addRate() {
    setFormRates([...formRates, emptyRate()]);
  }

  function removeRate(i: number) {
    if (formRates.length <= 1) return;
    setFormRates(formRates.filter((_, idx) => idx !== i));
  }

  function handleSubmit(formData: FormData) {
    formData.set("name", formName);
    formData.set("description", formDescription);
    formData.set("category", formCategory);
    formData.set("lineType", formLineType);
    formData.set("provider", formProvider);
    formData.set("defaultUnitType", formDefaultUnitType);

    formRates.forEach((r) => {
      formData.append("rateLabel", r.label);
      formData.append("rateType", r.unitType);
      formData.append("rateValue", String(r.rate));
      formData.append("rateCost", String(r.internalCost));
    });

    if (editId) {
      updateService(locale, editId, formData);
    } else {
      createService(locale, formData);
    }
  }

  const unitTypeLabels: Record<string, string> = {
    hour: "€/hora",
    hours: "€/hora",
    day: "€/día",
    fixed: "Precio fijo",
    monthly: "€/mes",
    word: "€/palabra",
    page: "€/página",
  };

  return (
        <><Toast message={toastMessage} />

        <div className={baseStyles.header}>
          <div>
            <p className={baseStyles.kicker}>Private tool</p>
            <h1>Servicios</h1>
            <p>Catálogo de servicios con tarifas por hora, día, mes o precio fijo.</p>
          </div>
          <button className={baseStyles.headerLink} onClick={startCreate}>
            + Nuevo servicio
          </button>
        </div>

        {(isCreating || editId) && (
          <form action={handleSubmit} className={styles.formPanel}>
            <h2>{editId ? "Editar servicio" : "Nuevo servicio"}</h2>
            <div className={styles.formGrid}>
              <label>
                Nombre
                <input name="name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
              </label>
              <label>
                Categoría
                <select name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  <option value="">Sin categoría</option>
                  <option value="web_app">Web / App</option>
                  <option value="backend_api">Backend / API</option>
                  <option value="frontend">Frontend</option>
                  <option value="database">Base de datos</option>
                  <option value="deployment">Despliegue</option>
                  <option value="hosting">Hosting</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="consulting">Consultoría</option>
                </select>
              </label>
              <label>
                Tipo
                <select name="lineType" value={formLineType} onChange={(e) => setFormLineType(e.target.value)}>
                  <option value="own_work">Trabajo propio</option>
                  <option value="external_cost">Coste externo</option>
                  <option value="recurring_service">Servicio recurrente</option>
                  <option value="margin">Margen / gestión</option>
                </select>
              </label>
              <label>
                Unidad por defecto
                <select name="defaultUnitType" value={formDefaultUnitType} onChange={(e) => setFormDefaultUnitType(e.target.value)}>
                  <option value="hour">Hora</option>
                  <option value="fixed">Fijo</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </label>
              <label>
                Proveedor
                <input name="provider" value={formProvider} onChange={(e) => setFormProvider(e.target.value)} placeholder="Opcional: VPS, dominio, API..." />
              </label>
              <label className={styles.full}>
                Descripción
                <input name="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </label>
            </div>

            <h3>Tarifas</h3>
            <div className={styles.ratesWrap}>
              <table className={styles.ratesTable}>
                <thead>
                  <tr>
                    <th>Etiqueta</th>
                    <th>Tipo</th>
                    <th>Coste</th>
                    <th>Precio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formRates.map((rate, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          value={rate.label}
                          onChange={(e) => updateRate(i, "label", e.target.value)}
                          placeholder="Frontend, Backend, Hora base..."
                        />
                      </td>
                      <td>
                        <select value={rate.unitType} onChange={(e) => updateRate(i, "unitType", e.target.value)}>
                          {Object.entries(unitTypeLabels).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number" step="0.01" min="0"
                          value={rate.internalCost || ""}
                          onChange={(e) => updateRate(i, "internalCost", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <input
                          type="number" step="0.01" min="0"
                          value={rate.rate || ""}
                          onChange={(e) => updateRate(i, "rate", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <button type="button" className={styles.removeBtn} onClick={() => removeRate(i)} disabled={formRates.length <= 1}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={styles.addBtn} onClick={addRate}>+ Añadir tarifa</button>

            <div className={styles.formActions}>
              <button type="submit">{editId ? "Guardar cambios" : "Crear servicio"}</button>
              <button type="button" className={styles.cancelBtn} onClick={cancel}>Cancelar</button>
            </div>
          </form>
        )}

        <div className={styles.serviceGrid}>
          {services.map((s) => (
            <article key={s.id} className={styles.serviceCard}>
              <div className={styles.cardHeader}>
                <div>
                  <strong className={styles.cardTitle}>{s.name}</strong>
                  {s.category && <span className={styles.cardCategory}>{s.category}</span>}
                  <span className={styles.cardCategory}>{s.lineType === "recurring_service" ? "Recurrente" : s.lineType === "external_cost" ? "Externo" : s.lineType === "margin" ? "Margen" : "Trabajo propio"}</span>
                </div>
                {!s.isActive && <span className={styles.inactive}>Inactivo</span>}
              </div>
              {s.description && <p className={styles.cardDesc}>{s.description}</p>}
              {s.rates.length > 0 && (
                <div className={styles.rateList}>
                  {s.rates.map((r) => (
                    <div key={r.id} className={styles.rateItem}>
                      <span className={styles.rateLabel}>{r.label}</span>
                      <span className={styles.rateValue}>
                        {(r.clientPrice || r.rate).toFixed(2)} €
                      </span>
                      <span className={styles.rateUnit}>Coste {r.internalCost.toFixed(2)} €</span>
                      <span className={styles.rateUnit}>{unitTypeLabels[r.unitType] ?? r.unitType}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={() => startEdit(s)}>Editar</button>
                <button className={styles.actionBtnDanger} onClick={() => { setDeleteId(s.id); setDeleteName(s.name); }}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>

        {services.length === 0 && !isCreating && (
          <div className={baseStyles.emptyState}>
            <p>No hay servicios todavía</p>
            <span>Crea tu primer servicio con el botón de arriba</span>
          </div>
        )}

        {deleteId && (
          <div className={styles.overlay}>
            <div className={styles.confirmBox}>
              <h3>Eliminar servicio</h3>
              <p>Vas a eliminar <strong>{deleteName}</strong>. Esta acción no se puede deshacer.</p>
              <form action={deleteService.bind(null, locale, deleteId)}>
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
