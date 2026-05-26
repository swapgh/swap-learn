import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Locale } from "@/lib/locale";
import {
  formatSwapDocsCurrency,
  formatSwapDocsDate,
  isInternalTemplateNote,
  publicDocumentDescription,
  swapDocsDocumentLabel,
  swapDocsPaymentMethodLabel,
  swapDocsPaymentTermsLabel,
} from "@/modules/tools/swapdocs-i18n";

type PdfItem = {
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
};

type PdfInvoice = {
  number: string;
  issueDate: Date;
  dueDate: Date | null;
  subtotal: number;
  discount: number;
  ivaRate: number;
  ivaAmount: number;
  total: number;
  ivaType: string;
  paymentMethod?: string | null;
  paymentTerms?: string | null;
  notes: string | null;
  status: string;
  proforma: {
    number: string;
    project: {
      name: string;
      client: {
        name: string;
        nifCif: string | null;
        address: string | null;
        email: string | null;
        country: string;
        vatId: string | null;
      };
    };
  };
  items: PdfItem[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 34,
    paddingBottom: 170,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#172033",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#d9dee8",
    paddingBottom: 10,
    marginBottom: 12,
  },
  kicker: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  right: {
    alignItems: "flex-end",
    textAlign: "right",
  },
  logo: {
    width: 42,
    height: 42,
    objectFit: "contain",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  muted: {
    color: "#6b7280",
    marginBottom: 2,
  },
  parties: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  partyBox: {
    flex: 1,
    backgroundColor: "#f6f7f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
  },
  partyName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f1f4",
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    fontSize: 9,
  },
  headerCell: {
    backgroundColor: "#f6f7f9",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  desc: { flex: 4 },
  hours: { flex: 1, textAlign: "right" },
  rate: { flex: 1, textAlign: "right" },
  amount: { flex: 1.2, textAlign: "right" },
  totals: {
    marginLeft: "auto",
    width: "45%",
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  totalLabel: {
    color: "#6b7280",
  },
  totalValue: {
    textAlign: "right",
  },
  netTotal: {
    fontWeight: "bold",
    fontSize: 13,
    borderTopWidth: 1,
    borderTopColor: "#172033",
    paddingTop: 5,
    marginTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  notes: {
    backgroundColor: "#f6f7f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6b7280",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  footer: {
    bottom: 94,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 34,
    position: "absolute",
    right: 34,
  },
  signatureBlock: {
    width: "40%",
  },
  signatureBox: {
    borderTopWidth: 1,
    borderTopColor: "#172033",
    marginTop: 7,
    width: "100%",
  },
  legalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#d9dee8",
    bottom: 34,
    left: 34,
    paddingTop: 7,
    position: "absolute",
    right: 34,
    color: "#6b7280",
    fontSize: 7,
    lineHeight: 1.35,
    textAlign: "center",
  },
  legalParagraph: {
    marginBottom: 4,
  },
});

export function SwapDocsInvoicePdfDocument({ invoice, locale = "es" }: { invoice: PdfInvoice; locale?: Locale }) {
  const label = (key: string) => swapDocsDocumentLabel(locale, key);
  const fmt = (n: number) => formatSwapDocsCurrency(locale, n);
  const fmtDate = (d: Date) => formatSwapDocsDate(locale, new Date(d), { day: "2-digit", month: "long", year: "numeric" });
  const visibleNotes = isInternalTemplateNote(invoice.notes) ? null : invoice.notes;
  const paymentTerms = invoice.paymentTerms
    ? swapDocsPaymentTermsLabel(locale, invoice.paymentTerms)
    : label("invoiceFallbackTerms");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>{label("invoice")}</Text>
            <Text style={styles.title}>{invoice.number}</Text>
            <Text style={styles.muted}>{label("issued")}: {fmtDate(invoice.issueDate)}</Text>
            {invoice.dueDate && (
              <Text style={styles.muted}>{label("dueDate")}: {fmtDate(invoice.dueDate)}</Text>
            )}
          </View>
          <View style={styles.right}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image does not support alt. */}
            <Image src="public/images/misc/logo_negro_transparente_RGBA.png" style={styles.logo} />
            <Text style={styles.companyName}>Swap</Text>
            <Text style={styles.muted}>swap.com.es</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.partyBox}>
            <Text style={styles.kicker}>{label("client")}</Text>
            <Text style={styles.partyName}>{invoice.proforma.project.client.name}</Text>
            <Text style={styles.muted}>{invoice.proforma.project.client.nifCif || label("missingTaxId")}</Text>
            <Text style={styles.muted}>{invoice.proforma.project.client.address || label("missingAddress")}</Text>
            <Text style={styles.muted}>{invoice.proforma.project.client.email || label("missingEmail")}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.kicker}>{label("project")}</Text>
            <Text style={styles.partyName}>{invoice.proforma.project.name}</Text>
            <Text style={styles.muted}>{label("paymentMethod")}: {swapDocsPaymentMethodLabel(locale, invoice.paymentMethod)}</Text>
            <Text style={styles.muted}>{paymentTerms}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{label("concepts")}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.headerCell, styles.desc]}>{label("description")}</Text>
            <Text style={[styles.cell, styles.headerCell, styles.amount]}>{label("total")}</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, styles.desc]}>{publicDocumentDescription(locale, item.description)}</Text>
              <Text style={[styles.cell, styles.amount]}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{label("subtotal")}</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{label("discount")}</Text>
              <Text style={styles.totalValue}>-{fmt(invoice.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({invoice.ivaRate}%)</Text>
            <Text style={styles.totalValue}>{fmt(invoice.ivaAmount)}</Text>
          </View>
          <View style={styles.netTotal}>
            <Text>{label("total")}</Text>
            <Text>{fmt(invoice.total)}</Text>
          </View>
        </View>

        {visibleNotes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>{label("notes")}</Text>
            <Text>{visibleNotes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.muted}>{label("issuerSignature")}</Text>
            <View style={styles.signatureBox} />
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.muted}>{label("clientSignature")}</Text>
            <View style={styles.signatureBox} />
          </View>
        </View>

        <View style={styles.legalFooter}>
          <Text style={styles.legalParagraph}>{label("invoiceLegal1")}</Text>
          <Text>{label("invoiceLegal2")}</Text>
        </View>
      </Page>
    </Document>
  );
}
