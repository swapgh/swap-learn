export type SwapJobProfileInput = {
  targetRoles?: unknown;
  targetLocations?: unknown;
  languages?: unknown;
  salaryMin?: number | null;
  mustHave?: unknown;
  rejectTerms?: unknown;
  preferredCompanies?: unknown;
  blockedCompanies?: unknown;
};

export type SwapJobInput = {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  url?: string | null;
  salary?: string | null;
  description?: string | null;
  modality?: string | null;
};

export type SwapJobScore = {
  score: number;
  fitScore: number;
  viabilityScore: number;
  qualityScore: number;
  timingScore: number;
  positiveFlags: string[];
  riskFlags: string[];
  action: string;
  recommendedCv: string;
  technologies: string[];
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function buildDuplicateKey(job: SwapJobInput) {
  const normalizedUrl = job.url || job.description?.match(/https?:\/\/\S+/)?.[0] || "";
  if (normalizedUrl) return normalizeSearchText(normalizedUrl).replace(/[#?].*$/, "");
  return normalizeSearchText(`${job.title ?? ""}|${job.company ?? ""}|${job.location ?? ""}`)
    .replace(/[^a-z0-9|]+/g, "-")
    .slice(0, 240);
}

function detectTechnologies(text: string) {
  const techMap: Array<[string, RegExp]> = [
    ["php", /\bphp\b/],
    ["mysql", /\bmysql\b/],
    ["postgres", /\bpostgres(?:ql)?\b/],
    ["sql", /\bsql\b/],
    ["react", /\breact\b|reactjs/],
    ["typescript", /\btypescript\b|\btsx\b/],
    ["next.js", /\bnext\.?js\b/],
    ["javascript", /\bjavascript\b|\bjs\b/],
    ["node.js", /\bnode\.?js\b/],
    ["java", /\bjava\b/],
    ["python", /\bpython\b/],
    ["linux", /\blinux\b/],
    ["docker", /\bdocker\b/],
    ["aws", /\baws\b|amazon web services/],
    ["azure", /\bazure\b/],
  ];
  return techMap.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function parseSalaryMin(value: string | null | undefined) {
  if (!value) return null;
  const numbers = value.match(/\d{2,3}(?:[\.,]?\d{3})?/g);
  if (!numbers?.length) return null;
  return Math.min(...numbers.map((item) => Number(item.replace(/[^\d]/g, ""))).filter(Boolean));
}

function containsAny(text: string, items: string[]) {
  return items.some((item) => item && text.includes(normalizeSearchText(item)));
}

export function scoreSwapJob(job: SwapJobInput, profile?: SwapJobProfileInput | null): SwapJobScore {
  const haystack = normalizeSearchText(
    `${job.title ?? ""}\n${job.company ?? ""}\n${job.location ?? ""}\n${job.salary ?? ""}\n${job.description ?? ""}`
  );
  const targetRoles = asStringArray(profile?.targetRoles);
  const targetLocations = asStringArray(profile?.targetLocations);
  const languages = asStringArray(profile?.languages);
  const mustHave = asStringArray(profile?.mustHave);
  const rejectTerms = asStringArray(profile?.rejectTerms);
  const preferredCompanies = asStringArray(profile?.preferredCompanies);
  const blockedCompanies = asStringArray(profile?.blockedCompanies);
  const positiveFlags: string[] = [];
  const riskFlags: string[] = [];
  const technologies = detectTechnologies(haystack);

  let fitScore = 42;
  if (targetRoles.length && containsAny(haystack, targetRoles)) {
    fitScore += 24;
    positiveFlags.push("Matches target role");
  }
  if (mustHave.length) {
    const matchedMustHave = mustHave.filter((item) => haystack.includes(normalizeSearchText(item)));
    fitScore += Math.min(24, matchedMustHave.length * 8);
    matchedMustHave.slice(0, 3).forEach((item) => positiveFlags.push(`Must-have: ${item}`));
    const missing = mustHave.filter((item) => !haystack.includes(normalizeSearchText(item)));
    if (missing.length === mustHave.length) {
      fitScore -= 14;
      riskFlags.push("No must-have keywords found");
    }
  }
  if (technologies.length) {
    fitScore += Math.min(18, technologies.length * 4);
    positiveFlags.push(`Stack: ${technologies.slice(0, 4).join(", ")}`);
  }
  if (/junior|jr\.?|entry|soporte|support|helpdesk|application support|tecnico/.test(haystack)) {
    fitScore += 12;
    positiveFlags.push("Seniority looks realistic");
  }
  if (/senior|lead|principal|staff|head of|manager/.test(haystack)) {
    fitScore -= 22;
    riskFlags.push("May require senior profile");
  }
  if (containsAny(haystack, rejectTerms)) {
    fitScore -= 30;
    riskFlags.push("Reject term matched");
  }
  if (containsAny(normalizeSearchText(job.company ?? ""), blockedCompanies)) {
    fitScore -= 50;
    riskFlags.push("Blocked company");
  }
  if (containsAny(normalizeSearchText(job.company ?? ""), preferredCompanies)) {
    fitScore += 12;
    positiveFlags.push("Preferred company");
  }

  const modality = normalizeSearchText(job.modality ?? "");
  const locationText = normalizeSearchText(job.location ?? "");
  let viabilityScore = 55;
  if (/remote|remoto|teletrabajo|full.?remote/.test(`${haystack} ${modality}`)) {
    viabilityScore = 88;
    positiveFlags.push("Remote-friendly");
  } else if (/hybrid|hibrido/.test(`${haystack} ${modality}`)) {
    viabilityScore = 74;
    positiveFlags.push("Hybrid role");
  }
  if (targetLocations.length && containsAny(`${haystack} ${locationText}`, targetLocations)) {
    viabilityScore += 10;
    positiveFlags.push("Location match");
  }

  const salaryMin = parseSalaryMin(job.salary);
  let qualityScore = 35;
  if ((job.description ?? "").length > 700) qualityScore += 22;
  if (salaryMin) qualityScore += 18;
  if (job.company) qualityScore += 10;
  if (job.location) qualityScore += 8;
  if ((profile?.salaryMin ?? null) && salaryMin && salaryMin < Number(profile?.salaryMin)) {
    qualityScore -= 20;
    riskFlags.push("Salary below minimum");
  }
  if (!salaryMin) riskFlags.push("Salary not detected");

  const missingLanguages = languages.filter((language) => {
    const normalized = normalizeSearchText(language);
    return /(english|ingles|c1|c2|fluent|required|imprescindible)/.test(haystack) && !haystack.includes(normalized);
  });
  if (missingLanguages.length) {
    fitScore -= 10;
    riskFlags.push("Check language requirement");
  }

  const timingScore = /urgente|immediate|incorporacion inmediata/.test(haystack) ? 62 : 74;
  const score = Math.max(
    0,
    Math.min(100, Math.round(fitScore * 0.45 + viabilityScore * 0.3 + qualityScore * 0.15 + timingScore * 0.1))
  );

  return {
    score,
    fitScore: Math.max(0, Math.min(100, fitScore)),
    viabilityScore: Math.max(0, Math.min(100, viabilityScore)),
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    timingScore,
    positiveFlags,
    riskFlags,
    technologies,
    action: score >= 74 ? "apply" : score >= 54 ? "review" : "skip",
    recommendedCv: /english|international|global|remote eu|europe/.test(haystack) ? "CV Ingles" : "CV Espanol",
  };
}
