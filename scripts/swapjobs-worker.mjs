import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(fileName) {
  const filePath = path.join(rootDir, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const apiBase =
  process.env.SWAPJOBS_API_BASE ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_BASE_URL ||
  "https://swap.com.es";
const workerToken = process.env.SWAPJOBS_WORKER_TOKEN;
const workerId = process.env.SWAPJOBS_WORKER_ID || `local-${process.env.COMPUTERNAME || "worker"}`;
const userDataDir = process.env.SWAPJOBS_BROWSER_PROFILE || path.join(rootDir, ".data", "swapjobs-browser");
const pollMs = Number(process.env.SWAPJOBS_POLL_MS || 15000);
const blockedPauseMs = Number(process.env.SWAPJOBS_BLOCKED_PAUSE_MS || 600000);
const browserChannel = process.env.SWAPJOBS_BROWSER_CHANNEL?.trim() || undefined;

if (!workerToken) {
  console.error("SWAPJOBS_WORKER_TOKEN is required.");
  process.exit(1);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.error("Playwright is not installed. Run: npm.cmd install && npx playwright install chromium");
    process.exit(1);
  }
}

function endpoint(pathname) {
  return `${apiBase.replace(/\/$/, "")}${pathname}`;
}

async function api(pathname, init = {}) {
  const response = await fetch(endpoint(pathname), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
      "X-SwapJobs-Worker": workerId,
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
}

async function updateTask(taskId, payload) {
  return api(`/api/tools/jobs/automation/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function saveJob(taskId, job) {
  return api("/api/tools/jobs/automation/jobs", {
    method: "POST",
    body: JSON.stringify({ taskId, ...job }),
  });
}

async function saveApplication(taskId, application) {
  return api("/api/tools/jobs/automation/applications", {
    method: "POST",
    body: JSON.stringify({ taskId, ...application }),
  });
}

function searchUrl(payload) {
  const query = encodeURIComponent(payload.query || "");
  const location = encodeURIComponent(payload.location || "");
  if (payload.source === "linkedin") {
    return `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;
  }
  if (payload.source === "indeed") {
    return `https://es.indeed.com/jobs?q=${query}&l=${location}`;
  }
  return `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${query}&provinceIds=&cityIds=&categoryIds=&workdayIds=&educationIds=&segmentId=&contractTypeIds=`;
}

function looksBlocked(url, text) {
  return /captcha|checkpoint|challenge|unusual activity|verify|verification|sign in|iniciar sesi[oó]n|login|robot|eres humano|accede como candidato/i.test(`${url}\n${text}`);
}

async function waitForManualUnblock(page, label, taskId) {
  if (!blockedPauseMs) return false;

  await page.bringToFront().catch(() => {});
  console.log(`${label} needs manual login or robot verification. Waiting ${Math.round(blockedPauseMs / 1000)}s...`);
  if (taskId) {
    await updateTask(taskId, {
      status: "running",
      log: `${label} waiting for manual login or robot verification`,
    }).catch(() => {});
  }

  const deadline = Date.now() + blockedPauseMs;
  while (Date.now() < deadline) {
    await page.waitForTimeout(5000);
    const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
    if (!looksBlocked(page.url(), bodyText)) {
      console.log(`${label} verification cleared. Continuing.`);
      return true;
    }
  }

  return false;
}

async function extractListings(page, source) {
  return page.evaluate((jobSource) => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    return anchors
      .map((anchor) => {
        const href = anchor.href;
        const title = (anchor.textContent || "").replace(/\s+/g, " ").trim();
        return { href, title };
      })
      .filter((item) => item.title.length > 8)
      .filter((item) => {
        if (jobSource === "linkedin") return item.href.includes("/jobs/view/");
        if (jobSource === "indeed") return item.href.includes("/viewjob") || item.href.includes("/rc/clk");
        if (jobSource === "infojobs") return item.href.includes("infojobs.net") && /\/of-[a-z0-9]/i.test(new URL(item.href).pathname);
        return false;
      })
      .slice(0, 12);
  }, source);
}

async function extractJobDetail(context, listing, source) {
  const page = await context.newPage();
  try {
    await page.goto(listing.href, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1800);
    const data = await page.evaluate(() => {
      const text = document.body.innerText.replace(/\n{3,}/g, "\n\n").trim();
      const h1 = document.querySelector("h1")?.textContent?.trim() || "";
      const company =
        document.querySelector("[data-testid*='company'], .company, .job-company, a[href*='company']")?.textContent?.trim() ||
        "";
      const location =
        document.querySelector("[data-testid*='location'], .location, .job-location")?.textContent?.trim() ||
        "";
      return { h1, company, location, text };
    });
    return {
      title: data.h1 || listing.title,
      company: data.company || null,
      location: data.location || null,
      source,
      url: page.url(),
      description: data.text.slice(0, 12000),
      modality: /remote|remoto|teletrabajo/i.test(data.text) ? "remote" : /hybrid|hibrido/i.test(data.text) ? "hybrid" : "any",
      salary: data.text.match(/\d{2,3}[\.,]?\d{3}\s*[-–]\s*\d{2,3}[\.,]?\d{3}\s*(?:€|eur)?/i)?.[0] || null,
    };
  } finally {
    await page.close();
  }
}

async function runSearch(context, task) {
  const payload = task.payload || {};
  const source = payload.source || task.source;
  const page = await context.newPage();
  await updateTask(task.id, { status: "running", log: `Opening ${source} search` });
  try {
    await page.goto(searchUrl({ ...payload, source }), { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
    if (looksBlocked(page.url(), bodyText)) {
      const unblocked = await waitForManualUnblock(page, `${source} search`, task.id);
      if (unblocked) {
        await updateTask(task.id, { status: "running", log: "Manual verification cleared" });
      } else {
      await updateTask(task.id, { status: "blocked", error: "Login, verification, or CAPTCHA required.", log: "Search blocked by platform" });
      return;
      }
    }
    const listings = await extractListings(page, source);
    let saved = 0;
    for (const listing of listings) {
      const detail = await extractJobDetail(context, listing, source);
      await saveJob(task.id, detail);
      saved += 1;
    }
    await updateTask(task.id, {
      status: "completed",
      result: { found: listings.length, saved },
      log: `Search completed: ${saved} jobs saved`,
    });
  } finally {
    await page.close();
  }
}

function profileValue(profile, key) {
  return profile?.applicationFields?.[key] || profile?.[key] || "";
}

async function fillKnownFields(page, profile) {
  const fieldMap = [
    ["email", profileValue(profile, "email")],
    ["phone", profileValue(profile, "phone")],
    ["tel", profileValue(profile, "phone")],
    ["name", profileValue(profile, "fullName")],
    ["nombre", profileValue(profile, "fullName")],
    ["linkedin", profileValue(profile, "linkedinUrl")],
    ["portfolio", profileValue(profile, "portfolioUrl")],
    ["salary", profileValue(profile, "salaryExpectation")],
    ["notice", profileValue(profile, "noticePeriod")],
  ];
  for (const [needle, value] of fieldMap) {
    if (!value) continue;
    const selector = `input[name*="${needle}" i], input[id*="${needle}" i], textarea[name*="${needle}" i], textarea[id*="${needle}" i]`;
    const fields = await page.locator(selector).all().catch(() => []);
    for (const field of fields.slice(0, 3)) {
      if (await field.isVisible().catch(() => false)) {
        await field.fill(String(value)).catch(() => {});
      }
    }
  }
}

async function clickApply(page) {
  const applyButton = page.getByRole("button", { name: /apply|solicitar|inscribirme|candidatura|postular/i }).first();
  if (await applyButton.isVisible().catch(() => false)) {
    await applyButton.click();
    return true;
  }
  const applyLink = page.getByRole("link", { name: /apply|solicitar|inscribirme|candidatura|postular/i }).first();
  if (await applyLink.isVisible().catch(() => false)) {
    await applyLink.click();
    return true;
  }
  return false;
}

async function clickFinalSubmit(page) {
  const submitButton = page.getByRole("button", { name: /submit|send|enviar|finalizar|confirmar|inscribirme|postular/i }).last();
  if (await submitButton.isVisible().catch(() => false)) {
    await submitButton.click();
    return true;
  }
  return false;
}

async function runApplication(context, task, profile, approvedForSubmit) {
  const job = task.job;
  const targetUrl = task.payload?.url || job?.url;
  if (!job?.id || !targetUrl) {
    await updateTask(task.id, { status: "failed", error: "Task has no job URL.", log: "Missing job URL" });
    return;
  }

  const page = await context.newPage();
  await updateTask(task.id, { status: "running", log: `Opening application for ${job.title}` });
  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1800);
    const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
    if (looksBlocked(page.url(), bodyText)) {
      const unblocked = await waitForManualUnblock(page, `${job.title} application`, task.id);
      if (unblocked) {
        await updateTask(task.id, { status: "running", log: "Manual verification cleared" });
      } else {
      await saveApplication(task.id, {
        jobId: job.id,
        status: "blocked",
        source: job.source,
        sourceUrl: targetUrl,
        blockedReason: "Login, verification, or CAPTCHA required.",
      });
      await updateTask(task.id, { status: "blocked", error: "Login, verification, or CAPTCHA required.", log: "Application blocked by platform" });
      return;
      }
    }

    if (!approvedForSubmit) {
      await clickApply(page);
      await page.waitForTimeout(1200);
      await fillKnownFields(page, profile);
      await saveApplication(task.id, {
        jobId: job.id,
        status: "waiting_approval",
        source: job.source,
        sourceUrl: page.url(),
        formFields: [],
        preparedAnswers: profile?.applicationFields || {},
      });
      await updateTask(task.id, {
        status: "waiting_approval",
        result: { url: page.url() },
        log: "Application filled and waiting for dashboard approval",
      });
      return;
    }

    const submitted = await clickFinalSubmit(page);
    if (!submitted) {
      await updateTask(task.id, { status: "blocked", error: "Final submit button not found.", log: "Could not submit application" });
      return;
    }
    await page.waitForTimeout(2500);
    await saveApplication(task.id, {
      jobId: job.id,
      status: "submitted",
      source: job.source,
      sourceUrl: page.url(),
      formFields: [],
      preparedAnswers: profile?.applicationFields || {},
    });
    await updateTask(task.id, {
      status: "completed",
      result: { submittedUrl: page.url() },
      log: "Application submitted",
    });
  } finally {
    await page.close();
  }
}

async function processTask(context, item) {
  const { task, profile, approvedForSubmit } = item;
  if (!task) return false;
  try {
    if (task.type === "search_source") {
      await runSearch(context, task);
    } else if (task.type === "fill_application" || task.type === "final_submit") {
      await runApplication(context, task, profile, approvedForSubmit || task.type === "final_submit");
    } else {
      await updateTask(task.id, { status: "blocked", error: `Unsupported task type ${task.type}` });
    }
  } catch (error) {
    await updateTask(task.id, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      log: "Worker task failed",
      level: "error",
    }).catch(() => {});
  }
  return true;
}

