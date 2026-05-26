import { notFound } from "next/navigation";
import Image from "next/image";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import {
  createInvoiceFromProforma,
  generateWorkItemsFromAcceptedProforma,
  sendProformaByEmail,
} from "@/modules/tools/SwapDocsPage/actions";
import {
  formatSwapDocsCurrency,
  formatSwapDocsDate,
  isInternalTemplateNote,
  publicDocumentDescription,
  swapDocsDocumentLabel,
  swapDocsPaymentMethodLabel,
  swapDocsPaymentTermsLabel,
  swapDocsStatusLabel,
} from "@/modules/tools/swapdocs-i18n";
import styles from "./styles.module.css";

export async function SwapDocsProformaPage({
  locale,
  id,
  returnTo,
  success,
  error,
}: {
  locale: Locale;
  id: string;
  returnTo?: string;
  success?: string;
  error?: string;
}) {
  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: {
      items: true,
      emailLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      invoices: { select: { id: true, number: true, status: true } },
      project: {
        include: {
          client: true,
          costItems: true,
          estimations: true,
          workItems: true,
        },
      },
    },
  });

  if (!proforma) {
    notFound();
  }

  const [paymentInfo] = await prisma.$queryRaw<Array<{ paymentMethod: string | null; paymentTerms: string | null }>>`
    SELECT "payment_method" AS "paymentMethod", "payment_terms" AS "paymentTerms"
    FROM "proformas"
    WHERE "id" = ${id}
  `;

  const toastMessage = success ?? error ?? null;
  const fallbackReturnTo = `/${locale}/account/tools/docs/clients/${proforma.project.client.id}?tab=presupuestos`;
  const safeReturnTo = returnTo?.startsWith(`/${locale}/account/tools/docs`) ? returnTo : fallbackReturnTo;
  const encodedReturnTo = encodeURIComponent(safeReturnTo);
  const detailHref = `/${locale}/account/tools/docs/proformas/${id}?returnTo=${encodedReturnTo}`;
  const editHref = `/${locale}/account/tools/docs/clients/${proforma.project.client.id}?tab=presupuestos&editProforma=${proforma.id}#crear-proforma`;
  const statusClass = styles[`status${proforma.status}`] ?? styles.statusdraft;
  const formatCurrency = (value: number) => formatSwapDocsCurrency(locale, value);
  const formatDate = (value: Date) => formatSwapDocsDate(locale, value, { day: "2-digit", month: "long", year: "numeric" });
  const visibleNotes = isInternalTemplateNote(proforma.notes) ? null : proforma.notes;
  const paymentMethodLabel = swapDocsPaymentMethodLabel(locale, paymentInfo?.paymentMethod);
  const documentLabel = (key: string) => swapDocsDocumentLabel(locale, key);
  const paymentTermsLabel = paymentInfo?.paymentTerms
    ? swapDocsPaymentTermsLabel(locale, paymentInfo.paymentTerms)
    : documentLabel("proformaFallbackTerms");
  const hasTracking = proforma.project.workItems.length > 0;
  const hasInvoice = proforma.invoices.length > 0;

  return (
        <><Toast message={toastMessage} />

        <nav className={`${styles.breadcrumb} ${styles.noPrint}`}>
          <a href={safeReturnTo}>SwapDocs</a>
          <span aria-hidden>/</span>
          <span>{proforma.number}</span>
        </nav>

        <section className={`${styles.detailHero} ${styles.noPrint}`}>
          <div>
            <span className={styles.kicker}>{documentLabel("proforma")}</span>
            <div className={styles.heroTitleLine}>
              <h1>{proforma.number}</h1>
              <span className={`${styles.statusPill} ${statusClass}`}>{swapDocsStatusLabel(locale, proforma.status)}</span>
            </div>
            <p>{proforma.project.client.name} · {proforma.project.name} · {formatDate(proforma.issueDate)}</p>
          </div>
          <div className={styles.heroMetrics}>
            <div><span>Subtotal</span><strong>{formatCurrency(proforma.subtotal)}</strong></div>
            <div><span>IVA</span><strong>{formatCurrency(proforma.ivaAmount)}</strong></div>
            <div><span>Total</span><strong>{formatCurrency(proforma.total)}</strong></div>
          </div>
        </section>

        <div className={`${styles.toolbar} ${styles.noPrint}`}>
          <div className={styles.toolbarGroup}>
            <a href={safeReturnTo}>{documentLabel("back")}</a>
            <a href={editHref}>{documentLabel("edit")}</a>
            <a href={`/api/tools/docs/proformas/${id}/download?locale=${locale}`}>PDF</a>
          </div>
          <div className={styles.toolbarGroup}>
          <details className={styles.toolbarDetails}>
            <summary>{documentLabel("sendByEmail")}</summary>
            <form action={sendProformaByEmail.bind(null, locale, proforma.id)} className={styles.emailForm}>
              <input type="hidden" name="returnTo" value={detailHref} />
              <input name="to" type="email" defaultValue={proforma.project.client.email ?? ""} placeholder="cliente@email.com" required />
              <input name="subject" defaultValue={`${documentLabel("proformaPrefix")} ${proforma.number}`} />
              <textarea name="message" rows={3} placeholder={documentLabel("optionalMessage")} />
              <button type="submit">{documentLabel("sendByEmail")}</button>
            </form>
          </details>

          {hasInvoice && (
            <a href={`/${locale}/account/tools/docs/invoices/${proforma.invoices[0].id}?returnTo=${encodeURIComponent(detailHref)}`}>
              {documentLabel("invoicePrefix")}: {proforma.invoices[0].number}
            </a>
          )}

          {proforma.status === "accepted" && !hasTracking && (
            <form action={generateWorkItemsFromAcceptedProforma.bind(null, locale)}>
              <input type="hidden" name="returnTo" value={detailHref} />
              <input type="hidden" name="projectId" value={proforma.projectId} />
              <input type="hidden" name="proformaId" value={proforma.id} />
              <button type="submit" className={styles.primaryToolbarButton}>
                Generar seguimiento
              </button>
            </form>
          )}

          {(proforma.status === "accepted" || proforma.status === "converted") && hasTracking && (
            <a href={`/${locale}/account/tools/docs/projects/${proforma.projectId}?tab=tareas`}>
              Ver seguimiento
            </a>
          )}

          {proforma.status === "accepted" && !hasInvoice && (
            <form action={createInvoiceFromProforma.bind(null, locale)}>
              <input type="hidden" name="returnTo" value={detailHref} />
              <input type="hidden" name="proformaId" value={proforma.id} />
              <input type="hidden" name="paymentMethod" value={paymentInfo?.paymentMethod ?? "bank_transfer"} />
              {paymentInfo?.paymentTerms && <input type="hidden" name="paymentTerms" value={paymentInfo.paymentTerms} />}
              <button type="submit" className={styles.primaryToolbarButton}>
                {documentLabel("createInvoice")}
              </button>
            </form>
          )}
          </div>
        </div>

        <article className={styles.document}>
          <header className={styles.docHeader}>
            <div>
              <p className={styles.kicker}>{documentLabel("proforma")}</p>
              <h1>{proforma.number}</h1>
              <p>{formatDate(proforma.issueDate)} · {swapDocsStatusLabel(locale, proforma.status)}</p>
            </div>
            <div className={styles.company}>
              <Image src="/images/misc/logo_negro_transparente_RGBA.png" alt="SG" width={72} height={72} className={styles.documentLogo} />
              <strong>Swap</strong>
              <span>swap.com.es</span>
            </div>
          </header>

          <section className={styles.parties}>
            <div>
              <p className={styles.kicker}>{documentLabel("client")}</p>
              <h2>{proforma.project.client.name}</h2>
              <p>{proforma.project.client.nifCif || documentLabel("missingTaxId")}</p>
              <p>{proforma.project.client.address || documentLabel("missingAddress")}</p>
              <p>{proforma.project.client.email || documentLabel("missingEmail")}</p>
            </div>
            <div>
              <p className={styles.kicker}>{documentLabel("project")}</p>
              <h2>{proforma.project.name}</h2>
              <p>{documentLabel("paymentMethod")}: {paymentMethodLabel}</p>
              <p>{documentLabel("paymentTerms")}: {paymentTermsLabel}</p>
            </div>
          </section>

          <section>
            <div className={styles.sectionTitleRow}>
              <h2>{documentLabel("concepts")}</h2>
              <span>{proforma.items.length} {documentLabel(proforma.items.length === 1 ? "lineSingular" : "linePlural")}</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{documentLabel("description")}</th>
                  <th>{documentLabel("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {proforma.items.map((item) => (
                  <tr key={item.id}>
                    <td>{publicDocumentDescription(locale, item.description)}</td>
                    <td>{formatCurrency(item.clientPrice || item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.totals}>
            <div>
              <span>{documentLabel("subtotal")}</span>
              <strong>{formatCurrency(proforma.subtotal)}</strong>
            </div>
            {proforma.discount > 0 && (
              <div>
                <span>{documentLabel("discount")}</span>
                <strong>-{formatCurrency(proforma.discount)}</strong>
              </div>
            )}
            <div>
              <span>IVA ({proforma.ivaRate}%)</span>
              <strong>{formatCurrency(proforma.ivaAmount)}</strong>
            </div>
            <div className={styles.total}>
              <span>{documentLabel("total")}</span>
              <strong>{formatCurrency(proforma.total)}</strong>
            </div>
          </section>

          {visibleNotes && (
            <section className={styles.notes}>
              <h2>{documentLabel("notes")}</h2>
              <p>{visibleNotes}</p>
            </section>
          )}

          <footer className={styles.signatures}>
            <div>
              <span>{documentLabel("issuerSignature")}</span>
            </div>
            <div>
              <span>{documentLabel("clientSignature")}</span>
            </div>
          </footer>

          <footer className={styles.legalFooter}>
            <p>
              {documentLabel("proformaLegal1")} {documentLabel("proformaLegal2")}
            </p>
          </footer>
        </article>
  </>);
}
