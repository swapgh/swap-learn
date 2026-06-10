import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

const createTaskSchema = z.object({
  type: z.enum(["search_source", "inspect_job", "fill_application", "final_submit"]),
  source: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
  priority: z.coerce.number().int().min(0).max(100).default(50),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const tasks = await prisma.swapJobAutomationTask.findMany({
    where: { userId: access.user.id },
    include: { job: true, logs: { orderBy: { createdAt: "desc" }, take: 4 } },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid automation task", 400);

  const task = await prisma.swapJobAutomationTask.create({
    data: {
      type: parsed.data.type,
      source: parsed.data.source,
      jobId: parsed.data.jobId || undefined,
      priority: parsed.data.priority,
      payload: parsed.data.payload as Prisma.InputJsonValue,
      userId: access.user.id,
      ownerEmail: access.user.email,
    },
  });

  return NextResponse.json(task);
}
