"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import styles from "./styles.module.css";

type JobState =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "applied"
  | "follow_up"
  | "interview"
  | "rejected"
  | "archived";

type SwapJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  country: string | null;
  modality: string;
  source: string;
  salary: string | null;
  url: string | null;
  description: string | null;
  notes: string | null;
  state: JobState;
  score: number;
  fitScore: number;
  viabilityScore: number;
  qualityScore: number;
  timingScore: number;
  recommendedCv: string;
  action: string;
  technologies: string[];
  positiveFlags: string[];
  riskFlags: string[];
  dateApplied: string | null;
  followUpDate: string | null;
};

type Analysis = Omit<
  SwapJob,
  "id" | "notes" | "state" | "dateApplied" | "followUpDate"
> & {
  state?: JobState;
  estimatedTime: string;
};

const stateLabels: Record<JobState, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  shortlisted: "Preseleccionada",
  applied: "Aplicada",
  follow_up: "Seguimiento",
  interview: "Entrevista",
  rejected: "Rechazada",
  archived: "Archivada",
};

const cvLinks: Record<string, string> = {
  "CV Español": "/cv/Fernando_Alba_CV_ES.pdf",
  "CV Inglés": "/cv/Fernando_Alba_CV_EN.pdf",
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function detectTitle(text: string) {
  const explicit = firstMatch(text, [
    /(?:puesto|cargo|title|position)\s*[:\-]\s*(.+)/i,
    /(?:oferta de empleo|job opening)\s*[:\-]\s*(.+)/i,
  ]);
  if (explicit) return explicit.split("\n")[0].trim();

  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 8 && line.length < 95 && !line.startsWith("http")) ??
    "Oferta sin título"
  );
}

function detectCompany(text: string) {
  return firstMatch(text, [
    /(?:empresa|company|cliente)\s*[:\-]\s*(.+)/i,
    /(?:en|at)\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&.\- ]{2,60})/i,
  ]).split("\n")[0];
}

function detectLocation(text: string) {
  const explicit = firstMatch(text, [
    /(?:ubicaci[oó]n|location|lugar)\s*[:\-]\s*(.+)/i,
    /(?:ciudad|city)\s*[:\-]\s*(.+)/i,
  ]);
  if (explicit) return explicit.split("\n")[0];
  if (/menorca/i.test(text)) return "Menorca";
  if (/mallorca|palma/i.test(text)) return "Palma / Mallorca";
  if (/españa|spain/i.test(text)) return "España";
  if (/new zealand|nueva zelanda/i.test(text)) return "Nueva Zelanda";
  return "";
}

function detectSalary(text: string) {
  const salaryMatch = text.match(
    /(\d{2,3}[\.,]?\d{3})\s*[-–]\s*(\d{2,3}[\.,]?\d{3})\s*(€|eur)?/i
  );
  return salaryMatch ? `${salaryMatch[1]}-${salaryMatch[2]} EUR` : "";
}

function detectUrl(text: string) {
  return text.match(/https?:\/\/\S+/)?.[0]?.replace(/[),.]+$/, "") ?? "";
}

function detectTechnologies(lower: string) {
  const techMap: Array<[string, RegExp]> = [
    ["php", /\bphp\b/],
    ["mysql", /\bmysql\b/],
    ["sql", /\bsql\b|postgres|postgresql/],
    ["react", /\breact\b|reactjs/],
    ["typescript", /\btypescript\b|\btsx\b/],
    ["next.js", /\bnext\.?js\b/],
    ["java", /\bjava\b/],
    ["python", /\bpython\b/],
    ["linux", /\blinux\b/],
    ["docker", /\bdocker\b/],
    ["aws", /\baws\b|amazon web services/],
    ["azure", /\bazure\b/],
  ];
  return techMap.filter(([, pattern]) => pattern.test(lower)).map(([name]) => name);
}

