import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

const jobSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  modality: z.string().default("remote"),
  source: z.string().default("manual"),
  salary: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  state: z
    .enum(["new", "reviewed", "shortlisted", "applied", "follow_up", "interview", "rejected", "archived"])
    .default("new"),
  score: z.number().int().min(0).max(100).default(0),
  fitScore: z.number().int().min(0).max(100).default(0),
  viabilityScore: z.number().int().min(0).max(100).default(0),
  qualityScore: z.number().int().min(0).max(100).default(0),
  timingScore: z.number().int().min(0).max(100).default(0),
  recommendedCv: z.string().default("CV Español"),
  action: z.string().default("review"),
  technologies: z.array(z.string()).default([]),
  positiveFlags: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  dateApplied: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
});

function dateOrNull(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value);
}

export async function POST(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const parsed = jobSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("Invalid job payload", 400);
  }

  const isApplied = parsed.data.state === "applied";
  const job = await prisma.swapJob.create({
    data: {
      ...parsed.data,
      userId: access.user.id,
      ownerEmail: access.user.email,
      dateApplied: dateOrNull(parsed.data.dateApplied) ?? (isApplied ? new Date() : null),
      followUpDate: dateOrNull(parsed.data.followUpDate) ?? (isApplied ? new Date(Date.now() + 6 * 86400000) : null),
    },
  });

  return NextResponse.json(job);
}
