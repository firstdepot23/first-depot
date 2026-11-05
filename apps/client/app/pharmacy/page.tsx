import { FileUp, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PharmacyProductCard from "../components/pharmacy/PharmacyProductCard";
import {
  HowItWorks,
  LicenceNotice,
  PharmacyFaq,
  ServiceTiles,
} from "../components/pharmacy/PharmacySections";
import RetryButton from "../components/RetryButton";
import { fetchProducts } from "../lib/fetchProducts";
import { getSegmentCategories } from "../lib/getCategories";

export const metadata: Metadata = {
  title: "Pharmacy",
  description:
    "Shop health and wellness products, or upload your prescription and let our pharmacist prepare your order.",
  alternates: { canonical: "/pharmacy" },
};

const PAGE_SIZE = 24;
const MAX_SIZE = 96;

type SearchParams = Promise<{
  category?: string;
  search?: string;
  sort?: string;
  limit?: string;
}>;

const PharmacyPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const { category, search, sort, limit } = await searchParams;

  const requested = Number(limit);
  const size = Number.isFinite(requested)
    ? Math.min(MAX_SIZE, Math.max(PAGE_SIZE, Math.floor(requested)))
    : PAGE_SIZE;

  // One extra row tells us whether there is a "Show more".
  const [result, categories] = await Promise.all([
    fetchProducts({
      segment: "pharmacy",
      category,
      search,
      sort,
      limit: size + 1,
    }),
    getSegmentCategories("pharmacy"),
  ]);

  const filtered = Boolean(category || search);
  const activeCategory = categories.find((c) => c.slug === category);
  const products = result.ok ? result.products.slice(0, size) : [];
  const hasMore = result.ok && result.products.length > size;

  const chipHref = (slug?: string) => {
    const q = new URLSearchParams();
    if (slug) q.set("category", slug);
    if (search) q.set("search", search);
    const s = q.toString();
    return s ? `/pharmacy?${s}` : "/pharmacy";
  };

  const moreParams = new URLSearchParams();
  if (category) moreParams.set("category", category);
  if (search) moreParams.set("search", search);
  if (sort) moreParams.set("sort", sort);
  moreParams.set("limit", String(size + PAGE_SIZE));

  const title = search
    ? `Results for \u201C${search}\u201D`
    : (activeCategory?.name ?? (category ? category : "All products"));

  return (
    <div className="flex flex-col gap-12 pb-8 pt-6 sm:gap-16 sm:pt-8">
      {/* HERO: only on the pharmacy's front page, not on filtered views */}
      {!filtered && (
        <section className="grid gap-6 rounded-3xl bg-green-50 p-6 ring-1 ring-green-900/5 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
              Pharmacy
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Your pharmacy, without the queue.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600">
              Shop everyday health and wellness products, or upload your
              prescription and let our pharmacist prepare your order.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pharmacy/upload"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-green-600 px-6 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <FileUp className="h-4 w-4" />
                Upload prescription
              </Link>
              <a
                href="#shop"
                className="inline-flex h-11 items-center rounded-full border border-gray-300 bg-white px-6 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900"
              >
                Shop products
              </a>
            </div>
          </div>

          {/* SEARCH CARD: a plain GET form, so it needs no JavaScript */}
          <form
            action="/pharmacy"
            method="get"
            role="search"
            className="rounded-2xl bg-white p-5 shadow-xl shadow-gray-900/5 ring-1 ring-gray-200"
          >
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="pharmacySearch"
                className="font-semibold text-gray-900"
              >
                What are you looking for?
              </label>
              <Link
                href="/pharmacy/upload"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-green-600 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
              >
                <FileUp className="h-3.5 w-3.5" />
                Upload prescription
              </Link>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                id="pharmacySearch"
                name="search"
                placeholder="Search medicines, vitamins and more..."
                autoComplete="off"
                className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-base outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 sm:text-sm"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </form>
        </section>
      )}

      {!filtered && <ServiceTiles />}

      {/* SHOP: category chips + the product grid */}
      <section
        id="shop"
        aria-labelledby="shop-heading"
        className="scroll-mt-24"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="shop-heading"
            className="text-2xl font-semibold tracking-tight text-gray-900 [overflow-wrap:anywhere] sm:text-3xl"
          >
            {title}
          </h2>
          {result.ok && (
            <p className="text-sm text-gray-500">
              {products.length}
              {hasMore ? "+" : ""}{" "}
              {products.length === 1 ? "product" : "products"}
            </p>
          )}
        </div>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="mt-5 flex flex-wrap gap-2">
            <Link
              href={chipHref()}
              aria-current={!category ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                !category
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={chipHref(c.slug)}
                aria-current={c.slug === category ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  c.slug === category
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        {/* The regulated-products note, wherever medicines are listed */}
        <p
          role="note"
          className="mt-5 rounded-2xl bg-green-50 px-5 py-4 text-sm leading-relaxed text-green-900 ring-1 ring-green-900/10"
        >
          Products marked <strong>Rx</strong> are dispensed only with a valid
          prescription and can&rsquo;t be added to the cart.{" "}
          <Link
            href="/pharmacy/upload"
            className="font-semibold underline underline-offset-2 hover:text-green-700"
          >
            Upload your prescription
          </Link>
        </p>

        <div className="mt-6">
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
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-gray-900">
                No products found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try a different search, or look for a product with your
                prescription instead.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-4">
                <Link
                  href="/pharmacy"
                  className="text-sm font-semibold text-green-600 hover:text-green-700"
                >
                  All pharmacy products
                </Link>
                <Link
                  href="/pharmacy/upload"
                  className="text-sm font-semibold text-green-600 hover:text-green-700"
                >
                  Upload a prescription
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <li key={product.id} className="flex min-w-0">
                  <PharmacyProductCard product={product} />
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Link
                href={`/pharmacy?${moreParams.toString()}#shop`}
                scroll={false}
                className="inline-flex items-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Show more
              </Link>
            </div>
          )}
        </div>
      </section>

      {!filtered && <HowItWorks />}
      {!filtered && <PharmacyFaq />}
      <LicenceNotice />
    </div>
  );
};

export default PharmacyPage;
