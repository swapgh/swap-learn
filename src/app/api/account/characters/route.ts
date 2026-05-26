import { NextRequest, NextResponse } from "next/server";
import { getApiAuthUser } from "@/server/auth";
import { readJson } from "@/server/storage";
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

  const userProgression = allProgression[user.id] ?? {};

  const characters = Object.values(userProgression).map((c) => ({
    id: c.id,
    name: c.name,
    class: c.class,
    level: c.level,
    hp: c.hp,
    maxHp: c.maxHp,
    coins: c.coins,
    stats: c.stats,
    attributes: c.attributes,
    equipment: c.equipment,
    inventory: c.inventory,
  }));

  return NextResponse.json({ characters });
}
