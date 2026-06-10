"use client";

import { useMemo, useState, useTransition } from "react";
import styles from "./styles.module.css";

type JobState = "new" | "reviewed" | "shortlisted" | "applied" | "follow_up" | "interview" | "rejected" | "archived";
type TaskStatus = "pending" | "claimed" | "running" | "waiting_approval" | "approved" | "completed" | "failed" | "blocked" | "cancelled";
type TaskType = "search_source" | "inspect_job" | "fill_application" | "final_submit";

type Application = {
  id: string;
  status: string;
  sourceUrl: string | null;
  submittedAt: string | null;
  blockedReason: string | null;
  updatedAt: string;
};

type SwapJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  source: string;
  salary: string | null;
  url: string | null;
  state: JobState;
  score: number;
  action: string;
  automationStatus: string;
  recommendedCv: string;
  technologies: string[];
  riskFlags: string[];
  positiveFlags: string[];
  updatedAt: string;
  applications?: Application[];
};

type Profile = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  cvEsUrl: string;
  cvEnUrl: string;
  cvText: string | null;
  targetRoles: string[];
  targetLocations: string[];
  languages: string[];
  salaryMin: number | null;
  mustHave: string[];
  rejectTerms: string[];
  preferredCompanies: string[];
  blockedCompanies: string[];
  applicationFields: Record<string, string>;
};

type SearchPlan = {
  id: string;
  source: "linkedin" | "indeed" | "infojobs";
  query: string;
  location: string | null;
  modality: string;
  enabled: boolean;
  cadenceMinutes: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

type AutomationLog = {
  id: string;
  level: string;
  message: string;
  createdAt: string;
};

type AutomationTaskResult = {
  url?: string;
  submittedUrl?: string;
};

type AutomationTask = {
  id: string;
  type: TaskType;
  status: TaskStatus;
  source: string | null;
  priority: number;
  error: string | null;
  result?: AutomationTaskResult | null;
  createdAt: string;
  updatedAt: string;
  job?: SwapJob | null;
  logs?: AutomationLog[];
};

type Tab = "command" | "profile" | "searches" | "jobs" | "automation";

const emptyProfile: Profile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedinUrl: "",
  portfolioUrl: "",
  cvEsUrl: "/cv/Fernando_Alba_CV_ES.pdf",
  cvEnUrl: "/cv/Fernando_Alba_CV_EN.pdf",
  cvText: "",
  targetRoles: ["Application Support", "IT Support", "Junior Web Developer"],
  targetLocations: ["Menorca", "Spain", "Remote", "Europe"],
  languages: ["Spanish", "English"],
  salaryMin: null,
  mustHave: ["SQL", "PHP", "React", "support"],
  rejectTerms: ["senior", "lead", "unpaid", "internship"],
  preferredCompanies: [],
  blockedCompanies: [],
  applicationFields: {
    noticePeriod: "Immediate",
    workPermit: "EU citizen",
    salaryExpectation: "",
  },
};

const taskLabels: Record<TaskType, string> = {
  search_source: "Busqueda",
  inspect_job: "Revision",
  fill_application: "Preparar",
  final_submit: "Enviar",
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pendiente",
  claimed: "Tomada",
  running: "En curso",
  waiting_approval: "Aprobar",
  approved: "Aprobada",
  completed: "Completada",
  failed: "Error",
  blocked: "Bloqueada",
  cancelled: "Cancelada",
};

const jobStateLabels: Record<JobState, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  shortlisted: "Prioritaria",
  applied: "Enviada",
  follow_up: "Seguimiento",
  interview: "Entrevista",
  rejected: "Rechazada",
  archived: "Archivada",
};

