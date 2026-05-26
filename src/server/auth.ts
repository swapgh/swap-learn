import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { readJson, writeJson } from "./storage";
import { authConfig } from "@/server/config/auth.config";

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  authProvider?: "password" | "google";
  providerId?: string;
  createdAt: string;
};

export type SessionToken = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(derived));
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function getExpiresAt(): string {
  return new Date(Date.now() + authConfig.sessionTtlMs).toISOString();
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

export async function getUsers(): Promise<StoredUser[]> {
  return (await readJson<StoredUser[]>("auth/users.json")) ?? [];
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await writeJson("auth/users.json", users);
}

export async function getSessions(): Promise<SessionToken[]> {
  return (await readJson<SessionToken[]>("auth/tokens.json")) ?? [];
}

async function saveSessions(sessions: SessionToken[]): Promise<void> {
  await writeJson("auth/tokens.json", sessions);
}

export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<StoredUser> {
  const users = await getUsers();

  if (users.find((u) => u.username === username)) {
    throw new Error("USERNAME_TAKEN");
  }
  if (users.find((u) => u.email === email)) {
    throw new Error("EMAIL_TAKEN");
  }

  const user: StoredUser = {
    id: randomBytes(16).toString("hex"),
    username,
    email,
    passwordHash: hashPassword(password),
    authProvider: "password",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  return user;
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<StoredUser | null> {
  const users = await getUsers();
  const user = users.find(
    (u) => u.username === identifier || u.email === identifier
  );

  if (!user) return null;
  if (!user.passwordHash) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  return user;
}

function normalizeUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, authConfig.usernameMaxLength);
}

function oauthUsername(email: string, name: string, users: StoredUser[]) {
  const [emailName] = email.split("@");
  const base =
    normalizeUsername(name) ||
    normalizeUsername(emailName) ||
    `user-${randomBytes(4).toString("hex")}`;

  let candidate = base.slice(0, authConfig.usernameMaxLength);
  let suffix = 1;

  while (users.some((user) => user.username === candidate)) {
    const ending = `-${suffix++}`;
    candidate = `${base.slice(0, authConfig.usernameMaxLength - ending.length)}${ending}`;
  }

  return candidate;
}

export async function findOrCreateOAuthUser({
  provider,
  providerId,
  email,
  name,
}: {
  provider: "google";
  providerId: string;
  email: string;
  name: string;
}): Promise<StoredUser> {
  const users = await getUsers();
  const existing = users.find(
    (user) =>
      user.email === email ||
      (user.authProvider === provider && user.providerId === providerId)
  );

  if (existing) {
    existing.authProvider = existing.authProvider ?? provider;
    existing.providerId = existing.providerId ?? providerId;
    await saveUsers(users);
    return existing;
  }

  const user: StoredUser = {
    id: randomBytes(16).toString("hex"),
    username: oauthUsername(email, name, users),
    email,
    authProvider: provider,
    providerId,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const sessions = await getSessions();
  const token = generateToken();

  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: getExpiresAt(),
  });

  await saveSessions(sessions);
  return token;
}

export async function getSessionUser(
  token: string
): Promise<StoredUser | null> {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.token === token);

  if (!session) return null;
  if (isExpired(session.expiresAt)) return null;

  const users = await getUsers();
  return users.find((u) => u.id === session.userId) ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((s) => s.token !== token));
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((s) => s.userId !== userId));
}

export async function getAuthUser(): Promise<StoredUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(authConfig.cookieName)?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function getApiAuthUser(
  request: Request
): Promise<StoredUser | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await getSessionUser(token);
    if (user) return user;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(authConfig.cookieName)?.value;
  if (!token) return null;
  return getSessionUser(token);
}
