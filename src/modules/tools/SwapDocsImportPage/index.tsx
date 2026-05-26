"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Papa from "papaparse";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { importCsv } from "@/modules/tools/SwapDocsPage/actions";
import baseStyles from "@/modules/tools/SwapDocsPage/styles.module.css";
import styles from "./styles.module.css";

type ImportType = "clients" | "services";

const FIELD_MAP: Record<ImportType, { label: string; key: string; hints: string[] }[]> = {
  clients: [
    { label: "Nombre", key: "name", hints: ["name", "nombre", "NAME", "Nombre"] },
    { label: "NIF/CIF", key: "nifCif", hints: ["nifCif", "nif", "NIF", "cif", "CIF"] },
    { label: "Email", key: "email", hints: ["email", "Email", "EMAIL", "mail"] },
    { label: "Teléfono", key: "phone", hints: ["phone", "Phone", "telefono", "tlf"] },
    { label: "Dirección", key: "address", hints: ["address", "Address", "direccion", "Direccion"] },
    { label: "País", key: "country", hints: ["country", "Country", "pais", "Pais"] },
    { label: "VAT ID", key: "vatId", hints: ["vatId", "VAT", "vat"] },
  ],
  services: [
    { label: "Nombre", key: "name", hints: ["name", "nombre", "Name", "NAME"] },
    { label: "Descripción", key: "description", hints: ["description", "descripcion", "Descripcion"] },
    { label: "Categoría", key: "category", hints: ["category", "categoria", "Categoria"] },
    { label: "Tarifa", key: "rate", hints: ["rate", "Rate", "precio", "Precio", "tarifa"] },
    { label: "Tipo unidad", key: "unitType", hints: ["unitType", "unit", "Unidad", "unidad"] },
    { label: "Etiqueta tarifa", key: "rateLabel", hints: ["rateLabel", "Label", "tipo", "Tipo"] },
  ],
};

export function SwapDocsImportPage({
  locale,
  success,
  error,
}: {
  locale: Locale;
  success?: string;
  error?: string;
}) {
  const [importType, setImportType] = useState<ImportType>("clients");
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toastMessage = success ?? error ?? null;

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        const hdrs = result.meta.fields ?? [];
        setHeaders(hdrs);
        const rows = result.data as Record<string, string>[];
        setParsedRows(rows);

        const autoMap: Record<string, string> = {};
        const fields = FIELD_MAP[importType];
        for (const field of fields) {
          const match = hdrs.find((h) =>
            field.hints.some((hint) => h.toLowerCase().trim() === hint.toLowerCase().trim())
          );
          if (match) autoMap[field.key] = match;
        }
        setColumnMap(autoMap);
      },
    });
  }

  function handleImport() {
    const formData = new FormData();
    formData.set("type", importType);

    const mappedRows = parsedRows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [fieldKey, csvCol] of Object.entries(columnMap)) {
        mapped[fieldKey] = row[csvCol] ?? "";
      }
      return mapped;
    });

    formData.set("data", JSON.stringify(mappedRows));
    importCsv(locale, formData);
  }

  return (
        <><Toast message={toastMessage} />

        <div className={baseStyles.header}>
          <div>
            <p className={baseStyles.kicker}>Private tool</p>
            <h1>Importar CSV</h1>
            <p>Importa clientes o servicios desde un archivo CSV.</p>
          </div>
        </div>

        <section className={styles.importPanel}>
          <div className={styles.typeSelector}>
            <label className={parsedRows.length === 0 ? styles.typeActive : styles.typeDisabled}>
              <input
                type="radio"
                name="type"
                value="clients"
                checked={importType === "clients"}
                onChange={() => { setImportType("clients"); setParsedRows([]); setHeaders([]); setColumnMap({}); }}
                disabled={parsedRows.length > 0}
              />
              Clientes
            </label>
            <label className={parsedRows.length === 0 ? styles.typeActive : styles.typeDisabled}>
              <input
                type="radio"
                name="type"
                value="services"
                checked={importType === "services"}
                onChange={() => { setImportType("services"); setParsedRows([]); setHeaders([]); setColumnMap({}); }}
                disabled={parsedRows.length > 0}
              />
              Servicios
            </label>
          </div>

          <div className={styles.uploadArea}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className={styles.fileInput}
              id="csvFile"
            />
            <label htmlFor="csvFile" className={styles.fileLabel}>
              {fileName || "Seleccionar archivo CSV..."}
            </label>
            {parsedRows.length > 0 && (
              <span className={styles.rowCount}>{parsedRows.length} filas · {headers.length} columnas</span>
            )}
          </div>
        </section>

        {headers.length > 0 && (
          <section className={styles.mappingPanel}>
            <h2>Mapeo de columnas</h2>
            <p className={styles.hint}>
              Asigna cada columna del CSV al campo correspondiente. Los campos ya asignados se detectaron automáticamente.
            </p>
            <div className={styles.mappingGrid}>
              {FIELD_MAP[importType].map((field) => (
                <label key={field.key} className={styles.mappingRow}>
                  <span>{field.label}</span>
                  <select
                    value={columnMap[field.key] ?? ""}
                    onChange={(e) => setColumnMap((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  >
                    <option value="">— No importar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>
        )}

        {parsedRows.length > 0 && (
          <section className={styles.previewPanel}>
            <h2>Vista previa ({Math.min(parsedRows.length, 10)} de {parsedRows.length} filas)</h2>
            <div className={styles.tableWrap}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    {FIELD_MAP[importType].filter((f) => columnMap[f.key]).map((f) => (
                      <th key={f.key}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {FIELD_MAP[importType].filter((f) => columnMap[f.key]).map((f) => (
                        <td key={f.key}>{row[columnMap[f.key]] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.importBtn}
                onClick={handleImport}
                disabled={!Object.values(columnMap).some(Boolean)}
              >
                Importar {parsedRows.length} registro(s)
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => { setParsedRows([]); setHeaders([]); setColumnMap({}); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
              >
                Cancelar
              </button>
            </div>
          </section>
        )}
  </>);
}
