import "server-only";

import { notFound, redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import type { Locale } from "@/lib/locale";
import { getApiAuthUser, getAuthUser, type StoredUser } from "@/server/auth";
import { apiError } from "@/server/api-error";

function adminEmails() {
  return (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminToolAccess(email?: string | null) {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function requireToolPageUser(locale: Locale): Promise<StoredUser> {
  const user = await getAuthUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!hasAdminToolAccess(user.email)) {
    notFound();
  }

  return user;
}

export async function requireToolApiUser(
  request: NextRequest
): Promise<{ user: StoredUser } | NextResponse> {
  const user = await getApiAuthUser(request);

  if (!user) {
    return apiError("Not authenticated", 401);
  }

  if (!hasAdminToolAccess(user.email)) {
    return apiError("Forbidden", 403);
  }

  return { user };
}
