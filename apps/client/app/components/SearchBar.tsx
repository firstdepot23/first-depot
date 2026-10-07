"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ProductType } from "@repo/types";
import { categories } from "../data/categoryData";
import { startLoader } from "./NavigationProgress";

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
  // Always starts as "all" so a search covers every product. Pick a chip to
  // narrow it down. (It used to copy the page's current category, which made
  // every search silently stick to e.g. "glass".)
  const [category, setCategory] = useState("all");
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
    setCategory("all");
    setOpen(true);
  };

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

  // Work out whether the chip arrows are needed once the card is on screen.
  useEffect(() => {
    if (!open) return;
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [open]);

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
      try {
        const params = new URLSearchParams();
        params.set("search", query);
        params.set("limit", "6");
        if (category !== "all") params.set("category", category);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/products?${params.toString()}`,
        );
        if (cancelled) return;

        if (!res.ok) {
          setSuggestions([]);
          setSuggestionsError(true);
          return;
        }

        const data = await res.json();
        if (cancelled) return;
        setSuggestions(Array.isArray(data) ? data : []);
        setSuggestionsError(false);
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setSuggestionsError(true);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [value, category, open]);

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const params = new URLSearchParams(searchParams);
    params.set("search", trimmed);
    if (category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    startLoader();
    router.push(`/products?${params.toString()}`, { scroll: false });
    closeSearch(); // navbar goes back to normal, input is cleared
  };

  const trimmedValue = value.trim();

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
                  <div className="relative pb-4 md:pb-3">
                    <div
                      ref={chipsRef}
                      onScroll={updateArrows}
                      className="flex flex-wrap gap-2 px-4 md:flex-nowrap md:overflow-x-auto md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
                    >
                      {categories.map((c) => {
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

                    {suggestions.length > 0 && (
                      <ul className="border-t border-gray-100">
                        {suggestions.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              onClick={() => runSearch(product.name)}
                              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-gray-100 active:bg-gray-200"
                            >
                              <Search className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="truncate">{product.name}</span>
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
