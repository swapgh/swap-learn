# Swap web

Next.js app for `swap.com.es`, deployed on dinahosting with Passenger.

## Development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
npm run start
```

## Private tools

The account area includes two admin-only tools:

- `SwapJobs`: `/account/tools/jobs`
- `SwapDocs`: `/account/tools/docs`

Both are protected by `ADMIN_EMAIL_ALLOWLIST`. Users not included in that comma-separated list cannot see the links and cannot access the routes directly.

The tools use PostgreSQL through Prisma:

```bash
npm run db:generate
npm run db:push
```

Current implementation status:

- SwapJobs: private automation dashboard, profile rules, source searches, deterministic scoring, PostgreSQL job pipeline, worker task queue, Playwright local worker integration, approval-before-submit flow, and blocked-state logging.
- SwapDocs: 3-step visible dashboard forms, compact stats, search, service presets connected to PERT/cost defaults, editable/deletable client/project detail pages, proforma view/edit modes, line-item editing, PERT/cost templates inside proforma edit, direct proforma delete actions, work tracking in project detail, printable proforma detail pages, and protected PDF download.
- Pending for later: storing generated PDF files, a full template manager UI, and deeper edit/delete flows for individual estimation/cost/work rows.

## Dinahosting deployment

Production runs from the Passenger app root configured in the hosting panel.
In the examples below, set this variable first:

```bash
export APP_DIR=/path/to/live/app
```

Dinahosting serves that directory through Apache/Passenger. Passenger starts
`server.js`, so the app must not hard-code a public port. `server.js` uses
`process.env.PORT` when Passenger provides it, otherwise port `0`.

Do not deploy into nested accidental copies. Use the public app root configured
in Passenger.

### Normal deploy checklist

There are two places where you run commands:

- Local project folder on your computer.
- Server live app folder after SSH: `$APP_DIR`.

1. On your local computer, run Git and the local build from the project folder:

```bash
cd /path/to/local/project
git status
npm run build
git add .
git commit -m "Update app"
git push
```

Use `git add` for whatever files you changed. `README.md` is only an example.

2. Then connect to Dinahosting and run the server commands from the live app folder:

```bash
ssh USER@HOST
cd "$APP_DIR"
git status --short --branch
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run passenger:restart
```

Verify the public site:

```bash
curl -I https://swap.com.es/api/health
curl -I https://swap.com.es
curl -I https://swap.com.es/es/account/health/profile
```

Expected results:

- `/api/health` returns `HTTP 200`
- `/` redirects to `/es`
- `/es/account/health/profile` redirects to login when logged out, not `404`

If `/es/account/health/profile` returns `404`, Passenger is still serving an
old build or the live folder is not the repository version you just pushed.
Check this on the server:

```bash
cd "$APP_DIR"
git rev-parse --short HEAD
git log -1 --oneline
ls src/app/\[locale\]/account/health
ls .next/server/app/\[locale\]/account/health 2>/dev/null || true
```

The source folder must exist before `npm run build`; the `.next` folder must
exist after the build. If the source folder is missing, you are in the wrong
directory or `git pull` did not bring the latest commit.

### Quick rebuild without code changes

If the server already has the latest commit and you only need to rebuild or
restart Passenger:

```bash
cd "$APP_DIR"
npx prisma generate
npx prisma migrate deploy
npm run build
npm run passenger:restart
```

`npm run passenger:restart` creates or touches `tmp/restart.txt`, which tells
Passenger to reload the app.

### Server cleanup notes

Keep these paths:

- live app root configured in Passenger.
- runtime JSON data directory.
- production `.env`.
- `.htaccess` with private-file blocks.
- hosting-managed public metadata, such as `.well-known`.

Old backups or accidental copies can be removed only after the live app builds
and `https://swap.com.es/api/health` returns `HTTP 200`.

Runtime JSON data is stored outside the app directory by default:

```text
../.data/swap-web-next
```

Set `SWAP_DATA_DIR` to override that path.

Optional public environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://swap.com.es
NEXT_PUBLIC_GOOGLE_TAG_ID=G-L611GK6Y4T
NEXT_PUBLIC_COOKIE_CONSENT_VERSION=2026-04-14-ga4-v1
AUTH_BASE_URL=https://swap.com.es
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_TTL_HOURS=8
SWAP_DATA_DIR=/path/to/private/runtime-data
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
ADMIN_EMAIL_ALLOWLIST=you@example.com,other-admin@example.com
SWAPJOBS_WORKER_TOKEN=long-random-token-used-by-local-worker
SWAPJOBS_API_BASE=https://swap.com.es
SWAPJOBS_BROWSER_PROFILE=.data/swapjobs-browser
SWAPJOBS_BROWSER_CHANNEL=
SWAPJOBS_HEADLESS=0
SWAPJOBS_POLL_MS=15000
```

### SwapJobs local worker

The web app runs on Dinahosting, but the browser automation runs from a local
machine so it can reuse a real logged-in Chrome profile for InfoJobs, Indeed,
and LinkedIn.

Install the worker dependency and browser once:

```bash
npm ci
npm run swapjobs:worker:install
```

Start the worker from the project folder:

```bash
set SWAPJOBS_API_BASE=https://swap.com.es
set SWAPJOBS_WORKER_TOKEN=the-same-token-as-production-env
npm run swapjobs:worker
```

In local development, put the same worker values in `.env.local` and restart
`npm run dev`; the worker script also reads `.env.local`:

```text
SWAPJOBS_WORKER_TOKEN=the-same-token-used-by-next
SWAPJOBS_API_BASE=http://localhost:3000
SWAPJOBS_BROWSER_PROFILE=.data/swapjobs-browser
SWAPJOBS_HEADLESS=0
SWAPJOBS_BLOCKED_PAUSE_MS=600000
```

The first run opens Chrome with the profile stored in `.data/swapjobs-browser`.
Log into job platforms manually in that browser. The worker does not store
platform passwords, does not bypass CAPTCHA, and pauses before final submit
until a task is approved from the SwapJobs dashboard.
If a platform shows a robot/login check, the worker keeps the browser open for
`SWAPJOBS_BLOCKED_PAUSE_MS` so you can clear it manually.

If the app root must stay inside a public web directory, keep Apache rules in `.htaccess` blocking direct access to source, config, `.git`, `.env`, `tmp`, `node_modules`, and `.next/server`.

Check public exposure from your local machine:

```bash
DEPLOY_URL=https://swap.com.es npm run security:check-public
```
