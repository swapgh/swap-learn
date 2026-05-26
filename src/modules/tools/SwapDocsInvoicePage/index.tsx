import { notFound } from "next/navigation";
import Image from "next/image";
import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import {
  updateInvoice,
  registerPayment,
  deletePayment,
  sendInvoiceByEmail,
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
import { PaymentTermsField } from "@/modules/tools/PaymentTermsField";
import baseStyles from "@/modules/tools/SwapDocsProformaPage/styles.module.css";
import styles from "./styles.module.css";

function balanceDue(invoice: { total: number }, payments: { amount: number }[]) {
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  return Math.max(0, invoice.total - paid);
}

export async function SwapDocsInvoicePage({
  locale,
  id,
  mode = "view",
  returnTo,
  success,
  error,
}: {
  locale: Locale;
  id: string;
  mode?: "view" | "edit";
  returnTo?: string;
  success?: string;
  error?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      emailLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      payments: { orderBy: { paidAt: "desc" } },
      proforma: {
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const [paymentInfo] = await prisma.$queryRaw<Array<{ paymentMethod: string | null; paymentTerms: string | null }>>`
    SELECT "payment_method" AS "paymentMethod", "payment_terms" AS "paymentTerms"
    FROM "invoices"
    WHERE "id" = ${id}
  `;

  const toastMessage = success ?? error ?? null;
  const remaining = balanceDue(invoice, invoice.payments);
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const statusClass = baseStyles[`status${invoice.status}`] ?? baseStyles.statusdraft;
  const fallbackReturnTo = `/${locale}/account/tools/docs?tab=facturas`;
  const safeReturnTo = returnTo?.startsWith(`/${locale}/account/tools/docs`) ? returnTo : fallbackReturnTo;
  const encodedReturnTo = encodeURIComponent(safeReturnTo);
  const detailHref = `/${locale}/account/tools/docs/invoices/${id}?returnTo=${encodedReturnTo}`;
  const formatCurrency = (value: number) => formatSwapDocsCurrency(locale, value);
  const formatDate = (value: Date) => formatSwapDocsDate(locale, value, { day: "2-digit", month: "long", year: "numeric" });
  const visibleNotes = isInternalTemplateNote(invoice.notes) ? null : invoice.notes;
  const paymentMethodLabel = swapDocsPaymentMethodLabel(locale, paymentInfo?.paymentMethod);
  const documentLabel = (key: string) => swapDocsDocumentLabel(locale, key);
  const paymentTermsLabel = paymentInfo?.paymentTerms
    ? swapDocsPaymentTermsLabel(locale, paymentInfo.paymentTerms)
    : documentLabel("invoiceFallbackTerms");

  return (
        <><Toast message={toastMessage} />

        <nav className={`${baseStyles.breadcrumb} ${baseStyles.noPrint}`}>
          <a href={`/${locale}/account/tools/docs`}>SwapDocs</a>
          <span aria-hidden>/</span>
          <span>{invoice.number}</span>
        </nav>

        <section className={`${baseStyles.detailHero} ${baseStyles.noPrint}`}>
          <div>
            <span className={baseStyles.kicker}>{documentLabel("invoice")}</span>
            <div className={baseStyles.heroTitleLine}>
              <h1>{invoice.number}</h1>
              <span className={`${baseStyles.statusPill} ${statusClass}`}>{swapDocsStatusLabel(locale, invoice.status)}</span>
            </div>
            <p>{invoice.proforma.project.client.name} · {invoice.proforma.project.name} · {documentLabel("issued")} {formatDate(invoice.issueDate)}</p>
          </div>
          <div className={baseStyles.heroMetrics}>
            <div><span>Total</span><strong>{formatCurrency(invoice.total)}</strong></div>
            <div><span>Pagado</span><strong>{formatCurrency(totalPaid)}</strong></div>
            <div><span>Pendiente</span><strong>{formatCurrency(remaining)}</strong></div>
          </div>
        </section>

        <div className={`${baseStyles.toolbar} ${baseStyles.noPrint}`}>
          <div className={baseStyles.toolbarGroup}>
            <a href={safeReturnTo}>{documentLabel("back")}</a>
            <a href={`/${locale}/account/tools/docs/invoices/${id}?mode=edit&returnTo=${encodedReturnTo}`}>{documentLabel("edit")}</a>
            <a href={`/api/tools/docs/invoices/${id}/download?locale=${locale}`}>PDF</a>
          </div>
          <div className={baseStyles.toolbarGroup}>
          <details className={baseStyles.toolbarDetails}>
            <summary>{documentLabel("sendByEmail")}</summary>
            <form action={sendInvoiceByEmail.bind(null, locale, invoice.id)} className={baseStyles.emailForm}>
              <input name="to" type="email" defaultValue={invoice.proforma.project.client.email ?? ""} placeholder="cliente@email.com" required />
              <input name="subject" defaultValue={`${documentLabel("invoicePrefix")} ${invoice.number}`} />
              <textarea name="message" rows={3} placeholder={documentLabel("optionalMessage")} />
              <button type="submit">{documentLabel("sendByEmail")}</button>
            </form>
          </details>
          <a href={`/${locale}/account/tools/docs/proformas/${invoice.proformaId}?returnTo=${encodeURIComponent(detailHref)}`}>{documentLabel("proformaPrefix")} {invoice.proforma.number}</a>
          </div>
        </div>

        {mode === "edit" && (
          <form action={updateInvoice.bind(null, locale, invoice.id)} className={`${baseStyles.editor} ${baseStyles.noPrint}`}>
            <input type="hidden" name="returnTo" value={safeReturnTo} />
            <h2>Editar factura</h2>
            <div className={baseStyles.editorGrid}>
              <label>
                Estado
                <select name="status" defaultValue={invoice.status}>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="paid">Pagada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="overdue">Vencida</option>
                </select>
              </label>
              <label>
                Descuento
                <input name="discount" type="number" step="0.01" min="0" defaultValue={invoice.discount} />
              </label>
              <label>
                IVA %
                <input name="ivaRate" type="number" step="0.01" min="0" defaultValue={invoice.ivaRate} />
              </label>
              <label>
                Fecha vencimiento
                <input name="dueDate" type="date" defaultValue={invoice.dueDate ? formatDate(invoice.dueDate).split("/").reverse().join("-") : ""} />
              </label>
              <label>
                Forma de pago
                <select name="paymentMethod" defaultValue={paymentInfo?.paymentMethod ?? "bank_transfer"}>
                  <option value="bank_transfer">Transferencia bancaria</option>
                  <option value="card">Tarjeta</option>
                  <option value="paypal">PayPal</option>
                  <option value="bizum">Bizum</option>
                  <option value="cash">Efectivo</option>
                  <option value="other">Otro método</option>
                </select>
              </label>
              <PaymentTermsField className={baseStyles.full} locale={locale} defaultValue={paymentInfo?.paymentTerms} />
              <label className={baseStyles.full}>
                Notas
                <textarea name="notes" defaultValue={invoice.notes ?? ""} rows={3} />
              </label>
            </div>

            <div className={baseStyles.editTableWrap}>
              <table className={baseStyles.editTable}>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Importe</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input name={`description_${item.id}`} defaultValue={item.description} />
                      </td>
                      <td>
                        <input name={`amount_${item.id}`} type="number" step="0.01" min="0" defaultValue={item.amount} />
                      </td>
                      <td>
                        <label className={baseStyles.checkboxLabel}>
                          <input type="checkbox" name="deleteItemId" value={item.id} />
                          Borrar
                        </label>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <input name="newDescription" placeholder="Nueva línea..." />
                    </td>
                    <td>
                      <input name="newAmount" type="number" step="0.01" min="0" placeholder="0" />
                    </td>
                    <td>Nueva</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={baseStyles.editorActions}>
              <button type="submit">Guardar Cambios</button>
              <a href={`/${locale}/account/tools/docs/invoices/${id}?returnTo=${encodedReturnTo}`}>Cancelar</a>
            </div>
          </form>
        )}

        {/* Document view */}
        <article className={baseStyles.document}>
          <header className={baseStyles.docHeader}>
            <div>
              <p className={baseStyles.kicker}>{documentLabel("invoice")}</p>
              <h1>{invoice.number}</h1>
              <p className={baseStyles.muted}>{documentLabel("issued")}: {formatDate(invoice.issueDate)}</p>
              {invoice.dueDate && (
                <p className={baseStyles.muted}>{documentLabel("dueDate")}: {formatDate(invoice.dueDate)}</p>
              )}
            </div>
            <div className={baseStyles.company}>
              <Image src="/images/misc/logo_negro_transparente_RGBA.png" alt="SG" width={72} height={72} className={baseStyles.documentLogo} />
              <strong>Swap</strong>
              <span>swap.com.es</span>
            </div>
          </header>

          <section className={baseStyles.parties}>
            <div>
              <p className={baseStyles.kicker}>{documentLabel("client")}</p>
              <h2>{invoice.proforma.project.client.name}</h2>
              <p>{invoice.proforma.project.client.nifCif || documentLabel("missingTaxId")}</p>
              <p>{invoice.proforma.project.client.address || documentLabel("missingAddress")}</p>
              <p>{invoice.proforma.project.client.email || documentLabel("missingEmail")}</p>
            </div>
            <div>
              <p className={baseStyles.kicker}>{documentLabel("project")}</p>
              <h2>{invoice.proforma.project.name}</h2>
              <p>{documentLabel("paymentMethod")}: {paymentMethodLabel}</p>
              <p>{documentLabel("paymentTerms")}: {paymentTermsLabel}</p>
            </div>
          </section>

          <section>
            <div className={baseStyles.sectionTitleRow}>
              <h2>{documentLabel("concepts")}</h2>
              <span>{invoice.items.length} {documentLabel(invoice.items.length === 1 ? "lineSingular" : "linePlural")}</span>
            </div>
            <table className={baseStyles.table}>
              <thead>
                <tr>
                  <th>{documentLabel("description")}</th>
                  <th>{documentLabel("total")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td>{publicDocumentDescription(locale, item.description)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={baseStyles.totals}>
            <div>
              <span>{documentLabel("subtotal")}</span>
              <strong>{formatCurrency(invoice.subtotal)}</strong>
            </div>
            {invoice.discount > 0 && (
              <div>
                <span>{documentLabel("discount")}</span>
                <strong>-{formatCurrency(invoice.discount)}</strong>
              </div>
            )}
            <div>
              <span>IVA ({invoice.ivaRate}%)</span>
              <strong>{formatCurrency(invoice.ivaAmount)}</strong>
            </div>
            <div className={baseStyles.total}>
              <span>{documentLabel("total")}</span>
              <strong>{formatCurrency(invoice.total)}</strong>
            </div>
          </section>

          {visibleNotes && (
            <section className={baseStyles.notes}>
              <h2>{documentLabel("notes")}</h2>
              <p>{visibleNotes}</p>
            </section>
          )}

          <footer className={baseStyles.signatures}>
            <div>
              <span>{documentLabel("issuerSignature")}</span>
            </div>
            <div>
              <span>{documentLabel("clientSignature")}</span>
            </div>
          </footer>

          <footer className={baseStyles.legalFooter}>
            <p>
              {documentLabel("invoiceLegal1")} {documentLabel("invoiceLegal2")}
            </p>
          </footer>
        </article>

        {/* Payments section */}
        <section className={`${styles.paymentsSection} ${baseStyles.noPrint}`}>
          <div className={baseStyles.sectionTitleRow}>
            <h2>Pagos</h2>
            <span>{invoice.payments.length} registro{invoice.payments.length === 1 ? "" : "s"}</span>
          </div>

          <div className={styles.paymentSummary}>
            <div>
              <span className={styles.paymentLabel}>Total factura</span>
              <strong>{formatCurrency(invoice.total)}</strong>
            </div>
            <div>
              <span className={styles.paymentLabel}>Pagado</span>
              <strong className={styles.paidAmount}>{formatCurrency(totalPaid)}</strong>
            </div>
            <div>
              <span className={styles.paymentLabel}>Pendiente</span>
              <strong className={styles.dueAmount}>{formatCurrency(remaining)}</strong>
            </div>
          </div>

          {invoice.payments.length > 0 && (
            <div className={styles.paymentList}>
              <table className={baseStyles.editTable}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Importe</th>
                    <th>Método</th>
                    <th>Referencia</th>
                    <th>Notas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.paidAt)}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.method ?? "-"}</td>
                      <td>{payment.reference ?? "-"}</td>
                      <td>{payment.notes ?? "-"}</td>
                      <td>
                        <details>
                          <summary className={styles.deleteBtn}>Eliminar</summary>
                          <form action={deletePayment.bind(null, locale, payment.id)}>
                            <p>Vas a eliminar este pago de {formatCurrency(payment.amount)}.</p>
                            <button type="submit" className={styles.deleteBtn}>Confirmar eliminación</button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {remaining > 0 && (
            <details className={styles.registerPayment}>
              <summary>Registrar pago</summary>
              <form action={registerPayment.bind(null, locale)} className={styles.paymentForm}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <div className={styles.paymentFormGrid}>
                  <label>
                    Importe
                    <input name="amount" type="number" step="0.01" min="0.01" max={remaining} required placeholder="0.00" />
                  </label>
                  <label>
                    Método
                    <select name="method">
                      <option value="">Seleccionar...</option>
                      <option value="transfer">Transferencia</option>
                      <option value="card">Tarjeta</option>
                      <option value="paypal">PayPal</option>
                      <option value="bizum">Bizum</option>
                      <option value="cash">Efectivo</option>
                      <option value="other">Otro</option>
                    </select>
                  </label>
                  <label>
                    Referencia
                    <input name="reference" placeholder="Nº operación..." />
                  </label>
                  <label>
                    Notas
                    <input name="notes" placeholder="Opcional..." />
                  </label>
                </div>
                <div className={baseStyles.editorActions}>
                  <button type="submit">Registrar pago</button>
                </div>
              </form>
            </details>
          )}
        </section>
  </>);
}
