import { ProductType } from "@repo/types";
import Categories from "./Categories";
import ProductCard from "./ProductCard";
import Link from "next/link";
import Filter from "./Filter";
import RetryButton from "./RetryButton";
import { resolveCategory } from "../data/searchTerms";
import {
  ALL_VIEW_SEGMENTS,
  DEFAULT_SEGMENT,
  SEGMENT_META,
  SEGMENT_POWERED_BY,
  type SegmentSlug,
} from "../data/segments";
import { fetchProducts } from "../lib/fetchProducts";
import { getCategoryName } from "../lib/getCategories";

// How many products each section shows in the combined "all products" view
// before pointing to the full section.
const SECTION_PREVIEW = 6;

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

// "Powered by <name>", small and quiet so it never competes with the title.
const PoweredBy = ({ name }: { name: string }) => (
  <p className="text-sm font-medium text-gray-500">
    Powered by <span className="text-gray-900">{name}</span>
  </p>
);

const Header = ({
  eyebrow,
  title,
  subtitle,
  poweredBy,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  poweredBy?: string;
}) => (
  <header className="pb-6 pt-6 sm:pb-8 sm:pt-10">
    <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
      {eyebrow}
    </p>
    {/* Beside the title on wide screens, under it on phones. */}
    <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900 [overflow-wrap:anywhere] sm:text-6xl">
        {title}
      </h1>
      {poweredBy && <PoweredBy name={poweredBy} />}
    </div>
    <p className="mt-3 max-w-md text-base text-gray-500">{subtitle}</p>
  </header>
);

const ErrorBox = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center"
  >
    <p className="text-lg font-semibold text-gray-900">
      Unable to load products
    </p>
    <p className="max-w-md text-sm text-gray-500">{message}</p>
    <RetryButton />
  </div>
);

// Pharmacy is regulated: say so wherever its products are listed.
const PharmacyNotice = () => (
  <div
    role="note"
    className="mb-6 rounded-2xl bg-green-50 px-5 py-4 text-sm leading-relaxed text-green-900 ring-1 ring-green-900/10"
  >
    Prescription medicines are dispensed only with a valid prescription.
    Products marked &ldquo;Prescription required&rdquo; can&rsquo;t be ordered
    online.{" "}
    <Link
      href="/pharmacy/upload"
      className="font-semibold underline underline-offset-2 hover:text-green-700"
    >
      Upload your prescription
    </Link>
  </div>
);