async function launchWorkerContext(chromium) {
  const state = {
    context: await chromium.launchPersistentContext(userDataDir, {
      ...(browserChannel ? { channel: browserChannel } : {}),
      headless: process.env.SWAPJOBS_HEADLESS === "1",
      viewport: { width: 1366, height: 900 },
    }),
    closed: false,
  };

  state.context.on("close", () => {
    state.closed = true;
    console.error("Worker browser was closed. A new browser will open before the next task.");
  });

  console.log(`SwapJobs worker ${workerId} connected to ${apiBase}`);
  console.log(`Browser profile: ${userDataDir}`);

  const statusPage = state.context.pages()[0] || await state.context.newPage();
  await statusPage
    .setContent(`
      <style>
        body { font-family: system-ui, sans-serif; margin: 48px; color: #102033; }
        code { background: #eef3f8; border-radius: 4px; padding: 2px 6px; }
      </style>
      <h1>SwapJobs worker is ready</h1>
      <p>This browser is controlled by the local SwapJobs worker.</p>
      <p>When a job site asks for login or robot verification, complete it here.</p>
      <p>Connected to <code>${apiBase}</code>.</p>
    `)
    .catch(() => {});

  return state;
}

async function main() {
  const { chromium } = await loadPlaywright();
  let workerContext = await launchWorkerContext(chromium);

  process.on("SIGINT", async () => {
    await workerContext.context.close().catch(() => {});
    process.exit(0);
  });

  while (true) {
    try {
      if (workerContext.closed) {
        workerContext = await launchWorkerContext(chromium);
      }
      const item = await api("/api/tools/jobs/automation/tasks/next");
      if (!(await processTask(workerContext.context, item))) {
        await new Promise((resolve) => setTimeout(resolve, pollMs));
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
