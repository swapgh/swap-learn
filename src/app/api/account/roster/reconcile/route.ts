import { NextRequest, NextResponse } from "next/server";
import { getApiAuthUser } from "@/server/auth";
import { readJson, writeJson } from "@/server/storage";
import { apiError } from "@/server/api-error";
import type { ProgressionData } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await getApiAuthUser(request);

  if (!user) {
    return apiError("Not authenticated", 401);
  }

  try {
    const body = (await request.json()) as { characterIds: string[] };

    if (!Array.isArray(body.characterIds)) {
      return apiError("characterIds array is required");
    }

    const allProgression = (await readJson<Record<string, ProgressionData>>(
      "account/progression.json"
    )) ?? {};

    const userData = allProgression[user.id] ?? {};
    const keepIds = new Set(body.characterIds);

    for (const charId of Object.keys(userData)) {
      if (!keepIds.has(charId)) {
        delete userData[charId];
      }
    }

    allProgression[user.id] = userData;
    await writeJson("account/progression.json", allProgression);

    return NextResponse.json({ success: true });
  } catch {
    return apiError("Invalid request data", 400);
  }
}
