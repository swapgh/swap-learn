import "server-only";

import { readJson, writeJson } from "./storage";

type PageView = {
  path: string;
  locale: string;
  timestamp: string;
};

type AuthEvent = {
  action: string;
  userId: string;
  timestamp: string;
};

export async function logPageView(path: string, locale: string) {
  const views = (await readJson<PageView[]>("analytics/pageviews.json")) ?? [];
  views.push({ path, locale, timestamp: new Date().toISOString() });
  await writeJson("analytics/pageviews.json", views.slice(-1000));
}

export async function logAuthEvent(action: string, userId: string) {
  const events = (await readJson<AuthEvent[]>("analytics/events.json")) ?? [];
  events.push({ action, userId, timestamp: new Date().toISOString() });
  await writeJson("analytics/events.json", events.slice(-1000));
}
