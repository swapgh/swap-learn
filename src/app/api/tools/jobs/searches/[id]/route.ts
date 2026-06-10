import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

const patchSchema = z.object({
  source: z.enum(["linkedin", "indeed", "infojobs"]).optional(),
  query: z.string().min(2).optional(),
  location: z.string().optional().nullable(),
  modality: z.string().optional(),
  enabled: z.boolean().optional(),
  cadenceMinutes: z.coerce.number().int().min(30).max(10080).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid search update", 400);

  const { id } = await params;
  await prisma.swapJobSearch.updateMany({
    where: { id, userId: access.user.id },
    data: parsed.data,
  });

  const search = await prisma.swapJobSearch.findFirst({
    where: { id, userId: access.user.id },
  });
  if (!search) return apiError("Search not found", 404);

  return NextResponse.json(search);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  await prisma.swapJobSearch.deleteMany({
    where: { id, userId: access.user.id },
  });

  return NextResponse.json({ ok: true });
}
