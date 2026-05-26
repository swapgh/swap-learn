import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

const patchSchema = z.object({
  state: z
    .enum(["new", "reviewed", "shortlisted", "applied", "follow_up", "interview", "rejected", "archived"])
    .optional(),
  notes: z.string().optional().nullable(),
  dateApplied: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
});

function dateOrNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("Invalid job update", 400);
  }

  const updates = parsed.data;
  const appliedByState =
    updates.state === "applied" && updates.dateApplied === undefined;
  const clearedByState =
    updates.state !== undefined && updates.state !== "applied";

  await prisma.swapJob.updateMany({
    where: { id, userId: access.user.id },
    data: {
      state: updates.state,
      notes: updates.notes,
      dateApplied: appliedByState
        ? new Date()
        : clearedByState
          ? null
          : dateOrNull(updates.dateApplied),
      followUpDate:
        appliedByState
          ? new Date(Date.now() + 6 * 86400000)
          : clearedByState
            ? null
            : dateOrNull(updates.followUpDate),
    },
  });

  const job = await prisma.swapJob.findFirst({
    where: { id, userId: access.user.id },
  });

  if (!job) {
    return apiError("Job not found", 404);
  }

  return NextResponse.json(job);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  await prisma.swapJob.deleteMany({
    where: { id, userId: access.user.id },
  });

  return NextResponse.json({ ok: true });
}
