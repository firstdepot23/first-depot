import { cache } from "react";
import type { ProductType } from "@repo/types";

// The product service can be asleep or restarting (Render answers 502/503
// while that happens), so a couple of retries stop one slow wake-up from
// turning into an error page.
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loads one product. Returns `null` when it doesn't exist (the page turns that
 * into a 404) and throws for real failures (the error boundary handles those).
 *
 * Wrapped in cache() so generateMetadata and the page share ONE request
 * instead of fetching the same product twice per visit.
 */
export const getProduct = cache(
  async (id: string): Promise<ProductType | null> => {
    const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_PRODUCT_SERVICE_URL is not set");
    }

    let lastError: unknown = new Error("Product service did not respond");

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      let failedStatus: number | null = null;

      try {
        const res = await fetch(
          `${baseUrl}/products/${encodeURIComponent(id)}`,
          { cache: "no-store", signal: AbortSignal.timeout(15000) },
        );

        // Unknown id (or something that isn't an id at all): not found.
        if (res.status === 404 || res.status === 400) return null;

        if (res.ok) {
          const data: unknown = await res.json();
          return data && typeof data === "object" && "id" in data
            ? (data as ProductType)
            : null;
        }

        failedStatus = res.status;
        lastError = new Error(`Product service responded with ${res.status}`);
      } catch (error) {
        lastError = error;
        console.error(
          `Product fetch failed (attempt ${attempt}/${ATTEMPTS}):`,
          error,
        );
      }

      // A definite error that retrying won't fix: stop now.
      if (failedStatus !== null && !RETRYABLE_STATUSES.has(failedStatus)) {
        throw lastError;
      }
      if (attempt < ATTEMPTS) await sleep(1500 * attempt);
    }

    throw lastError;
  },
);