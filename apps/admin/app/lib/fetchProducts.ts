import type { ProductsType } from "@repo/types";

export type FetchProductsOptions = {
  timeoutMs?: number;
  attempts?: number;
  retryDelayMs?: number;
  // HARDWARE | GROCERY | PHARMACY. Omit for every segment.
  segment?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The product service answers with a plain list. A list wrapped in an object
// ({ products: [...] } and similar) is accepted too, in case a proxy or a
// different version of the service wraps it.
const WRAPPER_KEYS = ["products", "data", "items", "results"];

export const extractProducts = (data: unknown): ProductsType | null => {
  if (Array.isArray(data)) return data as ProductsType;

  if (typeof data === "object" && data !== null) {
    for (const key of WRAPPER_KEYS) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as ProductsType;
    }
  }
  return null;
};

// A health-check reply ({"status":"ok", ...}) where products were expected
// means a different program is answering at this address.
const isHealthReply = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  (value as Record<string, unknown>).status === "ok";

// A short, one-line preview of what the server sent, for error messages.
const snippet = (text: string) => {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "(empty body)";
  return flat.length > 200 ? `${flat.slice(0, 200)}...` : flat;
};

const describeFetchError = (error: unknown, url: string, timeoutMs: number) => {
  if (error instanceof Error && error.name === "TimeoutError") {
    return new Error(
      `The product service did not answer within ${timeoutMs / 1000}s (${url}). It may be waking up.`,
    );
  }
  if (error instanceof Error) {
    // Node puts the real reason (ECONNREFUSED, ENOTFOUND...) in `cause`.
    const code = (error.cause as { code?: string } | undefined)?.code;
    return new Error(
      `Could not reach the product service at ${url}: ${error.message}${code ? ` (${code})` : ""}`,
    );
  }
  return new Error(`Could not reach the product service at ${url}`);
};

/**
 * Loads the product list. Retries a couple of times for a service that is
 * still waking up, and every failure says WHAT came back (status, type and
 * the start of the body), so a wrong URL or a stray proxy page is obvious
 * from the error alone.
 */
export const fetchProducts = async (
  baseUrl: string,
  options: FetchProductsOptions = {},
): Promise<ProductsType> => {
  const {
    timeoutMs = 20_000,
    attempts = 3,
    retryDelayMs = 2_000,
    segment,
  } = options;
  const url = `${baseUrl.replace(/\/+$/, "")}/products${
    segment ? `?segment=${encodeURIComponent(segment)}` : ""
  }`;

  let lastError = new Error(`Could not load products from ${url}`);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let retry = true;

    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = await res.text();

      if (!res.ok) {
        lastError = new Error(
          `Product service responded with ${res.status} for ${url}: ${snippet(body)}`,
        );
        // 4xx (except "timeout" and "slow down") won't fix themselves.
        retry = res.status >= 500 || res.status === 408 || res.status === 429;
      } else {
        let parsed: { ok: true; value: unknown } | { ok: false } = { ok: false };
        try {
          parsed = { ok: true, value: JSON.parse(body) };
        } catch {
          // not JSON: handled below
        }

        if (!parsed.ok) {
          lastError = new Error(
            `${url} did not return JSON (${res.headers.get("content-type") ?? "no content-type"}): ${snippet(body)}`,
          );
        } else {
          const products = extractProducts(parsed.value);
          if (products) return products;

          lastError = new Error(
            `${url} returned JSON that is not a product list (HTTP ${res.status}): ${snippet(body)}` +
              (isHealthReply(parsed.value)
                ? " | This is a health-check reply, so a different program is answering at this address instead of the product service. Check which port the product service actually started on, and what else is using this one."
                : ""),
          );
        }
      }
    } catch (error) {
      lastError = describeFetchError(error, url, timeoutMs);
    }

    if (!retry || attempt === attempts) break;
    await sleep(retryDelayMs);
  }

  throw lastError;
};