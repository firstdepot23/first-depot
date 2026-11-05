// Real numbers for the dashboard charts.
//
//   orders   -> order service   GET /orders?limit=...   (same call CardList makes)
//   quotes   -> quote-db        (customer quote / inquiry / sales-order requests)
//   products -> product service GET /products           (same call the products page makes)
//
// Everything is fetched once per request (React cache), so the three charts
// share one set of calls. A source that fails does not break the others: the
// chart that needs it shows a short notice instead.
import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { getQuotes } from "@repo/quote-db";
import {
  SEGMENT_LABELS,
  SEGMENT_ORDER,
  type OrderType,
  type Segment,
} from "@repo/types";
import { fetchProducts } from "../lib/fetchProducts";

const TZ = "Africa/Kampala";
const MONTHS = 6;
const ORDER_LIMIT = 1000;

// CardList shows `order.amount` as UGX as it is. If your payment service
// stores minor units (the order email divides by 100), set this to 100.
const AMOUNT_DIVISOR = 1;

export type MonthStat = {
  /** "2026-10" */
  key: string;
  /** "Oct" */
  label: string;
  /** "October 2026" (tooltip title) */
  full: string;
  /** Successful orders. */
  orders: number;
  /** Customer quote / inquiry / sales-order requests. */
  quotes: number;
  /** Sum of successful orders, in UGX. */
  revenue: number;
};

export type SegmentStat = {
  segment: Segment;
  label: string;
  count: number;
};

export type DashboardStats = {
  months: MonthStat[];
  segments: SegmentStat[];
  /** Which sources could not be loaded, per chart. */
  failed: { orders: boolean; quotes: boolean; products: boolean };
};

const partsOf = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: get("year"), month: get("month") };
};

const keyOf = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const monthKeyOf = (date: Date) => {
  const { year, month } = partsOf(date);
  return keyOf(year, month);
};

/** The last `count` calendar months (in Uganda time), oldest first, all zeros. */
export const emptyMonths = (now: Date, count = MONTHS): MonthStat[] => {
  const { year, month } = partsOf(now);
  const out: MonthStat[] = [];

  for (let back = count - 1; back >= 0; back--) {
    const index = year * 12 + (month - 1) - back;
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    const first = new Date(Date.UTC(y, m - 1, 1));
    out.push({
      key: keyOf(y, m),
      label: first.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
      full: first.toLocaleString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      orders: 0,
      quotes: 0,
      revenue: 0,
    });
  }
  return out;
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

type OrderLike = { status?: string; amount?: number; createdAt?: unknown };

/** Pure: puts orders and quotes into the month buckets. */
export const bucketMonths = (
  months: MonthStat[],
  orders: OrderLike[],
  quoteDates: unknown[],
): MonthStat[] => {
  const byKey = new Map(months.map((m) => [m.key, { ...m }]));

  for (const order of orders) {
    if (order.status !== "success") continue; // failed payments are not sales
    const date = toDate(order.createdAt);
    const bucket = date ? byKey.get(monthKeyOf(date)) : undefined;
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += Math.round((Number(order.amount) || 0) / AMOUNT_DIVISOR);
  }

  for (const value of quoteDates) {
    const date = toDate(value);
    const bucket = date ? byKey.get(monthKeyOf(date)) : undefined;
    if (bucket) bucket.quotes += 1;
  }

  return months.map((m) => byKey.get(m.key) ?? m);
};

const fetchOrders = async (token: string | null): Promise<OrderType[]> => {
  const base = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_ORDER_SERVICE_URL is not set");
  if (!token) throw new Error("No auth token for the order service");

  const res = await fetch(`${base.replace(/\/+$/, "")}/orders?limit=${ORDER_LIMIT}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Order service responded with ${res.status}`);

  const data: unknown = await res.json();
  if (Array.isArray(data)) return data as OrderType[];
  const wrapped = (data as { orders?: unknown } | null)?.orders;
  if (Array.isArray(wrapped)) return wrapped as OrderType[];
  throw new Error("Unexpected orders response shape");
};

const countSegments = (products: unknown[]): SegmentStat[] => {
  const counts = new Map<string, number>();
  for (const p of products) {
    const segment = (p as { segment?: string }).segment;
    if (segment) counts.set(segment, (counts.get(segment) ?? 0) + 1);
  }
  return SEGMENT_ORDER.map((segment) => ({
    segment,
    label: SEGMENT_LABELS[segment],
    count: counts.get(segment) ?? 0,
  }));
};

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const { getToken } = await auth();
  const token = await getToken();

  const productBase = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

  const [orders, quotes, products] = await Promise.allSettled([
    fetchOrders(token),
    getQuotes(ORDER_LIMIT),
    productBase
      ? fetchProducts(productBase)
      : Promise.reject(new Error("NEXT_PUBLIC_PRODUCT_SERVICE_URL is not set")),
  ]);

  for (const [name, result] of [
    ["orders", orders],
    ["quotes", quotes],
    ["products", products],
  ] as const) {
    if (result.status === "rejected") {
      console.error(`Dashboard: could not load ${name}:`, result.reason);
    }
  }

  const months = bucketMonths(
    emptyMonths(new Date()),
    orders.status === "fulfilled" ? (orders.value as OrderLike[]) : [],
    quotes.status === "fulfilled" ? quotes.value.map((q) => q.createdAt) : [],
  );

  return {
    months,
    segments: countSegments(products.status === "fulfilled" ? products.value : []),
    failed: {
      orders: orders.status === "rejected",
      quotes: quotes.status === "rejected",
      products: products.status === "rejected",
    },
  };
});