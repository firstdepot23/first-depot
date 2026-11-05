// The printable / shareable PDF for a quote, inquiry or sales order, laid out
// like the First Depot letterhead: dark top bar, mint logo tile + contact
// header, summary and items tables, the round seal and address stamp, and the
// dark footer bar. Rendered in the browser by @react-pdf/renderer
// (see QuotePdfButton).
import {
  Document,
  G,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { QuoteView } from "../lib/resendEmails";
import { LOGO_PATHS, LOGO_VIEWBOX } from "../lib/logoPaths";

// Change if you quote in another currency.
const CURRENCY = "UGX";

// Letterhead colours.
const DARK = "#054e3e"; // top bar, table headers, footer bar, headings
const TEXT = "#123d33"; // body text
const MUTED = "#4f6b62";
const TILE = "#bfe6d8"; // logo tile
const TINT = "#e3f2ec"; // label column / totals row
const LINE = "#cfe4db";

export type PdfSigner = {
  name: string;
  title: string;
  /** PNG data URL of the signature, or null to leave room for a pen signature. */
  signature: string | null;
};

/** Optional terms shown in the summary table. Blank ones are left out. */
export type PdfTerms = {
  validUntil: string;
  payment: string;
  delivery: string;
};

const NO_TERMS: PdfTerms = { validUntil: "", payment: "", delivery: "" };

const money = (n: number | null) =>
  n === null ? "-" : `${CURRENCY} ${n.toLocaleString("en-US")}`;

const TITLES: Record<QuoteView["type"], string> = {
  quote: "Quotation",
  inquiry: "Inquiry",
  "sales-order": "Sales order",
};

const INTRO: Record<QuoteView["type"], string> = {
  quote:
    "Thank you for your enquiry. We are pleased to submit our quotation for the items you requested. The detailed price list is below.",
  inquiry:
    "Thank you for your inquiry. We have recorded the items below and will respond with availability and prices.",
  "sales-order":
    "This sales order confirms the items below, as requested by the customer.",
};

const CLOSING: Record<QuoteView["type"], string[]> = {
  quote: [
    "Prices may change if quantities or specifications are altered. Any item we do not stock can be sourced on request.",
    "To proceed, reply to this quotation or call +256 781 905 753. You may also send a bill of quantities at first-depot.com/quote.",
  ],
  inquiry: [
    "We will contact you shortly on the phone number or email address above.",
  ],
  "sales-order": [
    "Please quote the order reference in all communication. To change an order, call +256 781 905 753.",
  ],
};

const longDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Kampala",
  });

const FOOTER_HEIGHT = 112;

