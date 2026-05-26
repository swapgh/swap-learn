import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireToolApiUser } from "@/server/tool-access";

export async function GET(request: NextRequest) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 1) {
    return NextResponse.json({ clients: [], projects: [], proformas: [], invoices: [] });
  }

  const [clients, projects, proformas, invoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { nifCif: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 5,
    }),
    prisma.project.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, clientId: true, client: { select: { name: true } } },
      take: 5,
    }),
    prisma.proforma.findMany({
      where: { number: { contains: q, mode: "insensitive" } },
      select: { id: true, number: true, projectId: true, project: { select: { name: true, clientId: true } } },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { number: { contains: q, mode: "insensitive" } },
      select: { id: true, number: true, proforma: { select: { projectId: true, project: { select: { name: true, clientId: true } } } } },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    clients: clients.map((c) => ({ id: c.id, name: c.name, email: c.email })),
    projects: projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId, clientName: p.client.name })),
    proformas: proformas.map((p) => ({ id: p.id, number: p.number, projectId: p.projectId, clientId: p.project.clientId, projectName: p.project.name })),
    invoices: invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      projectId: inv.proforma?.projectId ?? null,
      clientId: inv.proforma?.project?.clientId ?? null,
      projectName: inv.proforma?.project?.name ?? null,
    })),
  });
}
