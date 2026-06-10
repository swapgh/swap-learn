import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireSwapJobsWorker } from "@/server/swapjobs/worker-auth";

const applicationSchema = z.object({
  taskId: z.string(),
  jobId: z.string(),
  status: z.enum(["draft", "queued", "filling", "waiting_approval", "submitted", "failed", "blocked"]),
  source: z.string(),
  sourceUrl: z.string().optional().nullable(),
  formFields: z.array(z.unknown()).default([]),
  preparedAnswers: z.record(z.string(), z.unknown()).default({}),
  blockedReason: z.string().optional().nullable(),
  lastScreenshot: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const worker = requireSwapJobsWorker(request);
  if (worker instanceof NextResponse) return worker;

  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid application payload", 400);

  const task = await prisma.swapJobAutomationTask.findUnique({
    where: { id: parsed.data.taskId },
  });
  if (!task) return apiError("Task not found", 404);

  const job = await prisma.swapJob.findFirst({
    where: { id: parsed.data.jobId, userId: task.userId },
  });
  if (!job) return apiError("Job not found", 404);

  const existing = await prisma.swapJobApplication.findFirst({
    where: { jobId: job.id, userId: task.userId },
  });

  const applicationData = {
    userId: task.userId,
    ownerEmail: task.ownerEmail,
    jobId: job.id,
    status: parsed.data.status,
    source: parsed.data.source,
    sourceUrl: parsed.data.sourceUrl,
    formFields: parsed.data.formFields as Prisma.InputJsonValue,
    preparedAnswers: parsed.data.preparedAnswers as Prisma.InputJsonValue,
    blockedReason: parsed.data.blockedReason,
    lastScreenshot: parsed.data.lastScreenshot,
    submittedAt: parsed.data.status === "submitted" ? new Date() : null,
  };

  const application = existing
    ? await prisma.swapJobApplication.update({
        where: { id: existing.id },
        data: applicationData,
      })
    : await prisma.swapJobApplication.create({
        data: applicationData,
      });

  await prisma.swapJob.update({
    where: { id: job.id },
    data: {
      automationStatus: parsed.data.status,
      state: parsed.data.status === "submitted" ? "applied" : job.state,
      dateApplied: parsed.data.status === "submitted" ? new Date() : job.dateApplied,
    },
  });

  return NextResponse.json(application);
}