function analyzeOffer(rawText: string): Analysis {
  const description = rawText.trim();
  const lower = normalize(description);
  const technologies = detectTechnologies(lower);
  const salary = detectSalary(description);
  const positiveFlags: string[] = [];
  const riskFlags: string[] = [];
  let fitScore = 45;

  if (/soporte|support|helpdesk|application support|microinformatica|tecnico/.test(lower)) {
    fitScore += 25;
    positiveFlags.push("Rol de soporte/aplicaciones");
  }
  if (/\bphp\b/.test(lower)) {
    fitScore += 15;
    positiveFlags.push("PHP requerido");
  }
  if (/\bsql\b|mysql|postgres/.test(lower)) {
    fitScore += 15;
    positiveFlags.push("SQL/MySQL requerido");
  }
  if (/react|typescript|next\.?js/.test(lower)) {
    fitScore += 10;
    positiveFlags.push("Stack web compatible");
  }
  if (/junior|jr\.?|fp|dam|sin experiencia|entry/.test(lower)) {
    fitScore += 10;
    positiveFlags.push("Años realistas");
  }
  if (/menorca|baleares|illes balears/.test(lower)) {
    fitScore += 8;
    positiveFlags.push("Ubicación especialmente viable");
  }

  const yearsMatch = description.match(/(\d+)\+?\s*(años?|years?)/i);
  const years = yearsMatch ? Number(yearsMatch[1]) : 0;
  if (/senior|lead|principal|staff|head/.test(lower)) {
    fitScore -= 25;
    riskFlags.push("Pide perfil senior");
  }
  if (years >= 5) {
    fitScore -= 20;
    riskFlags.push(`${years}+ años requeridos`);
  }
  if (/ingles\s*(c1|c2|fluido|avanzado|imprescindible)|english\s*(c1|c2|fluent|required)/.test(lower)) {
    fitScore -= 15;
    riskFlags.push("Inglés avanzado obligatorio");
  }
  if (/\b(\.net|dotnet|c#|ruby|go\b|rust|kotlin)\b/.test(lower)) {
    fitScore -= 15;
    riskFlags.push("Stack alejado del perfil principal");
  }
  if (!salary) riskFlags.push("Salario no indicado");

  const modality = /remoto|remote|teletrabajo|full.?remote/.test(lower)
    ? "remote"
    : /hibrido|hybrid/.test(lower)
      ? "hybrid"
      : "onsite";
  const source = detectUrl(description).includes("linkedin")
    ? "LinkedIn"
    : detectUrl(description).includes("infojobs")
      ? "InfoJobs"
      : "manual";
  const country = /new zealand|nueva zelanda/.test(lower) ? "Nueva Zelanda" : "España";
  const viabilityScore = modality === "remote" ? 88 : modality === "hybrid" ? 74 : /menorca|palma|baleares/.test(lower) ? 70 : 50;
  const qualityScore = Math.min(100, 35 + (description.length > 500 ? 25 : 10) + (salary ? 20 : 0) + technologies.length * 5);
  const timingScore = 70;
  const score = Math.max(0, Math.min(100, Math.round(fitScore * 0.45 + viabilityScore * 0.3 + qualityScore * 0.15 + timingScore * 0.1)));
  const recommendedCv = /english|new zealand|international|global/.test(lower) ? "CV Inglés" : "CV Español";
  const action = score >= 70 ? "Aplicar ahora" : score >= 50 ? "Guardar para revisar" : "Descartar";

  return {
    title: detectTitle(description),
    company: detectCompany(description),
    location: detectLocation(description),
    country,
    modality,
    source,
    salary,
    url: detectUrl(description),
    description,
    score,
    fitScore: Math.max(0, Math.min(100, fitScore)),
    viabilityScore,
    qualityScore,
    timingScore,
    recommendedCv,
    action,
    technologies,
    positiveFlags,
    riskFlags,
    estimatedTime: score >= 70 ? "15 min" : score >= 50 ? "30 min" : "60+ min",
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value));
}

function dateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((cells) => cells.some(Boolean));
}

