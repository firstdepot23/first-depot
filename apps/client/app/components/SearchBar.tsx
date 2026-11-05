"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ProductType } from "@repo/types";
import { categories, type CategoryOption } from "../data/categoryData";
import { buildSearchPlan } from "../data/searchTerms";
import {
  fromApiSegment,
  SEGMENT_META,
  SEGMENT_SLUGS,
  toApiSegment,
  type SegmentSlug,
} from "../data/segments";
import { startLoader } from "./NavigationProgress";

// Pharmacy has its own dedicated search on its own page, so it's
// deliberately left out of this global nav search bar - both as a
// "Search in" section you can pick, and from "All sections" live
// suggestions. Scoped to this file rather than segments.ts, since the
// pharmacy page and the /products combined view still need the full
// segment list for their own purposes.
const SEARCHABLE_SEGMENTS: SegmentSlug[] = SEGMENT_SLUGS.filter(
  (s) => s !== "pharmacy",
);

/**
 * Collapsed: a single round search icon that sits in the navbar.
 *
 * Expanded:
 *  - phones (< md): a full-screen white sheet - search bar on top, department
 *    chips (wrapped, no swiping needed) and results filling the rest.
 *  - desktop (md+): the navbar turns into the search bar with a floating card
 *    underneath (chips scroll sideways with arrows).
 *
 * On desktop the expanded layer is absolutely positioned inside the navbar, so
 * the parent <nav> must be `relative` with a fixed height (see Navbar.tsx).
 */
