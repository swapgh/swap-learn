import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

const searchSchema = z.object({
  source: z.enum(["linkedin", "indeed", "infojobs"]),
  query: z.string().min(2),
  location: z.string().optional().nullable(),
  modality: z.string().default("any"),
  enabled: z.boolean().default(true),
  cadenceMinutes: z.coerce.number().int().min(30).max(10080).default(1440),
});

export async function GET(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const searches = await prisma.swapJobSearch.findMany({
    where: { userId: access.user.id },
    orderBy: [{ enabled: "desc" }, { source: "asc" }, { query: "asc" }],
  });

  return NextResponse.json(searches);
}

export async function POST(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const parsed = searchSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid search payload", 400);

  const search = await prisma.swapJobSearch.create({
    data: {
      ...parsed.data,
      userId: access.user.id,
      ownerEmail: access.user.email,
      nextRunAt: new Date(),
    },
  });

  return NextResponse.json(search);
}
