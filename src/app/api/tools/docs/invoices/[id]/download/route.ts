import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { apiError } from "@/server/api-error";
import { requireToolApiUser } from "@/server/tool-access";
import { renderInvoicePdfBuffer } from "@/modules/tools/SwapDocsDocuments/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireToolApiUser(request);
  if (access instanceof NextResponse) return access;

  const { id } = await params;
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      proforma: {
        select: {
          number: true,
          project: {
            select: {
              name: true,
              client: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    return apiError("Invoice not found", 404);
  }

  const [paymentInfo] = await prisma.$queryRaw<Array<{ paymentMethod: string | null; paymentTerms: string | null }>>`
    SELECT "payment_method" AS "paymentMethod", "payment_terms" AS "paymentTerms"
    FROM "invoices"
    WHERE "id" = ${id}
  `;

  const buffer = await renderInvoicePdfBuffer(
    {
      ...invoice,
      paymentMethod: paymentInfo?.paymentMethod ?? invoice.paymentMethod,
      paymentTerms: paymentInfo?.paymentTerms ?? invoice.paymentTerms,
    },
    locale
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}
