import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireSwapJobsWorker } from "@/server/swapjobs/worker-auth";

const updateTaskSchema = z.object({
  status: z.enum(["claimed", "running", "waiting_approval", "completed", "failed", "blocked", "cancelled"]),
  result: z.unknown().optional(),
  error: z.string().optional().nullable(),
  log: z.string().optional(),
  level: z.string().optional().default("info"),
});

function jsonInput(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = requireSwapJobsWorker(request);
  if (worker instanceof NextResponse) return worker;

  const parsed = updateTaskSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid task update", 400);

  const { id } = await params;
  const task = await prisma.swapJobAutomationTask.findUnique({ where: { id } });
  if (!task) return apiError("Task not found", 404);

  const finished = ["completed", "failed", "blocked", "cancelled"].includes(parsed.data.status);
  const updated = await prisma.swapJobAutomationTask.update({
    where: { id },
    data: {
      status: parsed.data.status,
      result: jsonInput(parsed.data.result),
      error: parsed.data.error,
      claimedBy: task.claimedBy ?? worker.workerId,
      startedAt: task.startedAt ?? new Date(),
      finishedAt: finished ? new Date() : undefined,
    },
  });

  await prisma.swapJobAutomationLog.create({
    data: {
      taskId: id,
      userId: task.userId,
      level: parsed.data.level,
      message: parsed.data.log || `Task ${parsed.data.status}`,
      metadata: jsonInput(parsed.data.result),
    },
  });

  return NextResponse.json(updated);
}
