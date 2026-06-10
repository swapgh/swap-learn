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
  if (task.status !== "waiting_approval") {
    return apiError("Task is not waiting for approval", 409);
  }

  const updated = await prisma.swapJobAutomationTask.update({
    where: { id },
    data: { status: "approved", error: null },
  });

  await prisma.swapJobAutomationLog.create({
    data: {
      taskId: id,
      userId: access.user.id,
      level: "info",
      message: "Final submit approved from dashboard",
    },
  });

  return NextResponse.json(updated);
}