const s = StyleSheet.create({
  page: {
    paddingTop: 116,
    paddingBottom: FOOTER_HEIGHT + 14,
    paddingHorizontal: 42,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: TEXT,
    lineHeight: 1.5,
  },

  // Letterhead (every page)
  topbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: DARK,
  },
  header: {
    position: "absolute",
    top: 24,
    left: 42,
    right: 42,
    height: 72,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: TILE,
    paddingBottom: 12,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  tile: {
    width: 54,
    height: 54,
    borderRadius: 9,
    backgroundColor: TILE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    lineHeight: 1.1,
    color: DARK,
    letterSpacing: 0.3,
  },
  brandSub: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: MUTED,
    letterSpacing: 2.2,
    lineHeight: 1.1,
    marginTop: 4,
  },
  contact: { fontSize: 7.5, textAlign: "right", color: DARK, lineHeight: 1.55 },
  bold: { fontFamily: "Helvetica-Bold" },

  // Body
  small: { fontSize: 8.5, color: MUTED },
  addressBlock: { marginTop: 12, marginBottom: 10 },
  dear: { marginBottom: 10 },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: DARK,
    textDecoration: "underline",
    marginBottom: 8,
  },
  paragraph: { marginBottom: 8 },

  th: {
    flexDirection: "row",
    backgroundColor: DARK,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 0.7,
    borderBottomColor: LINE,
  },
  summaryKey: {
    width: 150,
    backgroundColor: TINT,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryVal: { flex: 1, paddingVertical: 4, paddingHorizontal: 8 },

  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.7,
    borderBottomColor: LINE,
  },
  cNo: { width: 22 },
  cName: { flex: 1, paddingRight: 8 },
  cQty: { width: 62, textAlign: "right" },
  cPrice: { width: 86, textAlign: "right" },
  cTotal: { width: 96, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: TINT,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  notes: {
    marginTop: 12,
    padding: 9,
    backgroundColor: TINT,
    borderLeftWidth: 3,
    borderLeftColor: DARK,
  },
  noteLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  closing: { marginTop: 14 },
  signatureImg: {
    height: 44,
    objectFit: "contain",
    // Keep the signature at the left, above the name (not centred).
    objectPositionX: 0,
    marginTop: 4,
    marginBottom: 2,
  },
  signatureGap: { height: 46 },

  // Footer (every page). It needs an explicit height: without one the
  // absolutely positioned footer stretches over the whole page.
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: FOOTER_HEIGHT,
  },
  seals: {
    height: FOOTER_HEIGHT - 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 42,
  },
  sealRound: { width: 74, height: 74 },
  sealAddress: { width: 142, height: 75 },
  bar: {
    height: 28,
    backgroundColor: DARK,
    color: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 42,
    fontSize: 8,
  },
  barSide: { width: 70 },
  barCenter: { flex: 1, textAlign: "center" },
  barPage: { width: 70, textAlign: "right", fontFamily: "Helvetica-Bold" },
});

const Logo = () => (
  <Svg viewBox={LOGO_VIEWBOX} width={42} height={42}>
    {LOGO_PATHS.map((p, i) => {
      const path = (
        <Path d={p.d} fill={DARK} fillRule={p.fillRule ?? "nonzero"} />
      );
      return p.transform ? (
        <G key={i} transform={p.transform}>
          {path}
        </G>
      ) : (
        <G key={i}>{path}</G>
      );
    })}
  </Svg>
);