function normalizeImportedJob(raw: Partial<SwapJob> & Record<string, unknown>) {
  const description = String(raw.description ?? "");
  const analysis = description ? analyzeOffer(description) : analyzeOffer(`${raw.title ?? ""}\n${raw.company ?? ""}\n${raw.notes ?? ""}`);

  return {
    ...analysis,
    title: String(raw.title ?? analysis.title),
    company: raw.company ? String(raw.company) : analysis.company,
    location: raw.location ? String(raw.location) : analysis.location,
    country: raw.country ? String(raw.country) : analysis.country,
    modality: raw.modality ? String(raw.modality) : analysis.modality,
    source: raw.source ? String(raw.source) : analysis.source,
    salary: raw.salary ? String(raw.salary) : analysis.salary,
    url: raw.url ? String(raw.url) : analysis.url,
    description,
    notes: raw.notes ? String(raw.notes) : "",
    state: (raw.state as JobState) || "new",
    score: Number(raw.score ?? analysis.score) || analysis.score,
    dateApplied: raw.dateApplied ? String(raw.dateApplied) : null,
    followUpDate: raw.followUpDate ? String(raw.followUpDate) : null,
    technologies: Array.isArray(raw.technologies)
      ? raw.technologies.map(String)
      : String(raw.technologies ?? "")
          .split(/[|,]/)
          .map((item) => item.trim())
          .filter(Boolean),
  };
}

function scoreLevel(score: number) {
  if (score >= 75) return styles.high;
  if (score >= 55) return styles.medium;
  return styles.low;
}

function buildMessage(job: SwapJob | Analysis, followUp = false) {
  const company = job.company || "vuestro equipo";
  const role = job.title || "la posición";
  const skills = job.technologies?.slice(0, 2).join(" y ") || "soporte técnico y desarrollo web";

  if (followUp) {
    return `Hola,\n\nMe pongo en contacto para hacer seguimiento de mi candidatura al puesto de ${role}. Sigo interesado en la posición y en ${company}.\n\n¿Hay alguna novedad sobre el proceso?\n\nGracias,\nFernando Alba`;
  }

  return `Hola,\n\nHe visto la oferta de ${role} en ${company} y me gustaría presentar mi candidatura. Mi experiencia en ${skills} encaja con los requisitos descritos, especialmente por mi perfil mixto de soporte IT y desarrollo.\n\nQuedo disponible para ampliar información.\n\nGracias,\nFernando Alba`;
}

