import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/server/api-error";

export function requireSwapJobsWorker(request: NextRequest): NextResponse | { workerId: string } {
  const configuredToken = process.env.SWAPJOBS_WORKER_TOKEN;
  if (!configuredToken) {
    return apiError("SWAPJOBS_WORKER_TOKEN is not configured", 503);
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return apiError("Worker token required", 401);
  }

  const token = authHeader.slice("Bearer ".length);
  if (token !== configuredToken) {
    return apiError("Invalid worker token", 403);
  }

  return {
    workerId: request.headers.get("x-swapjobs-worker") || "local-worker",
  };
}
