import type { ProductType } from "@repo/types";
import { toApiSegment, type SegmentSlug } from "../data/segments";

export type FetchResult =
  { ok: true; products: ProductType[] } | { ok: false; message: string };

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The product service can be asleep or restarting (Render answers 502/503
// while that happens). Retry a few times with a short pause so the page
// loads on its own instead of showing an error on the first hit.
const fetchWithRetry = async (url: string, attempts = 3): Promise<Response> => {
  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok || !RETRYABLE_STATUSES.has(res.status)) return res;
      lastResponse = res;
      lastError = undefined;
      console.error(
        `Product service responded with ${res.status} (attempt ${attempt}/${attempts})`,
      );
    } catch (error) {
      lastError = error;
      lastResponse = undefined;
      console.error(
        `Product service request failed (attempt ${attempt}/${attempts}):`,
        error,
      );
    }
    if (attempt < attempts) await sleep(2000 * attempt);
  }

  if (lastResponse) return lastResponse;
  throw lastError;
};

// Every request names its segment. The service treats "no segment" as
// "every segment", which is exactly the mixed list we never want to show.
export const fetchProducts = async ({
  segment,
  category,
  sort,
  search,
  limit,
}: {
  segment: SegmentSlug;
  category?: string;
  sort?: string;
  search?: string;
  limit?: number;
}): Promise<FetchResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

  if (!baseUrl) {
    console.error("NEXT_PUBLIC_PRODUCT_SERVICE_URL is not set");
    return {
      ok: false,
      message: "The product service is not configured.",
    };
  }

  // URLSearchParams encodes values safely and avoids stray "&" issues.
  const query = new URLSearchParams();
  query.set("segment", toApiSegment(segment));
  if (category && category !== "all") query.set("category", category);
  if (search) query.set("search", search);
  query.set("sort", sort || "newest");
  if (limit) query.set("limit", String(limit));

  try {
    const res = await fetchWithRetry(`${baseUrl}/products?${query.toString()}`);

    if (!res.ok) {
      console.error(`Product service responded with ${res.status}`);
      return {
        ok: false,
        message:
          "Our product service is having trouble right now. Please try again shortly.",
      };
    }

    const data: ProductType[] = await res.json();
    return { ok: true, products: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error("Failed to fetch products:", error);

    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return {
      ok: false,
      message: isTimeout
        ? "The request took too long. Please check your internet connection and try again."
        : "We couldn't reach the server. Please check your internet connection and try again.",
    };
  }
};