export function SwapJobsClient({ initialJobs }: { initialJobs: SwapJob[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "applications" | "profile">("dashboard");
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<JobState | "all">("all");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const importInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const active = jobs.filter((job) => !["rejected", "archived"].includes(job.state));
    return {
      total: jobs.length,
      priority: active.filter((job) => job.score >= 70).length,
      applied: jobs.filter((job) => job.state === "applied").length,
      interviews: jobs.filter((job) => job.state === "interview").length,
      followUps: jobs.filter((job) => job.followUpDate && job.state === "applied").length,
      average: jobs.length ? Math.round(jobs.reduce((sum, job) => sum + job.score, 0) / jobs.length) : 0,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = normalize(search);
    return jobs
      .filter((job) => (stateFilter === "all" ? true : job.state === stateFilter))
      .filter((job) =>
        query
          ? normalize(`${job.title} ${job.company ?? ""} ${job.location ?? ""} ${job.technologies?.join(" ") ?? ""}`).includes(query)
          : true
      )
      .sort((a, b) => b.score - a.score);
  }, [jobs, search, stateFilter]);

  const topJobs = useMemo(() => [...jobs].sort((a, b) => b.score - a.score).slice(0, 3), [jobs]);
  const followUps = useMemo(() => jobs.filter((job) => job.followUpDate && job.state === "applied").slice(0, 4), [jobs]);

  async function createJob(payload: Partial<Analysis> & Record<string, unknown>) {
    const response = await fetch("/api/tools/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("CREATE_JOB_FAILED");
    return (await response.json()) as SwapJob;
  }

  async function saveJob(state: JobState = "new") {
    if (!analysis) return;
    const payload = state === "applied" ? { ...analysis, state } : analysis;
    const created = await createJob(payload);
    setJobs((current) => [created, ...current]);
    setActiveTab("applications");
  }

  async function updateJob(id: string, updates: Partial<SwapJob>) {
    const response = await fetch(`/api/tools/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as SwapJob;
    setJobs((current) => current.map((job) => (job.id === id ? updated : job)));
  }

  async function deleteJob(id: string) {
    const response = await fetch(`/api/tools/jobs/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setJobs((current) => current.filter((job) => job.id !== id));
  }

  function exportJson() {
    downloadFile(JSON.stringify(jobs, null, 2), `swap-jobs-${today()}.json`, "application/json");
  }

  function exportCsv() {
    const headers = [
      "title",
      "company",
      "location",
      "country",
      "modality",
      "state",
      "source",
      "url",
      "salary",
      "score",
      "recommendedCv",
      "action",
      "technologies",
      "dateApplied",
      "followUpDate",
      "description",
      "notes",
    ];
    const rows = [headers, ...jobs.map((job) => headers.map((header) => csvEscape(job[header as keyof SwapJob])))];
    downloadFile(rows.map((row) => row.join(",")).join("\n"), `swap-jobs-${today()}.csv`, "text/csv");
  }

  async function importFile(file: File) {
    const text = await file.text();
    const imported = file.name.endsWith(".csv")
      ? (() => {
          const rows = parseCsv(text);
          const headers = rows.shift() ?? [];
          return rows.map((row) => {
          return headers.reduce<Record<string, unknown>>((acc, header, index) => {
            acc[header] = row[index] ?? "";
            return acc;
          }, {});
        });
        })()
      : JSON.parse(text);
    const list = Array.isArray(imported) ? imported : [imported];
    const created: SwapJob[] = [];

    for (const item of list) {
      created.push(await createJob(normalizeImportedJob(item)));
    }

    setJobs((current) => [...created, ...current]);
    setActiveTab("applications");
  }

  function runAnalysis() {
    if (!text.trim()) return;
    const nextAnalysis = analyzeOffer(text);
    setAnalysis(nextAnalysis);
    setMessage("");
  }

  return (
    <div className={styles.swapJobs}>
      <div className={styles.productTabs} role="tablist" aria-label="SwapJobs">
        {[
          ["dashboard", "Dashboard"],
          ["jobs", "Ofertas"],
          ["applications", "Candidaturas"],
          ["profile", "Perfil"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(id as typeof activeTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <section className={styles.dashboard}>
          <div className={styles.pageHeading}>
            <h2>Dashboard</h2>
            <button type="button" className={styles.primaryButton} onClick={() => setActiveTab("jobs")}>
              Nueva oferta
            </button>
          </div>
          <div className={styles.metrics}>
            <Metric label="Total" value={stats.total} tone="blue" />
            <Metric label="Prioritarias" value={stats.priority} tone="purple" />
            <Metric label="Aplicadas" value={stats.applied} tone="green" />
            <Metric label="Entrevistas" value={stats.interviews} tone="olive" />
            <Metric label="Seguimientos" value={stats.followUps} tone="red" />
            <Metric label="Score medio" value={stats.average} tone="neutral" />
          </div>
          <div className={styles.dashboardGrid}>
            <Panel title="Top ofertas por score">
              <CompactList jobs={topJobs} onOpen={() => setActiveTab("applications")} />
            </Panel>
            <Panel title="Seguimientos pendientes">
              <CompactList jobs={followUps} onOpen={() => setActiveTab("applications")} />
            </Panel>
          </div>
        </section>
      )}

      {activeTab === "jobs" && (
        <section className={styles.jobsGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Analizar oferta</h2>
                <p>Pega una oferta completa. SwapJobs detecta puesto, stack, riesgos y CV.</p>
              </div>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => {
                  setText("");
                  setAnalysis(null);
                  setMessage("");
                }}
              >
                Limpiar
              </button>
            </div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Pega aquí el texto completo de LinkedIn, InfoJobs, Tecnoempleo o una oferta internacional..."
            />
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={runAnalysis} disabled={!text.trim()}>
                Analizar oferta
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => startTransition(() => void saveJob("new"))}
                disabled={!analysis || isPending}
              >
                Guardar en candidaturas
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => startTransition(() => void saveJob("applied"))}
                disabled={!analysis || isPending}
              >
                Aplicar
              </button>
            </div>
          </div>

          <AnalysisPanel
            analysis={analysis}
            onMessage={() => analysis && setMessage(buildMessage(analysis))}
          />

          {message && (
            <div className={styles.panelWide}>
              <div className={styles.panelHeader}>
                <h2>Mensaje</h2>
                <button type="button" className={styles.ghostButton} onClick={() => navigator.clipboard.writeText(message)}>
                  Copiar
                </button>
              </div>
              <textarea className={styles.messageBox} readOnly value={message} />
            </div>
          )}
        </section>
      )}

      {activeTab === "applications" && (
        <section className={styles.panelWide}>
          <div className={styles.pageHeading}>
            <div>
              <h2>Candidaturas</h2>
              <p>{jobs.length} guardadas · {stats.applied} aplicadas</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={() => setActiveTab("jobs")}>
                Nueva oferta
              </button>
              <button type="button" className={styles.secondaryButton} onClick={exportJson}>
                Exportar JSON
              </button>
              <button type="button" className={styles.secondaryButton} onClick={exportCsv}>
                Exportar CSV
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => importInputRef.current?.click()}>
                Importar
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                className={styles.hiddenInput}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  startTransition(() => {
                    void importFile(file);
                  });
                  event.currentTarget.value = "";
                }}
              />
            </div>
          </div>
          <div className={styles.filters}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por puesto, empresa, stack o ciudad..." />
            <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as JobState | "all")}>
              <option value="all">Todos los estados</option>
              {Object.entries(stateLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.list}>
            {filteredJobs.map((job) => (
              <article key={job.id} className={styles.jobCard}>
                <span className={`${styles.score} ${scoreLevel(job.score)}`}>{job.score}</span>
                <div className={styles.jobBody}>
                  <h3>{job.title}</h3>
                  <p className={styles.muted}>
                    {job.company || "Empresa no indicada"} · {job.location || "Sin ubicación"} · {job.salary || "Salario no indicado"}
                  </p>
                  <div className={styles.tags}>
                    <span>{stateLabels[job.state]}</span>
                    <span>{job.recommendedCv}</span>
                    <span>{job.action}</span>
                    {job.technologies?.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
                  </div>
                  <p className={styles.jobNote}>
                    {job.source || "manual"} · {job.dateApplied ? `Aplicada ${formatDate(job.dateApplied)}` : "No aplicada"}
                    {job.followUpDate ? ` · Seguimiento ${formatDate(job.followUpDate)}` : ""}
                  </p>
                  {job.riskFlags?.[0] && <p className={styles.risk}>{job.riskFlags[0]}</p>}
                </div>
                <div className={styles.jobActions}>
                  {job.url && <a className={styles.textLink} href={job.url} target="_blank" rel="noreferrer">Oferta</a>}
                  <button type="button" className={styles.ghostButton} onClick={() => setMessage(buildMessage(job))}>Mensaje</button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => startTransition(() => void updateJob(job.id, { state: job.state === "applied" ? "reviewed" : "applied" }))}
                  >
                    {job.state === "applied" ? "Desmarcar" : "Aplicada"}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => {
                      if (!window.confirm(`Vas a eliminar "${job.title}". Esta acción no se puede deshacer.`)) return;
                      startTransition(() => void deleteJob(job.id));
                    }}
                  >
                    Eliminar
                  </button>
                </div>
                <details className={styles.editDetails}>
                  <summary>Editar seguimiento</summary>
                  <EditJobForm
                    job={job}
                    onSave={(updates) => startTransition(() => void updateJob(job.id, updates))}
                  />
                </details>
              </article>
            ))}
            {filteredJobs.length === 0 && <p className={styles.empty}>No hay candidaturas con esos filtros.</p>}
          </div>
          {message && <textarea className={styles.messageBox} readOnly value={message} />}
        </section>
      )}

      {activeTab === "profile" && (
        <section className={styles.panelWide}>
          <h2>Perfil</h2>
          <div className={styles.profileGrid}>
            <div>
              <h3>Roles objetivo</h3>
              <p>Soporte IT, Application Support, Junior Web Developer.</p>
            </div>
            <div>
              <h3>Skills fuertes</h3>
              <p>PHP, MySQL, SQL, React, soporte técnico.</p>
            </div>
            <div>
              <h3>Ubicaciones</h3>
              <p>Menorca, España, UE, remoto y países con visa pathway.</p>
            </div>
            <div>
              <h3>CVs</h3>
              <div className={styles.actions}>
                <a className={styles.secondaryButton} href={cvLinks["CV Español"]} target="_blank" rel="noreferrer">Abrir CV Español</a>
                <a className={styles.secondaryButton} href={cvLinks["CV Inglés"]} target="_blank" rel="noreferrer">Abrir CV Inglés</a>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EditJobForm({
  job,
  onSave,
}: {
  job: SwapJob;
  onSave: (updates: Partial<SwapJob>) => void;
}) {
  return (
    <form
      className={styles.editForm}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave({
          state: formData.get("state") as JobState,
          dateApplied: String(formData.get("dateApplied") ?? ""),
          followUpDate: String(formData.get("followUpDate") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        });
      }}
    >
      <label>
        Estado
        <select name="state" defaultValue={job.state}>
          {Object.entries(stateLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fecha candidatura
        <input name="dateApplied" type="date" defaultValue={dateInputValue(job.dateApplied)} />
      </label>
      <label>
        Fecha seguimiento
        <input name="followUpDate" type="date" defaultValue={dateInputValue(job.followUpDate)} />
      </label>
      <label className={styles.fullField}>
        Notas
        <textarea name="notes" rows={3} defaultValue={job.notes ?? ""} />
      </label>
      <button type="submit" className={styles.secondaryButton}>
        Guardar cambios
      </button>
    </form>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`${styles.metric} ${styles[tone]}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CompactList({ jobs, onOpen }: { jobs: SwapJob[]; onOpen: () => void }) {
  if (!jobs.length) return <p className={styles.empty}>Sin datos todavía.</p>;
  return (
    <div className={styles.compactList}>
      {jobs.map((job) => (
        <button key={job.id} type="button" className={styles.compactJob} onClick={onOpen}>
          <span className={`${styles.scoreChip} ${scoreLevel(job.score)}`}>{job.score}</span>
          <span>
            <strong>{job.title}</strong>
            <small>{job.company || "Empresa no indicada"}</small>
          </span>
          <em>{stateLabels[job.state]}</em>
        </button>
      ))}
    </div>
  );
}

function AnalysisPanel({
  analysis,
  onMessage,
}: {
  analysis: Analysis | null;
  onMessage: () => void;
}) {
  if (!analysis) {
    return (
      <aside className={styles.panel}>
        <p className={styles.empty}>Pega una oferta y pulsa Analizar oferta.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.analysisHero}>
        <span className={`${styles.score} ${scoreLevel(analysis.score)}`}>{analysis.score}</span>
        <div>
          <h2>{analysis.title}</h2>
          <p className={styles.muted}>
            {analysis.company || "Empresa no detectada"} · {analysis.location || "Ubicación no detectada"} · {analysis.modality}
          </p>
        </div>
      </div>
      <div className={styles.tags}>
        <span>{analysis.action}</span>
        <span>{analysis.recommendedCv}</span>
        {analysis.salary ? <span>{analysis.salary}</span> : <span>Salario no indicado</span>}
      </div>
      <div className={styles.scoreGrid}>
        <div><strong>{analysis.fitScore}</strong><span>Encaje</span></div>
        <div><strong>{analysis.viabilityScore}</strong><span>Viabilidad</span></div>
        <div><strong>{analysis.qualityScore}</strong><span>Calidad</span></div>
        <div><strong>{analysis.estimatedTime}</strong><span>Tiempo</span></div>
      </div>
      <div className={styles.tags}>
        {analysis.technologies.map((item) => <span key={item}>{item}</span>)}
      </div>
      <ul className={styles.flags}>
        {analysis.positiveFlags.map((flag) => <li key={flag}>{flag}</li>)}
        {analysis.riskFlags.map((flag) => <li key={flag} className={styles.risk}>{flag}</li>)}
      </ul>
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onMessage}>Generar mensaje</button>
        <a className={styles.secondaryButton} href={cvLinks[analysis.recommendedCv]} target="_blank" rel="noreferrer">Abrir CV</a>
        {analysis.url && <a className={styles.secondaryButton} href={analysis.url} target="_blank" rel="noreferrer">Abrir oferta</a>}
      </div>
    </aside>
  );
}
