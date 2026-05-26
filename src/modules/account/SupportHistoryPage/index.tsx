import { getAuthUser } from "@/server/auth";
import { readJson } from "@/server/storage";
import type { Locale } from "@/lib/locale";
import type { BillingRecord } from "@/lib/types";
import { AccountNav } from "@/components/account/AccountNav";
import { hasAdminToolAccess } from "@/server/tool-access";
import { dashboardContent } from "@/modules/account/DashboardPage/content";
import styles from "./styles.module.css";

const statusLabels: Record<string, Record<Locale, string>> = {
  pending: { es: "Pendiente", en: "Pending" },
  paid: { es: "Pagado", en: "Paid" },
  expired: { es: "Expirado", en: "Expired" },
  failed: { es: "Fallido", en: "Failed" },
};

function formatDate(dateStr: string, locale: Locale) {
  return new Date(dateStr).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export async function SupportHistoryPage({ locale }: { locale: Locale }) {
  const user = await getAuthUser();
  const content = dashboardContent[locale].supportHistory;

  if (!user) {
    return <p>Not authenticated</p>;
  }

  const records =
    (await readJson<BillingRecord[]>("billing/sessions.json")) ?? [];
  const userRecords = records.filter((r) => r.customerEmail === user.email);

  return (
    <div className={styles.page}>
      <AccountNav locale={locale} showTools={hasAdminToolAccess(user.email)} />
      <div className={styles.content}>
        <h1 className={styles.heading}>{content.heading}</h1>

        {userRecords.length === 0 ? (
          <p className={styles.empty}>{content.noRecords}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{content.table.date}</th>
                <th>{content.table.product}</th>
                <th>{content.table.amount}</th>
                <th>{content.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {userRecords.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.createdAt, locale)}</td>
                  <td>{r.productKey}</td>
                  <td>{formatAmount(r.amountCents, r.currency)}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        styles[`status${r.status}`]
                      }`}
                    >
                      {statusLabels[r.status]?.[locale] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
