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
  hours: number;
  rate: number;
  amount: number;
  clientPrice?: number;
};

type PdfProforma = {
  number: string;
  issueDate: Date;
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
  project: {
    name: string;
    status: string;
    client: {
      name: string;
      nifCif: string | null;
      address: string | null;
      email: string | null;
      country: string;
      vatId: string | null;
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
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerCell: {
    backgroundColor: "#f6f7f9",
    color: "#6b7280",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  desc: {
    flex: 4,
  },
  numeric: {
    flex: 1,
    textAlign: "right",
  },
  totals: {
    width: 230,
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: "#172033",
    marginTop: 4,
    paddingTop: 7,
    fontSize: 12,
    fontWeight: "bold",
  },
  notes: {
    backgroundColor: "#f6f7f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  signatures: {
    bottom: 94,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 34,
    position: "absolute",
    right: 34,
  },
  signatureBox: {
    width: "40%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#172033",
    marginBottom: 7,
    width: "100%",
  },
  signatureLabel: {
    textAlign: "center",
    color: "#6b7280",
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

export function SwapDocsProformaPdfDocument({
  proforma,
  locale = "es",
}: {
  proforma: PdfProforma;
  locale?: Locale;
}) {
  const visibleNotes = isInternalTemplateNote(proforma.notes) ? null : proforma.notes;
  const label = (key: string) => swapDocsDocumentLabel(locale, key);
  const formatCurrency = (value: number) => formatSwapDocsCurrency(locale, value);
  const formatDate = (value: Date) => formatSwapDocsDate(locale, value, { day: "2-digit", month: "long", year: "numeric" });
  const paymentTerms = proforma.paymentTerms
    ? swapDocsPaymentTermsLabel(locale, proforma.paymentTerms)
    : label("proformaFallbackTerms");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>{label("proforma")}</Text>
            <Text style={styles.title}>{proforma.number}</Text>
            <Text style={styles.muted}>{formatDate(proforma.issueDate)}</Text>
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
            <Text style={styles.partyName}>{proforma.project.client.name}</Text>
            <Text style={styles.muted}>{proforma.project.client.nifCif || label("missingTaxId")}</Text>
            <Text style={styles.muted}>{proforma.project.client.address || label("missingAddress")}</Text>
            <Text style={styles.muted}>{proforma.project.client.email || label("missingEmail")}</Text>
            {proforma.project.client.vatId && (
              <Text style={styles.muted}>VAT: {proforma.project.client.vatId}</Text>
            )}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.kicker}>{label("project")}</Text>
            <Text style={styles.partyName}>{proforma.project.name}</Text>
            <Text style={styles.muted}>{label("paymentMethod")}: {swapDocsPaymentMethodLabel(locale, proforma.paymentMethod)}</Text>
            <Text style={styles.muted}>{paymentTerms}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{label("concepts")}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.headerCell, styles.desc]}>{label("description")}</Text>
            <Text style={[styles.cell, styles.headerCell, styles.numeric]}>{label("amount")}</Text>
          </View>
          {proforma.items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.row}>
              <Text style={[styles.cell, styles.desc]}>{publicDocumentDescription(locale, item.description)}</Text>
              <Text style={[styles.cell, styles.numeric]}>{formatCurrency(item.clientPrice ?? item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{label("subtotal")}</Text>
            <Text>{formatCurrency(proforma.subtotal)}</Text>
          </View>
          {proforma.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>{label("discount")}</Text>
              <Text>-{formatCurrency(proforma.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>IVA ({proforma.ivaRate}%)</Text>
            <Text>{formatCurrency(proforma.ivaAmount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>{label("total")}</Text>
            <Text>{formatCurrency(proforma.total)}</Text>
          </View>
        </View>

        {visibleNotes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>{label("notes")}</Text>
            <Text>{visibleNotes}</Text>
          </View>
        )}

        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{label("issuerSignature")}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{label("clientSignature")}</Text>
          </View>
        </View>

        <View style={styles.legalFooter}>
          <Text style={styles.legalParagraph}>{label("proformaLegal1")}</Text>
          <Text>{label("proformaLegal2")}</Text>
        </View>
      </Page>
    </Document>
  );
}