const searchPresets = [
  {
    label: "Soporte IT Baleares",
    source: "infojobs",
    query: "soporte tecnico informatico SQL ERP",
    location: "Menorca Baleares",
    modality: "any",
  },
  {
    label: "Application support",
    source: "infojobs",
    query: "application support SQL PHP",
    location: "Spain Remote",
    modality: "remote",
  },
  {
    label: "Junior web remoto",
    source: "infojobs",
    query: "junior web developer PHP React SQL",
    location: "Spain Remote",
    modality: "remote",
  },
  {
    label: "Helpdesk Mallorca",
    source: "infojobs",
    query: "tecnico sistemas helpdesk SQL",
    location: "Palma Mallorca",
    modality: "any",
  },
] as const;

function listToText(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonRecordFromTextarea(value: FormDataEntryValue | null) {
  const record: Record<string, string> = {};
  String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) record[key.trim()] = rest.join("=").trim();
    });
  return record;
}

function recordToText(value: Record<string, string> | null | undefined) {
  return Object.entries(value ?? {})
    .map(([key, item]) => `${key}=${item}`)
    .join("\n");
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || "Request failed");
  }
  return response.json() as Promise<T>;
}

function scoreClass(score: number) {
  if (score >= 74) return styles.high;
  if (score >= 54) return styles.medium;
  return styles.low;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function latestApplication(job: SwapJob) {
  return job.applications?.[0] ?? null;
}

function applicationUrl(job: SwapJob) {
  const application = latestApplication(job);
  return application?.sourceUrl || null;
}

function taskResultUrl(task: AutomationTask) {
  return task.result?.submittedUrl || task.result?.url || null;
}

export function SwapJobsClient({
  initialJobs,
  initialProfile,
  initialSearches,
  initialTasks,
}: {
  initialJobs: SwapJob[];
  initialProfile: Profile | null;
  initialSearches: SearchPlan[];
  initialTasks: AutomationTask[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("command");
  const [jobs, setJobs] = useState(initialJobs);
  const [profile, setProfile] = useState<Profile>(initialProfile ?? emptyProfile);
  const [searches, setSearches] = useState(initialSearches);
  const [tasks, setTasks] = useState(initialTasks);
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => !["archived", "rejected"].includes(job.state));
    const latestTask = tasks[0];
    const activeTask = tasks.find((task) => ["pending", "claimed", "running", "approved"].includes(task.status));
    const blockedTask = tasks.find((task) => task.status === "blocked" || task.status === "failed");
    return {
      found: jobs.length,
      priority: activeJobs.filter((job) => job.score >= 74).length,
      queued: tasks.filter((task) => ["pending", "claimed", "running", "approved"].includes(task.status)).length,
      approvals: tasks.filter((task) => task.status === "waiting_approval").length,
      submitted: jobs.filter((job) => job.state === "applied").length,
      blocked: tasks.filter((task) => task.status === "blocked" || task.status === "failed").length,
      workerState: activeTask ? "trabajando" : blockedTask ? "necesita atencion" : latestTask ? "listo" : "sin tareas",
      lastTask: latestTask ? `${taskLabels[latestTask.type]} ${latestTask.source || ""}`.trim() : "No hay actividad",
    };
  }, [jobs, tasks]);

  const topJobs = useMemo(() => [...jobs].sort((a, b) => b.score - a.score).slice(0, 8), [jobs]);
  const waitingTasks = useMemo(() => tasks.filter((task) => task.status === "waiting_approval"), [tasks]);

  function refreshTasks() {
    startTransition(async () => {
      setTasks(await api<AutomationTask[]>("/api/tools/jobs/automation/tasks"));
    });
  }

  function refreshJobs() {
    startTransition(async () => {
      setJobs(await api<SwapJob[]>("/api/tools/jobs"));
    });
  }

  function refreshSearches() {
    startTransition(async () => {
      setSearches(await api<SearchPlan[]>("/api/tools/jobs/searches"));
    });
  }

  function deleteSearch(searchId: string) {
    if (!window.confirm("Quieres borrar esta busqueda guardada?")) return;

    startTransition(async () => {
      await api<{ ok: boolean }>(`/api/tools/jobs/searches/${searchId}`, {
        method: "DELETE",
      });
      setSearches((current) => current.filter((search) => search.id !== searchId));
      setNotice("Busqueda borrada.");
    });
  }

  function createTask(payload: {
    type: TaskType;
    source?: string | null;
    jobId?: string | null;
    priority?: number;
    payload?: Record<string, unknown>;
  }) {
    startTransition(async () => {
      const task = await api<AutomationTask>("/api/tools/jobs/automation/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTasks((current) => [task, ...current]);
      setNotice("Tarea en cola. El worker local la procesara en segundo plano.");
    });
  }

  function approveTask(taskId: string) {
    startTransition(async () => {
      const updated = await api<AutomationTask>(`/api/tools/jobs/automation/tasks/${taskId}/approve`, {
        method: "POST",
        body: "{}",
      });
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      setNotice("Aprobada. El worker podra enviar cuando vuelva a consultar la cola.");
    });
  }

  function retryTask(taskId: string) {
    startTransition(async () => {
      const updated = await api<AutomationTask>(`/api/tools/jobs/automation/tasks/${taskId}/retry`, {
        method: "POST",
        body: "{}",
      });
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      setNotice("Tarea reintentada. El worker la cogera cuando vuelva a consultar la cola.");
    });
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: Profile = {
      ...profile,
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      location: String(formData.get("location") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? "") || null,
      portfolioUrl: String(formData.get("portfolioUrl") ?? "") || null,
      cvEsUrl: String(formData.get("cvEsUrl") ?? ""),
      cvEnUrl: String(formData.get("cvEnUrl") ?? ""),
      cvText: String(formData.get("cvText") ?? ""),
      targetRoles: textToList(formData.get("targetRoles")),
      targetLocations: textToList(formData.get("targetLocations")),
      languages: textToList(formData.get("languages")),
      salaryMin: formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null,
      mustHave: textToList(formData.get("mustHave")),
      rejectTerms: textToList(formData.get("rejectTerms")),
      preferredCompanies: textToList(formData.get("preferredCompanies")),
      blockedCompanies: textToList(formData.get("blockedCompanies")),
      applicationFields: jsonRecordFromTextarea(formData.get("applicationFields")),
    };
    startTransition(async () => {
      const saved = await api<Profile>("/api/tools/jobs/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setProfile(saved);
      setNotice("Perfil guardado. Las proximas ofertas usaran estas reglas.");
    });
  }

  function addSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const payload = {
      source: formData.get("source"),
      query: formData.get("query"),
      location: formData.get("location"),
      modality: formData.get("modality"),
      cadenceMinutes: Number(formData.get("cadenceMinutes") || 1440),
      enabled: true,
    };
    startTransition(async () => {
      const saved = await api<SearchPlan>("/api/tools/jobs/searches", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSearches((current) => [saved, ...current]);
      form.reset();
      setNotice("Busqueda guardada.");
    });
  }

  return (
    <div className={styles.swapJobs}>
      <nav className={styles.productTabs} aria-label="SwapJobs sections">
        {[
          ["command", "Panel"],
          ["profile", "Perfil"],
          ["searches", "Busquedas"],
          ["jobs", "Ofertas"],
          ["automation", "Cola"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(id as Tab)}
          >
            {label}
          </button>
        ))}
      </nav>

      {notice && <p className={styles.notice}>{notice}</p>}

      {activeTab === "command" && (
        <section className={styles.command}>
          <div className={styles.commandHero}>
            <div>
              <p className={styles.kicker}>Estado operativo</p>
              <h2>Worker {stats.workerState}</h2>
              <p>{stats.lastTask}. Si aparece una verificacion, resuelvela en la ventana de Chrome del worker.</p>
            </div>
            <div className={styles.heroActions}>
              <button type="button" className={styles.secondaryButton} onClick={refreshTasks}>Actualizar cola</button>
              <button type="button" className={styles.primaryButton} onClick={refreshJobs}>Actualizar ofertas</button>
            </div>
          </div>
          <div className={styles.metrics}>
            <Metric label="Ofertas" value={stats.found} tone="blue" />
            <Metric label="Prioridad" value={stats.priority} tone="green" />
            <Metric label="En cola" value={stats.queued} tone="olive" />
            <Metric label="Aprobar" value={stats.approvals} tone="purple" />
            <Metric label="Enviadas" value={stats.submitted} tone="neutral" />
            <Metric label="Bloqueos" value={stats.blocked} tone="red" />
          </div>

          <div className={styles.dashboardGrid}>
            <Panel title="Pendientes de aprobar">
              {waitingTasks.length ? (
                <div className={styles.compactList}>
                  {waitingTasks.map((task) => (
                    <div key={task.id} className={styles.approvalRow}>
                      <div>
                        <strong>{task.job?.title || taskLabels[task.type]}</strong>
                        <span>{task.job?.company || task.source || "Automation task"}</span>
                      </div>
                      <button type="button" className={styles.primaryButton} onClick={() => approveTask(task.id)}>
                        Aprobar envio
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No hay candidaturas esperando aprobacion final.</p>
              )}
            </Panel>

            <Panel title="Mejores encajes">
              <CompactJobs jobs={topJobs} onApply={(job) => createTask({
                type: "fill_application",
                source: job.source,
                jobId: job.id,
                priority: job.score,
                payload: { url: job.url },
              })} />
            </Panel>
          </div>
        </section>
      )}

      {activeTab === "profile" && (
        <form className={styles.panelWide} onSubmit={saveProfile}>
          <div className={styles.pageHeading}>
            <div>
              <h2>Perfil de candidatura</h2>
              <p>Datos usados para puntuar ofertas y preparar formularios.</p>
            </div>
            <button type="submit" className={styles.primaryButton} disabled={isPending}>Guardar perfil</button>
          </div>
          <div className={styles.formGrid}>
            <TextField label="Full name" name="fullName" defaultValue={profile.fullName} />
            <TextField label="Email" name="email" defaultValue={profile.email} />
            <TextField label="Phone" name="phone" defaultValue={profile.phone} />
            <TextField label="Location" name="location" defaultValue={profile.location} />
            <TextField label="LinkedIn URL" name="linkedinUrl" defaultValue={profile.linkedinUrl ?? ""} />
            <TextField label="Portfolio URL" name="portfolioUrl" defaultValue={profile.portfolioUrl ?? ""} />
            <TextField label="Spanish CV URL" name="cvEsUrl" defaultValue={profile.cvEsUrl} />
            <TextField label="English CV URL" name="cvEnUrl" defaultValue={profile.cvEnUrl} />
            <TextField label="Minimum salary" name="salaryMin" type="number" defaultValue={profile.salaryMin ?? ""} />
            <TextArea label="Target roles" name="targetRoles" defaultValue={listToText(profile.targetRoles)} />
            <TextArea label="Target locations" name="targetLocations" defaultValue={listToText(profile.targetLocations)} />
            <TextArea label="Languages" name="languages" defaultValue={listToText(profile.languages)} />
            <TextArea label="Must-have keywords" name="mustHave" defaultValue={listToText(profile.mustHave)} />
            <TextArea label="Reject keywords" name="rejectTerms" defaultValue={listToText(profile.rejectTerms)} />
            <TextArea label="Preferred companies" name="preferredCompanies" defaultValue={listToText(profile.preferredCompanies)} />
            <TextArea label="Blocked companies" name="blockedCompanies" defaultValue={listToText(profile.blockedCompanies)} />
            <TextArea label="Application fields (key=value)" name="applicationFields" defaultValue={recordToText(profile.applicationFields)} />
            <TextArea label="CV text" name="cvText" defaultValue={profile.cvText ?? ""} large />
          </div>
        </form>
      )}

      {activeTab === "searches" && (
        <section className={styles.jobsGrid}>
          <form className={styles.panel} onSubmit={addSearch}>
            <h2>Nueva busqueda</h2>
            <div className={styles.presetRail} aria-label="Plantillas de busqueda">
              {searchPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={styles.presetButton}
                  onClick={(event) => {
                    const form = event.currentTarget.form;
                    if (!form) return;
                    (form.elements.namedItem("source") as HTMLSelectElement).value = preset.source;
                    (form.elements.namedItem("query") as HTMLInputElement).value = preset.query;
                    (form.elements.namedItem("location") as HTMLInputElement).value = preset.location;
                    (form.elements.namedItem("modality") as HTMLSelectElement).value = preset.modality;
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className={styles.formStack}>
              <label>Portal
                <select name="source" defaultValue="infojobs">
                  <option value="infojobs">InfoJobs</option>
                  <option value="indeed">Indeed</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </label>
              <label>Consulta <input name="query" required defaultValue="Application Support PHP SQL" /></label>
              <label>Ubicacion <input name="location" defaultValue="Spain, Remote, Menorca" /></label>
              <label>Modalidad
                <select name="modality" defaultValue="any">
                  <option value="any">Cualquiera</option>
                  <option value="remote">Remoto</option>
                  <option value="hybrid">Hibrido</option>
                  <option value="onsite">Presencial</option>
                </select>
              </label>
              <label>Cadencia minutos <input name="cadenceMinutes" type="number" min="30" defaultValue="1440" /></label>
              <button type="submit" className={styles.primaryButton}>Guardar busqueda</button>
            </div>
          </form>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Busquedas guardadas</h2>
              <button type="button" className={styles.ghostButton} onClick={refreshSearches}>Actualizar</button>
            </div>
            <div className={styles.compactList}>
              {searches.map((search) => (
                <article key={search.id} className={styles.searchRow}>
                  <div>
                    <strong>{search.query}</strong>
                    <span>{search.source} / {search.location || "anywhere"} / {search.modality}</span>
                    <small>Ultima ejecucion: {dateLabel(search.lastRunAt)}</small>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => createTask({
                        type: "search_source",
                        source: search.source,
                        priority: 60,
                        payload: {
                          searchId: search.id,
                          source: search.source,
                          query: search.query,
                          location: search.location,
                          modality: search.modality,
                        },
                      })}
                    >
                      Ejecutar
                    </button>
                    <button type="button" className={styles.dangerButton} onClick={() => deleteSearch(search.id)}>
                      Borrar
                    </button>
                  </div>
                </article>
              ))}
              {!searches.length && <p className={styles.empty}>Todavia no hay busquedas guardadas.</p>}
            </div>
          </section>
        </section>
      )}

      {activeTab === "jobs" && (
        <section className={styles.panelWide}>
          <div className={styles.pageHeading}>
            <div>
              <h2>Ofertas detectadas</h2>
              <p>{jobs.length} ofertas guardadas. Prioriza por puntuacion y prepara candidaturas desde aqui.</p>
            </div>
            <button type="button" className={styles.ghostButton} onClick={refreshJobs}>Actualizar</button>
          </div>
          <div className={styles.list}>
            {jobs.map((job) => (
              <article key={job.id} className={styles.jobCard}>
                <span className={`${styles.score} ${scoreClass(job.score)}`}>{job.score}</span>
                <div className={styles.jobBody}>
                  <h3>{job.title}</h3>
                  <p className={styles.muted}>{job.company || "Empresa no detectada"} / {job.location || "Sin ubicacion"} / {job.salary || "Sin salario"}</p>
                  <div className={styles.tags}>
                    <span>{job.source}</span>
                    <span>{jobStateLabels[job.state]}</span>
                    <span>{job.automationStatus}</span>
                    <span>{job.recommendedCv}</span>
                    {job.technologies?.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
                  </div>
                  {latestApplication(job) ? (
                    <p className={styles.jobNote}>
                      Candidatura {latestApplication(job)?.status}
                      {latestApplication(job)?.submittedAt ? ` / enviada ${dateLabel(latestApplication(job)?.submittedAt)}` : ""}
                    </p>
                  ) : null}
                  {job.riskFlags?.length ? <p className={styles.risk}>{job.riskFlags[0]}</p> : null}
                </div>
                <div className={styles.jobActions}>
                  {job.url && <a className={styles.textLink} href={job.url} target="_blank" rel="noreferrer">Abrir</a>}
                  {applicationUrl(job) && (
                    <a className={styles.secondaryButton} href={applicationUrl(job) ?? ""} target="_blank" rel="noreferrer">
                      Ver candidatura
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => createTask({
                      type: "fill_application",
                      source: job.source,
                      jobId: job.id,
                      priority: job.score,
                      payload: { url: job.url },
                    })}
                  >
                    Preparar
                  </button>
                </div>
              </article>
            ))}
            {!jobs.length && <p className={styles.empty}>No hay ofertas todavia. Ejecuta una busqueda desde la pestaña Busquedas.</p>}
          </div>
        </section>
      )}

      {activeTab === "automation" && (
        <section className={styles.panelWide}>
          <div className={styles.pageHeading}>
            <div>
              <h2>Cola de automatizacion</h2>
              <p>Tareas del worker local, aprobaciones y bloqueos por login/verificacion.</p>
            </div>
            <button type="button" className={styles.ghostButton} onClick={refreshTasks}>Actualizar</button>
          </div>
          <div className={styles.list}>
            {tasks.map((task) => (
              <article key={task.id} className={styles.taskRow}>
                <div className={styles.taskMain}>
                  <span className={`${styles.statusPill} ${styles[task.status]}`}>{statusLabels[task.status]}</span>
                  <strong>{taskLabels[task.type]} {task.job ? `- ${task.job.title}` : ""}</strong>
                  <small>{task.source || "worker"} / {dateLabel(task.createdAt)}</small>
                  {taskResultUrl(task) && (
                    <a className={styles.textLink} href={taskResultUrl(task) ?? ""} target="_blank" rel="noreferrer">
                      Ver candidatura enviada
                    </a>
                  )}
                  {task.error && <p className={styles.risk}>{task.error}</p>}
                  {task.logs?.map((log) => (
                    <p key={log.id} className={styles.jobNote}>{dateLabel(log.createdAt)} / {log.message}</p>
                  ))}
                </div>
                {task.status === "waiting_approval" && (
                  <button type="button" className={styles.primaryButton} onClick={() => approveTask(task.id)}>
                    Aprobar envio
                  </button>
                )}
                {["failed", "blocked", "cancelled"].includes(task.status) && (
                  <button type="button" className={styles.secondaryButton} onClick={() => retryTask(task.id)}>
                    Reintentar
                  </button>
                )}
              </article>
            ))}
            {!tasks.length && <p className={styles.empty}>No hay tareas todavia.</p>}
          </div>
        </section>
      )}
    </div>
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

function CompactJobs({ jobs, onApply }: { jobs: SwapJob[]; onApply: (job: SwapJob) => void }) {
  if (!jobs.length) return <p className={styles.empty}>Todavia no hay ofertas. Ejecuta una busqueda para llenar el panel.</p>;
  return (
    <div className={styles.compactList}>
      {jobs.map((job) => (
        <div key={job.id} className={styles.compactJob}>
          <span className={`${styles.scoreChip} ${scoreClass(job.score)}`}>{job.score}</span>
          <span>
            <strong>{job.title}</strong>
            <small>{job.company || "Empresa no detectada"}</small>
          </span>
          <button type="button" className={styles.ghostButton} onClick={() => onApply(job)}>Preparar</button>
        </div>
      ))}
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  large,
}: {
  label: string;
  name: string;
  defaultValue: string;
  large?: boolean;
}) {
  return (
    <label className={large ? styles.fullField : undefined}>
      {label}
      <textarea name={name} rows={large ? 8 : 4} defaultValue={defaultValue} />
    </label>
  );
}
