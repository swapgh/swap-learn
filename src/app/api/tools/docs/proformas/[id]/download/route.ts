import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";
import { renderProformaPdfBuffer } from "@/modules/tools/SwapDocsDocuments/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";
  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: {
      items: true,
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!proforma) {
    return apiError("Proforma not found", 404);
  }

  const [paymentInfo] = await prisma.$queryRaw<Array<{ paymentMethod: string | null; paymentTerms: string | null }>>`
    SELECT "payment_method" AS "paymentMethod", "payment_terms" AS "paymentTerms"
    FROM "proformas"
    WHERE "id" = ${id}
  `;

  const buffer = await renderProformaPdfBuffer(
    {
      ...proforma,
      paymentMethod: paymentInfo?.paymentMethod ?? proforma.paymentMethod,
      paymentTerms: paymentInfo?.paymentTerms ?? proforma.paymentTerms,
    },
    locale
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${proforma.number}.pdf"`,
    },
  });
}
