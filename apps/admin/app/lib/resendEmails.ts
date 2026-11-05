// admin app: lib/resendEmails.ts
//
// Reads the company mailbox. Three sources are merged into one list:
//   1. Emails SENT by the company      -> Resend  GET /emails
//   2. Emails RECEIVED by the company  -> Resend  GET /emails/receiving
//   3. Quote / inquiry / sales-order requests customers submitted (these are
//      emails to the company as well, and they carry the real data the PDF
//      is built from)                  -> quote-db
//
// Needs RESEND_FULL_ACCESS_KEY in the ADMIN app's environment: a Full access
// key, because a "sending access" key can send but cannot list emails. The
// email service keeps using its own sending-only RESEND_API_KEY.
// Receiving only returns data once inbound email is enabled for your domain
// in the Resend dashboard (Emails -> Receiving). Until then the page still
// works and shows a notice instead of failing.
import "server-only";
import {
  getQuotes,
  getQuoteByReference,
  countNewQuotes,
  type QuotePlain,
} from "@repo/quote-db";

const API = "https://api.resend.com";

export type Folder = "all" | "sent" | "received";

export type MailRow = {
  /** s-<resend id> | r-<resend id> | q-<quote reference> */
  id: string;
  direction: "sent" | "received";
  kind: "email" | "quote";
  from: string;
  to: string[];
  subject: string;
  createdAt: string; // ISO
  status: string; // delivered, bounced, ... or new, quoted, ... for quotes
  quoteReference: string | null;
};

export type MailDetail = MailRow & {
  html: string | null;
  text: string | null;
  quote: QuoteView | null;
};

/** Plain, serialisable copy of a quote (safe to pass to client components). */
export type QuoteView = {
  reference: string;
  type: QuotePlain["type"];
  status: QuotePlain["status"];
  customer: QuotePlain["customer"];
  neededBy: string;
  items: QuotePlain["items"];
  subtotal: number;
  unpricedItems: number;
  notes: string;
  createdAt: string;
};

export const toQuoteView = (q: QuotePlain): QuoteView => ({
  reference: q.reference,
  type: q.type,
  status: q.status,
  customer: { ...q.customer },
  neededBy: q.neededBy,
  items: q.items.map((i) => ({ ...i })),
  subtotal: q.subtotal,
  unpricedItems: q.unpricedItems,
  notes: q.notes,
  createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : "",
});

const QUOTE_REF = /FD-\d{8}-[A-HJ-NP-Z2-9]{4}/;
export const findQuoteReference = (...parts: (string | null | undefined)[]) =>
  parts.join(" ").match(QUOTE_REF)?.[0] ?? null;

// Resend returns "2025-10-09 14:37:40.951732+00"; make it a valid ISO date.
const toIso = (value: string | undefined): string => {
  if (!value) return "";
  const fixed = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const d = new Date(fixed);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
};

class ResendError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const resendGet = async <T>(path: string): Promise<T> => {
  const key = process.env.RESEND_FULL_ACCESS_KEY;
  if (!key) {
    throw new ResendError("RESEND_FULL_ACCESS_KEY is not set for the admin app.", 0);
  }

  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      typeof body?.message === "string" ? body.message : `HTTP ${res.status}`;
    throw new ResendError(message, res.status);
  }
  return (await res.json()) as T;
};

type ResendListItem = {
  id: string;
  from: string;
  to: string[] | string;
  subject: string | null;
  created_at: string;
  last_event?: string;
};
type ResendList = { data: ResendListItem[] };

const asArray = (v: string[] | string | undefined) =>
  Array.isArray(v) ? v : v ? [v] : [];

const quoteSubjectLabel: Record<QuotePlain["type"], string> = {
  "sales-order": "Sales order",
  inquiry: "Inquiry",
  quote: "Quote request",
};

const quoteRow = (q: QuotePlain): MailRow => ({
  id: `q-${q.reference}`,
  direction: "received",
  kind: "quote",
  from: `${q.customer.name} <${q.customer.email}>`,
  to: ["FIRST DEPOT"],
  subject: `${quoteSubjectLabel[q.type]} ${q.reference}`,
  createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : "",
  status: q.status,
  quoteReference: q.reference,
});

