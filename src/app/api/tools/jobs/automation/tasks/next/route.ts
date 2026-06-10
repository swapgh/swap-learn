import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireSwapJobsWorker } from "@/server/swapjobs/worker-auth";

export async function GET(request: NextRequest) {
  const worker = requireSwapJobsWorker(request);
  if (worker instanceof NextResponse) return worker;

  const task = await prisma.swapJobAutomationTask.findFirst({
    where: {
      status: { in: ["pending", "approved"] },
      scheduledAt: { lte: new Date() },
    },
    include: {
      job: true,
    },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
  });

  if (!task) return NextResponse.json({ task: null });

  const claimed = await prisma.swapJobAutomationTask.update({
    where: { id: task.id },
    data: {
      status: "claimed",
      claimedBy: worker.workerId,
      claimedAt: new Date(),
      startedAt: new Date(),
    },
    include: { job: true },
  });

  await prisma.swapJobAutomationLog.create({
    data: {
      taskId: claimed.id,
      userId: claimed.userId,
      level: "info",
      message: `Claimed by ${worker.workerId}`,
    },
  });

  const profile = await prisma.swapJobProfile.findUnique({
    where: { userId: claimed.userId },
  });

  return NextResponse.json({ task: claimed, profile, approvedForSubmit: task.status === "approved" });
}
