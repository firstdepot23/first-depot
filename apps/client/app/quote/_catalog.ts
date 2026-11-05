import { Segment } from "@repo/product-db";

/**
 * The quote tool is for HARDWARE and building materials only. Groceries and
 * pharmacy products are bought through their own sections (and prescription
 * medicines are never priced or sold through a quote).
 *
 * This is the single place that says so. The page uses it to decide which
 * products to offer, and the server action uses it again when it re-prices a
 * request, because the browser can send any product id it likes.
 *
 * Kept out of _config.ts on purpose: that file is also used by the form in
 * the browser, and this one pulls in the database client.
 */
export const QUOTE_PRODUCT_FILTER = { segment: Segment.HARDWARE } as const;