export type Mailbox = { rows: MailRow[]; warnings: string[] };

export const getMailbox = async (limit = 50): Promise<Mailbox> => {
  // Two Resend calls at once is within the default 2 requests/second limit.
  const [sent, received, quotes] = await Promise.allSettled([
    resendGet<ResendList>(`/emails?limit=${limit}`),
    resendGet<ResendList>(`/emails/receiving?limit=${limit}`),
    getQuotes(limit),
  ]);

  const warnings: string[] = [];
  const rows: MailRow[] = [];

  if (sent.status === "fulfilled") {
    for (const e of sent.value.data ?? []) {
      rows.push({
        id: `s-${e.id}`,
        direction: "sent",
        kind: "email",
        from: e.from,
        to: asArray(e.to),
        subject: e.subject ?? "(no subject)",
        createdAt: toIso(e.created_at),
        status: e.last_event ?? "sent",
        quoteReference: findQuoteReference(e.subject),
      });
    }
  } else {
    warnings.push(
      sent.reason instanceof ResendError && sent.reason.status === 401
        ? "Sent emails are unavailable: RESEND_FULL_ACCESS_KEY is invalid or not a Full access key."
        : `Sent emails could not be loaded: ${(sent.reason as Error).message}`,
    );
  }

  if (received.status === "fulfilled") {
    for (const e of received.value.data ?? []) {
      rows.push({
        id: `r-${e.id}`,
        direction: "received",
        kind: "email",
        from: e.from,
        to: asArray(e.to),
        subject: e.subject ?? "(no subject)",
        createdAt: toIso(e.created_at),
        status: "received",
        quoteReference: findQuoteReference(e.subject),
      });
    }
  } else {
    warnings.push(
      `Received emails could not be loaded (is receiving enabled for your domain in Resend?): ${(received.reason as Error).message}`,
    );
  }

  if (quotes.status === "fulfilled") {
    rows.push(...quotes.value.map(quoteRow));
  } else {
    warnings.push(
      `Quote requests could not be loaded: ${(quotes.reason as Error).message}`,
    );
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { rows, warnings };
};

type ResendFull = ResendListItem & {
  html?: string | null;
  text?: string | null;
};

export const getMailDetail = async (id: string): Promise<MailDetail | null> => {
  const prefix = id.slice(0, 2);
  const rest = id.slice(2);

  if (prefix === "q-") {
    const quote = await getQuoteByReference(rest);
    if (!quote) return null;
    return {
      ...quoteRow(quote),
      html: null,
      text: null,
      quote: toQuoteView(quote),
    };
  }

  if (prefix !== "s-" && prefix !== "r-") return null;
  const sent = prefix === "s-";

  let e: ResendFull;
  try {
    e = await resendGet<ResendFull>(
      sent ? `/emails/${rest}` : `/emails/receiving/${rest}`,
    );
  } catch (error) {
    if (error instanceof ResendError && error.status === 404) return null;
    throw error;
  }

  const subject = e.subject ?? "(no subject)";
  // The email service puts the quote reference in the subject or body.
  const reference = findQuoteReference(subject, e.text, e.html);
  const quotePlain = reference ? await getQuoteByReference(reference) : null;

  return {
    id,
    direction: sent ? "sent" : "received",
    kind: "email",
    from: e.from,
    to: asArray(e.to),
    subject,
    createdAt: toIso(e.created_at),
    status: sent ? (e.last_event ?? "sent") : "received",
    quoteReference: reference,
    html: e.html ?? null,
    text: e.text ?? null,
    quote: quotePlain ? toQuoteView(quotePlain) : null,
  };
};

/** Number shown on the sidebar Inbox item: quote requests nobody has handled yet. */
export const getInboxCount = async (): Promise<number> => {
  try {
    return await countNewQuotes();
  } catch (error) {
    console.error("getInboxCount failed:", error);
    return 0;
  }
};