export const QuotePdfDocument = ({
  quote,
  signer,
  terms = NO_TERMS,
  origin,
}: {
  quote: QuoteView;
  signer: PdfSigner;
  /** Optional. A missing value must never stop the PDF from rendering. */
  terms?: PdfTerms;
  /** Where /round-seal.png and /address-stamp.png are served from. */
  origin: string;
}) => {
  const c = quote.customer;
  const created = quote.createdAt || new Date().toISOString();
  const title = TITLES[quote.type];

  const summary: [string, string][] = [
    [`${title} number`, quote.reference],
    ["Total", money(quote.subtotal)],
  ];
  if (quote.neededBy) summary.push(["Needed by", quote.neededBy]);
  const validUntil = terms?.validUntil?.trim();
  const payment = terms?.payment?.trim();
  const delivery = terms?.delivery?.trim();
  if (validUntil) summary.push(["Valid until", validUntil]);
  if (payment) summary.push(["Payment", payment]);
  if (delivery) summary.push(["Delivery", delivery]);

  const about =
    quote.items.length === 1
      ? (quote.items[0]?.name ?? "your request")
      : `${quote.items.length} requested items`;

  return (
    <Document title={quote.reference} author="First Depot Hardwares Limited">
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={s.topbar} fixed />
        <View style={s.header} fixed>
          <View style={s.brand}>
            <View style={s.tile}>
              <Logo />
            </View>
            <View>
              <Text style={s.brandName}>FIRST DEPOT</Text>
              <Text style={s.brandSub}>HARDWARES LIMITED</Text>
            </View>
          </View>
          <View>
            <Text style={s.contact}>
              <Text style={s.bold}>+256 781 905 753</Text>
              {"   "}WhatsApp +256 777 433 635
            </Text>
            <Text style={s.contact}>
              support@first-depot.com | first-depot.com
            </Text>
            <Text style={s.contact}>Ojwina Road - Wigweng, Barogole,</Text>
            <Text style={s.contact}>Lira City West, Lira City, Uganda</Text>
            <Text style={s.contact}>P. O. Box 332500, LIRA</Text>
          </View>
        </View>

        {/* Body */}
        <Text style={s.small}>Ref: {quote.reference}</Text>
        <Text style={s.small}>Date: {longDate(created)}</Text>

        <View style={s.addressBlock}>
          <Text style={s.bold}>{c.name}</Text>
          {c.company ? <Text>{c.company}</Text> : null}
          {c.location ? <Text>{c.location}</Text> : null}
          <Text>
            {c.phone} | {c.email}
          </Text>
        </View>

        <Text style={s.dear}>Dear {c.name},</Text>
        <Text style={s.heading}>
          {title} for {about}
        </Text>
        <Text style={s.paragraph}>{INTRO[quote.type]}</Text>

        {/* Summary */}
        <View wrap={false} style={{ marginBottom: 12 }}>
          <View style={s.th}>
            <Text style={{ width: 150 }}>Summary</Text>
            <Text>Details</Text>
          </View>
          {summary.map(([key, value]) => (
            <View key={key} style={s.summaryRow}>
              <Text style={s.summaryKey}>{key}</Text>
              <Text style={s.summaryVal}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Items */}
        <View style={s.th} wrap={false}>
          <Text style={s.cNo}>#</Text>
          <Text style={s.cName}>Item</Text>
          <Text style={s.cQty}>Qty</Text>
          <Text style={s.cPrice}>Unit price</Text>
          <Text style={s.cTotal}>Total</Text>
        </View>
        {quote.items.map((item, i) => (
          <View key={i} style={s.row} wrap={false}>
            <Text style={s.cNo}>{i + 1}</Text>
            <Text style={s.cName}>{item.name}</Text>
            <Text style={s.cQty}>
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ""}
            </Text>
            <Text style={s.cPrice}>{money(item.unitPrice)}</Text>
            <Text style={s.cTotal}>{money(item.lineTotal)}</Text>
          </View>
        ))}
        <View wrap={false}>
          <View style={s.totalRow}>
            <Text>Total</Text>
            <Text>{money(quote.subtotal)}</Text>
          </View>
          {quote.unpricedItems > 0 ? (
            <Text style={[s.small, { marginTop: 4 }]}>
              {quote.unpricedItems} item{quote.unpricedItems === 1 ? "" : "s"}{" "}
              not priced yet and not included in the total.
            </Text>
          ) : null}
        </View>

        {quote.notes ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.noteLabel}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Sign-off: kept together so a signature never lands alone on a page */}
        <View style={s.closing} wrap={false}>
          {CLOSING[quote.type].map((text) => (
            <Text key={text} style={s.paragraph}>
              {text}
            </Text>
          ))}
          <Text style={{ marginTop: 4 }}>Yours sincerely,</Text>
          {signer.signature ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={signer.signature} style={s.signatureImg} />
          ) : (
            <View style={s.signatureGap} />
          )}
          <Text style={s.bold}>{signer.name}</Text>
          {signer.title ? <Text>{signer.title}</Text> : null}
          <Text>First Depot Hardwares Limited</Text>
        </View>

        {/* Footer with the company stamps */}
        <View style={s.footer} fixed>
          <View style={s.seals}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={`${origin}/round-seal.png`} style={s.sealRound} />
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={`${origin}/address-stamp.png`} style={s.sealAddress} />
          </View>
          <View style={s.bar}>
            <View style={s.barSide} />
            <Text style={s.barCenter}>
              Building comfort for your home · first-depot.com · @firstdepot23
            </Text>
            <Text
              style={s.barPage}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
};
