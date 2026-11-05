"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SEGMENT_META,
  SEGMENT_SLUGS,
  type SegmentSlug,
} from "../data/segments";
import { formatUGX } from "../lib/checkout";
import {
  countUnits,
  subtotalOf,
  useCartGroups,
  withSegment,
} from "../lib/segmentCart";

// The cart has no loading gate (it has no localStorage hydration step): the
// icon is always visible and shows 0 until someone is signed in and their
// cart has loaded.
//
// On phones the menu is centred across the screen (it opens in a portal on
// the page body, so a header with overflow/blur can't clip it); from the
// "sm" breakpoint up it sits under the icon at the right edge.
//
// Clicking the icon opens a small menu with one row per cart that has items,
// e.g. "Pharmacy (3)". Each row opens that cart. Click-to-open (rather than
// hover) so it works the same on phones.
const ShoppingCartIcon = () => {
  const groups = useCartGroups();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Where the menu starts, measured from the icon (phones only use it).
  const [menuTop, setMenuTop] = useState(64);

  // `groups` should have an entry for EVERY segment. If one is ever missing
  // (a segment added after the cart helpers were written, for example), treat
  // it as an empty cart instead of crashing: this icon lives in the site
  // header, so an error here takes down every page.
  const itemsOf = (segment: SegmentSlug) => groups[segment] ?? [];

  const carts = SEGMENT_SLUGS.filter((s) => itemsOf(s).length > 0);
  const total = carts.reduce((sum, s) => sum + countUnits(itemsOf(s)), 0);

  // Say so in the console, so the real fault (in lib/segmentCart) gets fixed
  // instead of being hidden.
  const missingSegments = SEGMENT_SLUGS.filter((s) => !groups[s]).join(", ");
  useEffect(() => {
    if (missingSegments) {
      console.warn(
        `useCartGroups() has no entry for: ${missingSegments}. Items in those sections will not show in the cart menu.`,
      );
    }
  }, [missingSegments]);

  // Close after navigating (picking a cart, or any other link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Keep the phone menu right under the icon if the page moves or resizes.
    const place = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setMenuTop(Math.round(rect.bottom) + 8);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="cart-menu"
        aria-label={`Cart, ${total} ${total === 1 ? "item" : "items"}`}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
      >
        <ShoppingCart className="h-4 w-4 text-gray-600" />
        <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-xs font-medium text-gray-600">
          {total}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            id="cart-menu"
            ref={menuRef}
            style={{ top: menuTop }}
            className="fixed inset-x-4 z-50 mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/10 sm:inset-x-auto sm:right-4 sm:mx-0 sm:w-72"
          >
            {carts.length === 0 ? (
              <div className="flex flex-col gap-3 px-3 py-4">
                <p className="text-sm text-gray-500">Your cart is empty.</p>
                <Link
                  href="/products"
                  className="text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-medium text-gray-500">
                  Your carts
                </p>
                <ul>
                  {carts.map((segment) => (
                    <li key={segment}>
                      <Link
                        href={withSegment("/cart", segment)}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">
                          {SEGMENT_META[segment].label}{" "}
                          <span className="font-normal text-gray-500">
                            ({countUnits(itemsOf(segment))})
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-gray-500">
                          {formatUGX(subtotalOf(itemsOf(segment)))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ShoppingCartIcon;