const SearchBar = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  // Always starts as "all" (every section, shown grouped by section). Pick a
  // section to search inside just that one, then a chip to narrow further.
  // (It used to copy the page's current category, which made every search
  // silently stick to e.g. "glass".)
  const [segment, setSegment] = useState<"all" | SegmentSlug>("all");
  const [category, setCategory] = useState("all");
  // Grocery category chips come from the database, loaded the first time
  // that section is picked. Hardware uses the static list. (Pharmacy never
  // appears here, so it never needs its chips loaded in this component.)
  const [segmentCategories, setSegmentCategories] = useState<
    Partial<Record<SegmentSlug, CategoryOption[]>>
  >({});
  const [suggestions, setSuggestions] = useState<ProductType[]>([]);
  const [suggestionsError, setSuggestionsError] = useState(false);

  // Department chips (desktop): arrows appear only when there's more to scroll.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const resetInput = () => {
    setValue("");
    setSuggestions([]);
    setSuggestionsError(false);
  };

  const openSearch = () => {
    setSegment("all");
    setCategory("all");
    setOpen(true);
  };

  const chooseSegment = (next: "all" | SegmentSlug) => {
    setSegment(next);
    setCategory("all"); // categories belong to one section
  };

  // Category chips for the chosen section ("all" has none: categories differ
  // per section).
  const categoryOptions: CategoryOption[] =
    segment === "all"
      ? []
      : segment === "hardware"
        ? categories
        : [{ name: "All", slug: "all" }, ...(segmentCategories[segment] ?? [])];

  const closeSearch = () => {
    setOpen(false);
    resetInput();
  };

  const updateArrows = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollChips = (direction: 1 | -1) => {
    chipsRef.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  };

  // Escape closes the search layer.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Full-screen sheet on phones: stop the page underneath from scrolling.
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Work out whether the chip arrows are needed once the card is on screen
  // (and again whenever the chips change with the chosen section).
  useEffect(() => {
    if (!open) return;
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [open, segment, categoryOptions.length]);

  // Load grocery categories the first time they're needed.
  useEffect(() => {
    if (!open || segment === "all" || segment === "hardware") return;
    if (segmentCategories[segment]) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/categories?segment=${toApiSegment(segment)}`,
        );
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (cancelled || !Array.isArray(data)) return;
        setSegmentCategories((prev) => ({
          ...prev,
          [segment]: data
            .filter(
              (c): c is CategoryOption =>
                !!c && typeof c.name === "string" && typeof c.slug === "string",
            )
            .map((c) => ({ name: c.name, slug: c.slug })),
        }));
      } catch {
        // No chips is fine: searching the whole section still works.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, segment, segmentCategories]);

  // Debounced live suggestions, scoped to the selected department.
  useEffect(() => {
    const query = value.trim();
    if (!open || !query) {
      setSuggestions([]);
      setSuggestionsError(false);
      return;
    }

    // Stops a slow response from refilling suggestions after clearing/closing.
    let cancelled = false;

    const timeout = setTimeout(async () => {
      // "All" asks every searchable section for a few matches (pharmacy
      // excluded - see SEARCHABLE_SEGMENTS above); a chosen section asks
      // only itself. Each request names its segment, so nothing is mixed up
      // server-side.
      const targets: SegmentSlug[] =
        segment === "all" ? SEARCHABLE_SEGMENTS : [segment];
      const perSection = segment === "all" ? 3 : 6;

      const settled = await Promise.allSettled(
        targets.map(async (seg) => {
          // Category words ("cement", "paints") are a hardware idea: only
          // resolve them there, so "water" can't hijack a grocery search.
          const allowCategory =
            seg === "hardware" && (segment === "all" || category === "all");
          const plan = buildSearchPlan(query, allowCategory);

          const params = new URLSearchParams();
          params.set("segment", toApiSegment(seg));
          if (plan.search) params.set("search", plan.search);
          params.set("limit", String(perSection));
          if (plan.category) params.set("category", plan.category);
          else if (segment !== "all" && category !== "all")
            params.set("category", category);

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/products?${params.toString()}`,
          );
          if (!res.ok) throw new Error(`Suggestions failed (${res.status})`);
          const data: unknown = await res.json();
          return Array.isArray(data) ? (data as ProductType[]) : [];
        }),
      );
      if (cancelled) return;

      const ok = settled.filter(
        (r): r is PromiseFulfilledResult<ProductType[]> =>
          r.status === "fulfilled",
      );
      if (ok.length === 0) {
        setSuggestions([]);
        setSuggestionsError(true);
        return;
      }
      setSuggestions(ok.flatMap((r) => r.value));
      setSuggestionsError(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [value, category, segment, open]);

  // `exact` is for clicking a suggested product name: search it as typed
  // instead of treating it as a category word. `inSegment` is that product's
  // own section, so the results page opens in the right one.
  const runSearch = (query: string, exact = false, inSegment?: SegmentSlug) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const target: "all" | SegmentSlug = inSegment ?? segment;
    // The category chip only applies inside the section it was picked in.
    const useChip =
      segment !== "all" && target === segment && category !== "all";
    // Category words only mean something in hardware. In "all", the results
    // page applies them to the hardware block only.
    const plan = buildSearchPlan(
      trimmed,
      target === "hardware" && category === "all" && !exact,
    );

    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("category");
    if (target === "all") params.delete("segment");
    else params.set("segment", target);

    if (plan.category) {
      // The query named a category (e.g. "bondware", "cement", "paints").
      params.set("category", plan.category);
    } else {
      params.set("search", exact ? trimmed : plan.search);
      if (useChip) params.set("category", category);
    }

    startLoader();
    router.push(`/products?${params.toString()}`, { scroll: false });
    closeSearch(); // navbar goes back to normal, input is cleared
  };

  const trimmedValue = value.trim();
  const plan = buildSearchPlan(
    trimmedValue,
    segment === "hardware" && category === "all",
  );

  return (
    <Suspense fallback={null}>
      {/* COLLAPSED: just the icon */}
      <button
        type="button"
        onClick={openSearch}
        aria-label="Open search"
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Invisible click-catcher: clicking the page closes search (no dimming) */}
          <div
            aria-hidden="true"
            onClick={closeSearch}
            className="fixed inset-0 z-40"
          />

          {/* EXPANDED: full-screen sheet on phones, navbar takeover on desktop */}
          <div className="fixed inset-0 z-50 flex flex-col bg-white transition-all duration-200 starting:opacity-0 md:absolute md:block md:starting:-translate-y-1">
            {/* Top bar: back + search pill */}
            <div className="mx-auto flex h-14 w-full max-w-3xl shrink-0 items-center gap-2 border-b border-gray-200 px-4 md:h-full md:border-0 md:px-0">
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(value);
                }}
                className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 transition-colors focus-within:border-black focus-within:ring-1 focus-within:ring-black"
              >
                <Search className="h-4 w-4 shrink-0 text-gray-500" />
                {/* text-base stops iOS from zooming in when focused */}
                <input
                  id="search"
                  ref={inputRef}
                  autoFocus
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={value}
                  placeholder="Search products..."
                  onChange={(e) => setValue(e.target.value)}
                  className="min-w-0 flex-1 appearance-none bg-transparent text-base outline-0 placeholder:text-gray-500 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
                />
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      resetInput();
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </form>
            </div>

            {/* Body: fills the rest of the screen on phones; floating card on
                desktop, lined up under the pill (md:pl-12 = back button + gap) */}
            <div className="min-h-0 flex-1 md:absolute md:inset-x-0 md:top-full md:mx-auto md:mt-1 md:max-w-3xl md:flex-none md:pl-12">
              <div className="flex h-full flex-col overflow-hidden bg-white md:h-auto md:max-h-[70vh] md:rounded-2xl md:border md:border-gray-200 md:shadow-lg">
                {/* Department chips: wrap on phones, scroll + arrows on desktop */}
                <div className="shrink-0 pt-4 md:pt-3">
                  <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Search in
                  </p>
                  <div
                    role="group"
                    aria-label="Section"
                    className={`flex flex-wrap gap-2 px-4 ${
                      segment === "all" ? "pb-4 md:pb-3" : "pb-3"
                    }`}
                  >
                    {(["all", ...SEARCHABLE_SEGMENTS] as const).map((s) => {
                      const active = s === segment;
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={active}
                          onClick={() => chooseSegment(s)}
                          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {s === "all" ? "All sections" : SEGMENT_META[s].label}
                        </button>
                      );
                    })}
                  </div>

                  {segment !== "all" && (
                    <div className="relative pb-4 md:pb-3">
                      <div
                        ref={chipsRef}
                        onScroll={updateArrows}
                        className="flex flex-wrap gap-2 px-4 md:flex-nowrap md:overflow-x-auto md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
                      >
                        {categoryOptions.map((c) => {
                          const active = c.slug === category;
                          return (
                            <button
                              key={c.slug}
                              type="button"
                              onClick={() => setCategory(c.slug)}
                              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                                active
                                  ? "border-black bg-black text-white"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {c.slug === "all" ? "All" : c.name}
                            </button>
                          );
                        })}
                      </div>

                      {canScrollLeft && (
                        <div className="pointer-events-none absolute inset-y-0 bottom-3 left-0 hidden w-14 items-center bg-gradient-to-r from-white via-white/80 to-transparent pl-2 md:flex">
                          <button
                            type="button"
                            onClick={() => scrollChips(-1)}
                            aria-label="Scroll departments left"
                            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {canScrollRight && (
                        <div className="pointer-events-none absolute inset-y-0 bottom-3 right-0 hidden w-14 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent pr-2 md:flex">
                          <button
                            type="button"
                            onClick={() => scrollChips(1)}
                            aria-label="Scroll departments right"
                            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Results - scrolls on its own when there are many */}
                {trimmedValue && (
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => runSearch(value)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-gray-100 active:bg-gray-200"
                    >
                      <Search className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="truncate">
                        Search for &ldquo;{trimmedValue}&rdquo;
                      </span>
                    </button>

                    {plan.category && (
                      <button
                        type="button"
                        onClick={() => runSearch(value)}
                        className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3.5 text-left text-sm transition-colors hover:bg-gray-100 active:bg-gray-200"
                      >
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">
                          Browse all in <strong>{plan.categoryName}</strong>
                        </span>
                      </button>
                    )}

                    {suggestions.length > 0 && (
                      <ul className="border-t border-gray-100">
                        {suggestions.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              onClick={() =>
                                runSearch(
                                  product.name,
                                  true,
                                  fromApiSegment(product.segment),
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-gray-100 active:bg-gray-200"
                            >
                              <Search className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="min-w-0 flex-1 truncate">
                                {product.name}
                              </span>
                              {segment === "all" && (
                                <span className="shrink-0 text-xs text-gray-400">
                                  {
                                    SEGMENT_META[
                                      fromApiSegment(product.segment)
                                    ].label
                                  }
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {suggestionsError && suggestions.length === 0 && (
                      <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
                        Couldn&apos;t load suggestions right now. You can still
                        press Enter to search.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Suspense>
  );
};

export default SearchBar;
