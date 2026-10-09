import { ProductType } from "@repo/types";
import Categories from "./Categories";
import ProductCard from "./ProductCard";
import Link from "next/link";
import Filter from "./Filter";
import RetryButton from "./RetryButton";
import { categories } from "../data/categoryData";

type FetchResult =
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

const fetchData = async ({
  category,
  sort,
  search,
  params,
}: {
  category?: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
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
  if (category) query.set("category", category);
  if (search) query.set("search", search);
  query.set("sort", sort || "newest");
  if (params === "homepage") query.set("limit", "10");

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

const Chevron = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-3 w-3"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 3l5 5-5 5" />
  </svg>
);

const ProductList = async ({
  category,
  sort,
  search,
  params,
}: {
  category: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}) => {
  const result = await fetchData({ category, sort, search, params });

  const categoryName = category
    ? (categories.find((c) => c.slug === category)?.name ?? category)
    : undefined;

  // Heading follows what the visitor is looking at.
  const title = search
    ? `Results for \u201C${search}\u201D`
    : (categoryName ??
      (params === "homepage" ? "New arrivals" : "All products"));

  const subtitle = !result.ok
    ? "Everything you need to build comfort at home."
    : params === "homepage"
      ? "Fresh stock for building comfort at home."
      : `${result.products.length} ${
          result.products.length === 1 ? "product" : "products"
        }${categoryName && search ? ` in ${categoryName}` : ""}`;

  return (
    <section className="w-full pb-4">
      {/*<Categories />
      {params === "products" && <Filter />}*/}

      {/* HEADER: same voice as the blog */}
      <header className="pb-6 pt-6 sm:pb-8 sm:pt-10">
        <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
          {params === "homepage" ? "Just in" : "Shop"}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 [overflow-wrap:anywhere] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-base text-gray-500">{subtitle}</p>
      </header>

      {/* LIST */}
      {!result.ok ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center"
        >
          <p className="text-lg font-semibold text-gray-900">
            Unable to load products
          </p>
          <p className="max-w-md text-sm text-gray-500">{result.message}</p>
          <RetryButton />
        </div>
      ) : result.products.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-gray-900">
            No products found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different search, or browse everything we have.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
          >
            All products <Chevron />
          </Link>
        </div>
      ) : (
        <div className="md:border-x md:border-dashed md:border-gray-200">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {params === "homepage" && result.ok && result.products.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            href={category ? `/products/?category=${category}` : "/products"}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            View all products <Chevron />
          </Link>
        </div>
      )}
    </section>
  );
};

export default ProductList;
