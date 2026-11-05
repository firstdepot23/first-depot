"use client";

import { photosForColor } from "@repo/types";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QuantityStepper from "./QuantityStepper";
import useCartStore from "../stores/storeCart";
import { SEGMENT_META, SEGMENT_SLUGS } from "../data/segments";
import { formatUGX } from "../lib/checkout";
import type { Unavailable } from "../lib/productRules";
import { blockedFor, groupsOf, hasPackPrices } from "../lib/productChoices";
import {
  countUnits,
  subtotalOf,
  useCheckoutCart,
  withSegment,
} from "../lib/segmentCart";

// Shown on a line that can't be checked out. The cart can still hold it (it
// may have been added before the rule existed, or its stock/expiry changed),
// but checkout stays blocked until it's removed.
const BLOCKED_TEXT: Record<Unavailable, string> = {
  prescription:
    "Prescription required: this can\u2019t be ordered online. Remove it, then upload your prescription instead.",
  "out-of-stock": "Out of stock. Remove it to continue.",
  expired: "No longer available. Remove it to continue.",
};

const CartItemsList = () => {
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // The cart being looked at (from ?segment=...) and all of them, for the tabs.
  const { segment, items, groups } = useCheckoutCart();
  const meta = SEGMENT_META[segment];

  const filledCarts = SEGMENT_SLUGS.filter((s) => groups[s].length > 0);
  const totalItems = countUnits(items);
  const subtotal = subtotalOf(items);

  // Nothing in any cart.
  if (filledCarts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-gray-500">Your cart is empty.</p>
        <Link
          href="/products"
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition-all duration-300 hover:bg-gray-900"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ONE TAB PER CART THAT HAS ITEMS (hidden when there is only one) */}
      {filledCarts.length > 1 && (
        <nav aria-label="Carts" className="mb-5 flex flex-wrap gap-2">
          {filledCarts.map((s) => {
            const active = s === segment;
            return (
              <Link
                key={s}
                href={withSegment("/cart", s)}
                replace
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {SEGMENT_META[s].label} ({countUnits(groups[s])})
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="font-semibold">
          {meta.label} cart ({totalItems})
        </h2>
        <Link
          href={`/products?segment=${segment}`}
          className="text-xs text-gray-500 underline hover:text-black"
        >
          Continue shopping
        </Link>
      </div>

      {/* The chosen cart is empty (e.g. just paid for) but another isn't:
          the tabs above lead to it. */}
      {items.length === 0 ? (
        <p className="py-8 text-sm text-gray-500">
          Your {meta.label.toLowerCase()} cart is empty. Pick another cart
          above, or{" "}
          <Link
            href={`/products?segment=${segment}`}
            className="font-semibold text-green-600 hover:text-green-700"
          >
            keep shopping in {meta.label}
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200">
          {items.map((item) => {
            // Grocery / pharmacy have no colors: their photo is the default.
            const imageSrc = photosForColor(item, item.selectedColor)[0] ?? "";
            // Stock is judged on the pack in the cart; fast food is never
            // "out of stock" (made to order).
            const blocked = blockedFor(item, item.selectedSize);

            // What the shopper picked, shown under the name:
            //  - fast food: the accompaniments / add-ons ("Chips, Passion")
            //  - grocery with pack prices: the pack ("1 Kg")
            //  - anything else: the size, as before
            const hasChoices = groupsOf(item).length > 0;
            const variantLabel = !item.selectedSize
              ? null
              : hasChoices
                ? { title: "With", text: item.selectedSize }
                : hasPackPrices(item)
                  ? { title: "Pack", text: item.selectedSize }
                  : { title: "Size", text: item.selectedSize.toUpperCase() };

            // The product page can preselect a size/pack, but not a list of
            // choices, so those lines link to the plain product page.
            const query = new URLSearchParams();
            if (item.selectedSize && !hasChoices) {
              query.set("size", item.selectedSize);
            }
            if (item.selectedColor) query.set("color", item.selectedColor);
            const qs = query.toString();
            const productHref = `/products/${item.id}${qs ? `?${qs}` : ""}`;

            return (
              // SINGLE CART ITEM
              // Two rows so nothing can overlap on a phone:
              //   1. picture + name/variant/price
              //   2. Remove (left) and the quantity stepper (right), full width
              <li
                className="flex flex-col gap-3 py-4 sm:py-5"
                key={item.id + item.selectedSize + item.selectedColor}
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* IMAGE - links to the product page */}
                  <Link
                    href={productHref}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50 sm:h-28 sm:w-28"
                  >
                    {imageSrc && (
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                      />
                    )}
                  </Link>

                  {/* NAME, VARIANT, PRICE */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link
                        href={productHref}
                        className="line-clamp-2 text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      {variantLabel && (
                        <p className="text-xs text-gray-500">
                          {variantLabel.title}: {variantLabel.text}
                        </p>
                      )}
                      {item.selectedColor && (
                        <p className="text-xs text-gray-500">
                          Color: {item.selectedColor}
                        </p>
                      )}
                      {blocked && (
                        <p
                          role="alert"
                          className="mt-1 text-xs font-medium text-amber-700"
                        >
                          {BLOCKED_TEXT[blocked]}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="font-semibold">
                        {formatUGX(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-500">
                          {formatUGX(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* REMOVE + QUANTITY (lined up under the text on larger screens) */}
                <div className="flex items-center justify-between gap-3 sm:pl-32">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item)}
                    className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap py-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                  <div className="shrink-0">
                    <QuantityStepper
                      quantity={item.quantity}
                      disableDecrease={item.quantity <= 1}
                      onDecrease={() => updateQuantity(item, item.quantity - 1)}
                      onIncrease={() => updateQuantity(item, item.quantity + 1)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* TOTAL BELOW THE LIST (this cart only) */}
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
          <p className="text-sm text-gray-500">
            {meta.label} subtotal ({totalItems}{" "}
            {totalItems === 1 ? "item" : "items"})
          </p>
          <p className="text-lg font-semibold">{formatUGX(subtotal)}</p>
        </div>
      )}
    </div>
  );
};

export default CartItemsList;
