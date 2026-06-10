import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  const task = await prisma.swapJobAutomationTask.findFirst({
    where: { id, userId: access.user.id },
  });
  if (!task) return apiError("Task not found", 404);

  if (!["failed", "blocked", "cancelled"].includes(task.status)) {
    return apiError("Only failed, blocked, or cancelled tasks can be retried", 409);
  }

  const updated = await prisma.swapJobAutomationTask.update({
    where: { id },
    data: {
      status: "pending",
      result: undefined,
      error: null,
      claimedBy: null,
      claimedAt: null,
      startedAt: null,
      finishedAt: null,
      scheduledAt: new Date(),
    },
    include: { job: true, logs: { orderBy: { createdAt: "desc" }, take: 4 } },
  });

  await prisma.swapJobAutomationLog.create({
    data: {
      taskId: id,
      userId: access.user.id,
      level: "info",
      message: "Retried from dashboard",
    },
  });

  return NextResponse.json(updated);
}
