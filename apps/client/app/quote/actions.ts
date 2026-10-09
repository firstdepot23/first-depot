"use server";

import { headers } from "next/headers";
import { prisma } from "@repo/product-db";
import {
  createQuote,
  markQuoteEmail,
  type QuoteItem,
} from "@repo/quote-db";
import { sendMail } from "../lib/mailer";
import { PRICE_DIVISOR } from "./_config";
import { lineTotal } from "./format";
import { customerEmail, staffEmail } from "./quoteEmail";
import {
  issuesToErrors,
  quoteRequestSchema,
  type QuoteFieldErrors,
} from "./schema";

export type SubmitResult =
  | { ok: true; reference: string; emailed: boolean }
  | { ok: false; message: string; fieldErrors?: QuoteFieldErrors };

const NOTIFY_TO = process.env.QUOTE_NOTIFY_TO || "notifications@first-depot.com";

// Small per-instance limiter: 5 requests per 10 minutes per IP. It stops
// casual spam; it is not a replacement for a CAPTCHA if abuse grows.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 5;
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
};

const withTimeout = <T,>(p: Promise<T>, ms: number, what: string) =>
  Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);

export const submitQuoteAction = async (raw: unknown): Promise<SubmitResult> => {
  const parsed = quoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: issuesToErrors(parsed.error.issues),
    };
  }
  const input = parsed.data;

  // Bots fill the hidden field. Pretend it worked.
  if (input.website) return { ok: true, reference: "FD-RECEIVED", emailed: false };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return {
      ok: false,
      message: "Too many requests from your connection. Please try again in a few minutes.",
    };
  }

  // Never trust a catalogue price from the browser: look it up again.
  const ids = [
    ...new Set(
      input.items.flatMap((i) => (i.productId != null ? [i.productId] : [])),
    ),
  ];
  const catalog = new Map<number, { name: string; price: number }>();
  if (ids.length > 0) {
    try {
      const rows = await withTimeout(
        prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, price: true },
        }),
        8_000,
        "Product lookup",
      );
      rows.forEach((r) =>
        catalog.set(r.id, { name: r.name, price: r.price / PRICE_DIVISOR }),
      );
    } catch (error) {
      // Keep the request: the team will price those lines by hand.
      console.error("Quote: product lookup failed", error);
    }
  }

  const items: QuoteItem[] = input.items.map((i) => {
    if (i.productId != null) {
      const p = catalog.get(i.productId);
      if (p) {
        return {
          source: "catalog",
          productId: i.productId,
          name: p.name,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: p.price,
          lineTotal: lineTotal(i.quantity, p.price),
        };
      }
      // Product deleted or lookup failed: keep what they typed, unpriced.
      return {
        source: "custom",
        productId: null,
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: null,
        lineTotal: null,
      };
    }
    return {
      source: "custom",
      productId: null,
      name: i.name,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: lineTotal(i.quantity, i.unitPrice),
    };
  });

  const subtotal = items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
  const unpricedItems = items.filter((i) => i.lineTotal == null).length;

  let saved;
  try {
    saved = await createQuote({
      type: input.type,
      customer: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        location: input.location,
      },
      neededBy: input.neededBy,
      items,
      subtotal,
      unpricedItems,
      notes: input.notes,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    // The real reason is in the server log; in development it is also shown
    // on the page so it can be fixed without digging.
    console.error("Quote: save failed ->", detail);
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "production"
          ? "We couldn't save your request just now. Please try again, or email us directly."
          : `Could not save the request (${detail})`,
    };
  }

  // The request is safe in the database. Email problems never fail it.
  const staff = staffEmail(saved);
  const sent = await sendMail({
    to: NOTIFY_TO,
    replyTo: saved.customer.email,
    ...staff,
  });
  if (sent.ok) {
    await markQuoteEmail(saved.reference, "sent").catch(console.error);
    const c = customerEmail(saved);
    const conf = await sendMail({ to: saved.customer.email, replyTo: NOTIFY_TO, ...c });
    if (!conf.ok) console.error("Quote: customer confirmation failed:", conf.error);
  } else {
    console.error("Quote: staff email failed:", sent.error);
    await markQuoteEmail(
      saved.reference,
      sent.skipped ? "skipped" : "failed",
      sent.error,
    ).catch(console.error);
  }

  return { ok: true, reference: saved.reference, emailed: sent.ok };
};
