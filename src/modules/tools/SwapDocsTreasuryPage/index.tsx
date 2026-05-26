import type { Locale } from "@/lib/locale";

import { Toast } from "@/components/Toast";
import { prisma } from "@/server/prisma";
import baseStyles from "@/modules/tools/SwapDocsPage/styles.module.css";
import styles from "./styles.module.css";

function formatCurrency(value: number) {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d);
}

export async function SwapDocsTreasuryPage({
  locale,
  success,
  error,
}: {
  locale: Locale;
  success?: string;
  error?: string;
}) {
  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        proforma: { select: { project: { select: { name: true, client: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.payment.findMany({
      include: {
        invoice: {
          select: { number: true, proforma: { select: { project: { select: { name: true } } } } },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 50,
    }),
  ]);

  const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, totalInvoiced - totalPaid);
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;
  const draftSentCount = invoices.filter(
    (inv) => inv.status === "draft" || inv.status === "sent"
  ).length;

  const monthly: Record<string, { invoiced: number; paid: number }> = {};
  for (const inv of invoices) {
    const mk = monthKey(inv.createdAt);
    monthly[mk] ??= { invoiced: 0, paid: 0 };
    monthly[mk].invoiced += inv.total;
  }
  for (const p of payments) {
    const mk = monthKey(p.paidAt);
    monthly[mk] ??= { invoiced: 0, paid: 0 };
    monthly[mk].paid += p.amount;
  }

  const monthlySorted = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]));

  const toastMessage = success ?? error ?? null;

  return (
        <><Toast message={toastMessage} />

        <div className={baseStyles.header}>
          <div>
            <p className={baseStyles.kicker}>Private tool</p>
            <h1>Tesorería</h1>
            <p>Control de ingresos, facturación y cobros.</p>
          </div>
        </div>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total facturado</span>
            <strong className={styles.statValue}>{formatCurrency(totalInvoiced)}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Cobrado</span>
            <strong className={styles.statValueGreen}>{formatCurrency(totalPaid)}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pendiente</span>
            <strong className={pending > 0 ? styles.statValueRed : styles.statValue}>
              {formatCurrency(pending)}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Facturas emitidas</span>
            <strong className={styles.statValue}>{invoices.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pendientes de pago</span>
            <strong className={styles.statValue}>{draftSentCount}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Vencidas</span>
            <strong className={overdueCount > 0 ? styles.statValueRed : styles.statValue}>
              {overdueCount}
            </strong>
          </div>
        </section>

        {overdueCount > 0 && (
          <section className={styles.alertBox}>
            <strong>{overdueCount} factura(s) vencida(s)</strong>
            <span>Revisa los cobros pendientes y contacta con los clientes.</span>
          </section>
        )}

        <section className={styles.monthlySection}>
          <h2>Ingresos mensuales</h2>
          <div className={styles.tableWrap}>
            <table className={styles.monthlyTable}>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Facturado</th>
                  <th>Cobrado</th>
                  <th>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {monthlySorted.map(([mk, data]) => {
                  const diff = Math.max(0, data.invoiced - data.paid);
                  return (
                    <tr key={mk}>
                      <td>{monthLabel(mk)}</td>
                      <td>{formatCurrency(data.invoiced)}</td>
                      <td className={styles.paidCell}>{formatCurrency(data.paid)}</td>
                      <td className={diff > 0 ? styles.dueCell : ""}>
                        {diff > 0 ? formatCurrency(diff) : "-"}
                      </td>
                    </tr>
                  );
                })}
                {monthlySorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className={baseStyles.empty}>Sin datos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.recentSection}>
          <h2>Últimos cobros</h2>
          <div className={styles.tableWrap}>
            <table className={styles.monthlyTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Factura</th>
                  <th>Proyecto</th>
                  <th>Importe</th>
                  <th>Método</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paidAt)}</td>
                    <td>{p.invoice.number}</td>
                    <td>{p.invoice.proforma.project.name}</td>
                    <td className={styles.paidCell}>{formatCurrency(p.amount)}</td>
                    <td>{p.method ?? "-"}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className={baseStyles.empty}>Sin cobros registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.recentSection}>
          <h2>Facturas pendientes</h2>
          <div className={styles.tableWrap}>
            <table className={styles.monthlyTable}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Proyecto</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((inv) => inv.status === "sent" || inv.status === "draft" || inv.status === "overdue")
                  .slice(0, 20)
                  .map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <a href={`/${locale}/account/tools/docs/invoices/${inv.id}?returnTo=${encodeURIComponent(`/${locale}/account/tools/docs/treasury`)}`}>
                          {inv.number}
                        </a>
                      </td>
                      <td>{inv.proforma.project.client.name}</td>
                      <td>{inv.proforma.project.name}</td>
                      <td>{formatCurrency(inv.total)}</td>
                      <td className={inv.status === "overdue" ? styles.dueCell : ""}>
                        {inv.status === "overdue" ? "Vencida" : inv.status === "sent" ? "Enviada" : "Borrador"}
                      </td>
                    </tr>
                  ))}
                {invoices.filter((inv) => inv.status === "sent" || inv.status === "draft" || inv.status === "overdue").length === 0 && (
                  <tr>
                    <td colSpan={5} className={baseStyles.empty}>No hay facturas pendientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
  </>);
}
