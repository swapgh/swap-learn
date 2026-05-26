import { NextRequest, NextResponse } from "next/server";
import { getApiAuthUser } from "@/server/auth";
import { readJson, writeJson } from "@/server/storage";
import { apiError } from "@/server/api-error";
import type { ProgressionData } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await getApiAuthUser(request);

  if (!user) {
    return apiError("Not authenticated", 401);
  }

  const allProgression = (await readJson<Record<string, ProgressionData>>(
    "account/progression.json"
  )) ?? {};

  return NextResponse.json(allProgression[user.id] ?? {});
}

export async function POST(request: NextRequest) {
  const user = await getApiAuthUser(request);

  if (!user) {
    return apiError("Not authenticated", 401);
  }

  try {
    const body = (await request.json()) as ProgressionData[string] & {
      _characterId?: string;
    };

    const allProgression = (await readJson<Record<string, ProgressionData>>(
      "account/progression.json"
    )) ?? {};

    if (!allProgression[user.id]) {
      allProgression[user.id] = {};
    }

    const charId = body.id ?? body._characterId;
    if (!charId) {
      return apiError("Character ID is required");
    }

    allProgression[user.id][charId] = {
      id: charId,
      name: body.name ?? "Unknown",
      class: body.class ?? "Adventurer",
      level: body.level ?? 1,
      hp: body.hp ?? 100,
      maxHp: body.maxHp ?? 100,
      coins: body.coins ?? 0,
      stats: body.stats ?? {},
      attributes: body.attributes ?? {},
      equipment: body.equipment ?? {},
      inventory: body.inventory ?? [],
    };

    await writeJson("account/progression.json", allProgression);

    return NextResponse.json({ success: true });
  } catch {
    return apiError("Invalid progression data", 400);
  }
}
