import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { buildDuplicateKey, scoreSwapJob } from "@/server/swapjobs/scoring";
import { requireSwapJobsWorker } from "@/server/swapjobs/worker-auth";

const discoveredJobSchema = z.object({
  taskId: z.string(),
  title: z.string().min(1),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  modality: z.string().default("any"),
  source: z.string(),
  salary: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const worker = requireSwapJobsWorker(request);
  if (worker instanceof NextResponse) return worker;

  const parsed = discoveredJobSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid discovered job", 400);

  const task = await prisma.swapJobAutomationTask.findUnique({
    where: { id: parsed.data.taskId },
  });
  if (!task) return apiError("Task not found", 404);

  const profile = await prisma.swapJobProfile.findUnique({
    where: { userId: task.userId },
  });
  const scored = scoreSwapJob(parsed.data, profile);
  const duplicateKey = buildDuplicateKey(parsed.data);
  const jobData = {
    title: parsed.data.title,
    company: parsed.data.company,
    location: parsed.data.location,
    country: parsed.data.country,
    modality: parsed.data.modality,
    source: parsed.data.source,
    salary: parsed.data.salary,
    url: parsed.data.url,
    description: parsed.data.description,
    externalId: parsed.data.externalId,
  };

  const job = await prisma.swapJob.upsert({
    where: {
      userId_duplicateKey: {
        userId: task.userId,
        duplicateKey,
      },
    },
    update: {
      ...jobData,
      ...scored,
      duplicateKey,
      automationStatus: "discovered",
      lastSeenAt: new Date(),
    },
    create: {
      ...jobData,
      ...scored,
      duplicateKey,
      automationStatus: "discovered",
      userId: task.userId,
      ownerEmail: task.ownerEmail,
      lastSeenAt: new Date(),
    },
  });

  await prisma.swapJobAutomationLog.create({
    data: {
      taskId: task.id,
      userId: task.userId,
      level: "info",
      message: `Saved job: ${job.title}`,
      metadata: { jobId: job.id, score: job.score },
    },
  });

  return NextResponse.json(job);
}
