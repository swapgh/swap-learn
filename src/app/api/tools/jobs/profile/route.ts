import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";

const stringList = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return value;
}, z.array(z.string()).default([]));

const profileSchema = z.object({
  fullName: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  linkedinUrl: z.string().optional().nullable(),
  portfolioUrl: z.string().optional().nullable(),
  cvEsUrl: z.string().optional().default("/cv/Fernando_Alba_CV_ES.pdf"),
  cvEnUrl: z.string().optional().default("/cv/Fernando_Alba_CV_EN.pdf"),
  cvText: z.string().optional().nullable(),
  targetRoles: stringList,
  targetLocations: stringList,
  languages: stringList,
  salaryMin: z.coerce.number().int().positive().optional().nullable(),
  mustHave: stringList,
  rejectTerms: stringList,
  preferredCompanies: stringList,
  blockedCompanies: stringList,
  applicationFields: z.record(z.string(), z.string()).default({}),
});

export async function GET(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const profile = await prisma.swapJobProfile.findUnique({
    where: { userId: access.user.id },
  });

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid profile payload", 400);

  const profile = await prisma.swapJobProfile.upsert({
    where: { userId: access.user.id },
    update: parsed.data,
    create: {
      ...parsed.data,
      userId: access.user.id,
      ownerEmail: access.user.email,
    },
  });

  return NextResponse.json(profile);
}