const ProductRows = ({ products }: { products: ProductType[] }) => (
  <div className="md:border-x md:border-dashed md:border-gray-200">
    {products.map((product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
);

const searchTitle = (search: string) => `Results for \u201C${search}\u201D`;

// ---------------------------------------------------------------------------
// ONE segment: the homepage (always hardware) and /products?segment=...
// ---------------------------------------------------------------------------
const SegmentListing = async ({
  segment,
  category,
  sort,
  search,
  params,
}: {
  segment: SegmentSlug;
  category?: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}) => {
  const meta = SEGMENT_META[segment];
  const result = await fetchProducts({
    segment,
    category,
    sort,
    search,
    limit: params === "homepage" ? 10 : undefined,
  });

  const categoryName = category
    ? await getCategoryName(segment, category)
    : undefined;

  // Heading follows what the visitor is looking at.
  const title = search
    ? searchTitle(search)
    : (categoryName ?? (params === "homepage" ? "New arrivals" : meta.title));

  const subtitle = !result.ok
    ? meta.subtitle
    : params === "homepage"
      ? "Fresh stock for building comfort at home."
      : `${result.products.length} ${
          result.products.length === 1 ? "product" : "products"
        } in ${meta.label}${categoryName && search ? `, ${categoryName}` : ""}`;

  const viewAllParams = new URLSearchParams({ segment });
  if (category) viewAllParams.set("category", category);

  return (
    <section className="w-full pb-4">
      {/*<Categories />
      {params === "products" && <Filter />}*/}

      <Header
        eyebrow={params === "homepage" ? "Just in" : "Shop"}
        title={title}
        subtitle={subtitle}
        // Products pages only: the homepage keeps its "New arrivals" heading.
        poweredBy={
          params === "products" ? SEGMENT_POWERED_BY[segment] : undefined
        }
      />

      {segment === "pharmacy" && <PharmacyNotice />}

      {!result.ok ? (
        <ErrorBox message={result.message} />
      ) : result.products.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-gray-900">
            No products found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different search, or browse everything we have.
          </p>
          <Link
            href={`/products?segment=${segment}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
          >
            All {meta.label.toLowerCase()} <Chevron />
          </Link>
        </div>
      ) : (
        <ProductRows products={result.products} />
      )}

      {params === "homepage" && result.ok && result.products.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            href={`/products?${viewAllParams.toString()}`}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            View all products <Chevron />
          </Link>
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// NO segment on /products ("all products"): one block per section, never one
// merged list. Each block links to its full section.
// ---------------------------------------------------------------------------
const GroupedListing = async ({
  sort,
  search,
}: {
  sort?: string;
  search?: string;
}) => {
  // Category words ("cement", "paints"...) are a hardware idea, so they only
  // narrow the hardware block. Grocery and pharmacy get the plain text search
  // (otherwise "water" would be swallowed by the plumbing category).
  const hardwareMatch = search ? resolveCategory(search) : null;

  const sections = await Promise.all(
    ALL_VIEW_SEGMENTS.map(async (segment) => {
      const useCategory = segment === "hardware" && hardwareMatch;
      const category = useCategory ? useCategory.slug : undefined;
      const text = useCategory ? undefined : search;

      const result = await fetchProducts({
        segment,
        category,
        sort,
        search: text,
        // One extra row tells us whether there is more than the preview.
        limit: SECTION_PREVIEW + 1,
      });

      // The pharmacy is its own section (/pharmacy); everything else lists
      // under /products?segment=...
      const seeAll = new URLSearchParams();
      if (segment !== "pharmacy") seeAll.set("segment", segment);
      if (category) seeAll.set("category", category);
      if (text) seeAll.set("search", text);
      if (sort) seeAll.set("sort", sort);
      const base = segment === "pharmacy" ? "/pharmacy" : "/products";
      const query = seeAll.toString();
      const seeAllHref = query ? `${base}?${query}` : base;

      return { segment, result, seeAllHref };
    }),
  );

  // Sections with nothing to show are left out (a section that hasn't been
  // stocked yet, or one with no matches for this search). Failed ones stay,
  // so a hiccup in one section is visible and retryable.
  const visible = sections.filter(
    (s) => !s.result.ok || s.result.products.length > 0,
  );
  const allFailed = sections.every((s) => !s.result.ok);
  const firstFailure = sections.find((s) => !s.result.ok)?.result;
  const failureMessage =
    firstFailure && !firstFailure.ok ? firstFailure.message : "";

  return (
    <section className="w-full pb-4">
      <Header
        eyebrow="Shop"
        title={search ? searchTitle(search) : "All products"}
        subtitle={
          search
            ? "Matches are grouped by section."
            : "Browse each section, or pick one from the Shop menu."
        }
      />

      {allFailed ? (
        <ErrorBox message={failureMessage} />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-gray-900">
            No products found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different search, or pick a section from the Shop menu.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {visible.map(({ segment, result, seeAllHref }) => {
            const meta = SEGMENT_META[segment];
            const headingId = `section-${segment}`;
            const products = result.ok
              ? result.products.slice(0, SECTION_PREVIEW)
              : [];
            const hasMore =
              result.ok && result.products.length > SECTION_PREVIEW;

            return (
              <section key={segment} aria-labelledby={headingId}>
                <div className="flex items-end justify-between gap-4 pb-3">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2
                      id={headingId}
                      className="text-2xl font-semibold tracking-tight text-gray-900"
                    >
                      {meta.label}
                    </h2>
                    {SEGMENT_POWERED_BY[segment] && (
                      <PoweredBy name={SEGMENT_POWERED_BY[segment]!} />
                    )}
                  </div>
                  {/* Without a search, "see all" is always useful; with one,
                      only when the preview didn't show every match. */}
                  {result.ok && (hasMore || !search) && (
                    <Link
                      href={seeAllHref}
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
                    >
                      See all in {meta.label}
                      <Chevron />
                    </Link>
                  )}
                </div>

                {segment === "pharmacy" && <PharmacyNotice />}

                {result.ok ? (
                  <ProductRows products={products} />
                ) : (
                  <ErrorBox message={result.message} />
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
};

const ProductList = async ({
  segment,
  category,
  sort,
  search,
  params,
}: {
  // Omit on /products to get the grouped "all products" view. The homepage
  // ignores this and is ALWAYS hardware.
  segment?: SegmentSlug;
  category?: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}) => {
  const effectiveSegment = params === "homepage" ? DEFAULT_SEGMENT : segment;

  if (!effectiveSegment) return <GroupedListing sort={sort} search={search} />;

  return (
    <SegmentListing
      segment={effectiveSegment}
      category={category}
      sort={sort}
      search={search}
      params={params}
    />
  );
};

export default ProductList;
