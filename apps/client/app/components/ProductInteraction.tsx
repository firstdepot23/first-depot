"use client";

import { ProductType } from "@repo/types";
import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth, useClerk } from "@clerk/nextjs";
import useCartStore, { useCartItemQuantity } from "../stores/storeCart";
import ColorSelect from "./ColorSelect";
import { startLoader } from "./NavigationProgress";
import { useProductSelection } from "./ProductSelection";
import QuantityStepper from "./QuantityStepper";
import UnavailableNotice from "./UnavailableNotice";
import { fromApiSegment, SEGMENT_META } from "../data/segments";
import {
  blockedFor,
  cartSizeFor,
  groupsOf,
  hasPackPrices,
  missingGroups,
  packsOf,
  selectedOptions,
  unitPrice,
} from "../lib/productChoices";

const ProductInteraction = ({ product }: { product: ProductType }) => {
  const router = useRouter();
  const {
    size: selectedSize,
    color: selectedColor,
    choices,
    setSize,
    setColor,
    setChoice,
  } = useProductSelection();
  const [quantity, setQuantity] = useState(1);

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { addToCart, updateQuantity } = useCartStore();

  // Grocery packs each have their own price; fast food has choices to make.
  const packs = packsOf(product);
  const showPackPrices = hasPackPrices(product);
  const groups = groupsOf(product);
  const price = unitPrice(product, selectedSize, choices);
  // What tells this cart line apart from others of the same product: the pack
  // for packs, the picked accompaniments for fast food.
  const cartSize = cartSizeFor(product, selectedSize, choices);

  // How many of this exact pack / combination are already in the cart.
  const cartQuantity = useCartItemQuantity(
    product.id,
    cartSize,
    selectedColor,
  );
  const inCart = !!isSignedIn && cartQuantity > 0;
  // Each segment has its own cart; this product goes into its own.
  const segmentSlug = fromApiSegment(product.segment);
  const cartHref = `/cart?segment=${segmentSlug}`;

  // Prescription-only, out of stock or expired: no cart controls at all.
  // Stock is checked on the selected pack; fast food is made to order.
  const blocked = blockedFor(product, selectedSize);
  // Grocery / pharmacy have no colors: hide the picker rather than show an
  // empty one.
  const hasColors = product.colors.length > 0;

  const cartVariant = {
    id: product.id,
    selectedSize: cartSize,
    selectedColor,
  };

  // Required questions ("Choose an accompaniment") must be answered first.
  const choicesComplete = () => {
    const missing = missingGroups(product, choices);
    if (missing.length === 0) return true;
    toast.error(`Please choose: ${missing.join(", ")}`);
    return false;
  };

  const addCurrentSelection = () => {
    const picked = selectedOptions(product, choices).map(
      ({ group, option }) => ({
        groupId: group.id,
        group: group.name,
        optionId: option.id,
        name: option.name,
        extraPrice: option.extraPrice,
      }),
    );
    // The line carries the price of what was picked (pack price + extras), not
    // the product's "from" price. `selectedOptions` rides along for the order.
    addToCart({
      ...product,
      price,
      quantity,
      selectedColor,
      selectedSize: cartSize,
      selectedOptions: picked,
    } as unknown as Parameters<typeof addToCart>[0]);
  };

  const handleAddToCart = () => {
    if (blocked) return;
    // The cart lives in the account's database record, so there's nowhere to
    // put an item for someone who isn't signed in yet: prompt sign-in.
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (!choicesComplete()) return;
    addCurrentSelection();
    setQuantity(1);
    toast.success(`Added to your ${SEGMENT_META[segmentSlug].label} cart`);
  };

  // "Buy this item": make sure it is in the cart, then go straight to it.
  const handleBuyNow = () => {
    if (blocked) return;
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (cartQuantity === 0) {
      if (!choicesComplete()) return;
      addCurrentSelection();
    }
    startLoader();
    router.push(cartHref);
  };

  return (
    <div className="flex flex-col gap-7">
      {/* SIZE / PACK: a single-size product just states its size. Fast food has
          no sizes, so nothing is shown. Packs show their own price. */}
      {product.sizes.length === 0 ? null : product.sizes.length <= 1 ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-gray-900">Size</span>
          <span className="truncate text-sm text-gray-500">
            {selectedSize.toUpperCase()}
          </span>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-gray-900">Size</span>
            <span className="truncate text-sm text-gray-500">
              {selectedSize.toUpperCase()}
            </span>
          </div>
          <div
            role="radiogroup"
            aria-label="Size"
            className="mt-3 flex flex-wrap gap-2"
          >
            {product.sizes.map((size) => {
              const selected = size === selectedSize;
              const pack = showPackPrices
                ? packs.find((p) => p.label === size)
                : undefined;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSize(size)}
                  className={`min-h-11 min-w-12 max-w-full cursor-pointer border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                    pack ? "rounded-2xl py-1.5 leading-tight" : "h-11 truncate rounded-full"
                  } ${
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-900"
                  }`}
                >
                  {size.toUpperCase()}
                  {pack && (
                    <span
                      className={`block text-xs font-normal ${
                        selected ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {pack.stock <= 0
                        ? "Sold out"
                        : `UGX ${pack.price.toLocaleString()}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COLOR */}
      {hasColors && (
        <div>
          <span className="text-sm font-medium text-gray-900">Color</span>
          <div className="mt-3">
            <ColorSelect
              colors={product.colors}
              value={selectedColor}
              onChange={setColor}
            />
          </div>
        </div>
      )}

      {/* FAST FOOD: accompaniments, drinks and add-ons */}
      {groups.map((group) => {
        const picked = choices[group.id] ?? [];
        return (
          <div key={group.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-gray-900">
                {group.name}
              </span>
              <span className="text-xs text-gray-500">
                {group.required
                  ? "Required"
                  : group.selection === "MULTIPLE"
                    ? "Optional, choose any"
                    : "Optional"}
              </span>
            </div>

            {group.selection === "SINGLE" ? (
              <select
                aria-label={group.name}
                value={String(picked[0] ?? "")}
                onChange={(e) =>
                  setChoice(
                    group.id,
                    e.target.value ? [Number(e.target.value)] : [],
                  )
                }
                className="mt-3 h-11 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors hover:border-gray-400 focus-visible:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/30"
              >
                <option value="">Select the option</option>
                {group.options.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    disabled={!option.available}
                  >
                    {option.name.toUpperCase()}
                    {!option.available
                      ? " (SOLD OUT)"
                      : option.extraPrice > 0
                        ? `  +${option.extraPrice.toLocaleString()}`
                        : ""}
                  </option>
                ))}
              </select>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200">
                {group.options.map((option) => {
                  const checked = picked.includes(option.id);
                  return (
                    <li key={option.id}>
                      <label
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                          option.available
                            ? "cursor-pointer text-gray-800"
                            : "cursor-not-allowed text-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!option.available}
                          onChange={() =>
                            setChoice(
                              group.id,
                              checked
                                ? picked.filter((id) => id !== option.id)
                                : [...picked, option.id],
                            )
                          }
                          className="h-4 w-4 accent-green-600"
                        />
                        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                          {option.name}
                        </span>
                        <span className="shrink-0 text-gray-500">
                          {!option.available
                            ? "Sold out"
                            : option.extraPrice > 0
                              ? `+${option.extraPrice.toLocaleString()}`
                              : ""}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {blocked ? (
        <UnavailableNotice reason={blocked} productId={Number(product.id)} />
      ) : (
        <>
          {/* QUANTITY */}
          <div>
            <span className="text-sm font-medium text-gray-900">Quantity</span>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
              {inCart ? (
                <>
                  <QuantityStepper
                    quantity={cartQuantity}
                    // Minus at 1 removes the item, returning to "Add to Cart".
                    onDecrease={() =>
                      updateQuantity(cartVariant, cartQuantity - 1)
                    }
                    onIncrease={() =>
                      updateQuantity(cartVariant, cartQuantity + 1)
                    }
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800 ring-1 ring-green-900/10">
                    <Check className="h-3.5 w-3.5" />
                    {cartQuantity} in your cart
                  </span>
                  <Link
                    href={cartHref}
                    className="text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
                  >
                    View cart
                  </Link>
                </>
              ) : (
                <QuantityStepper
                  quantity={quantity}
                  disableDecrease={quantity <= 1}
                  onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                  onIncrease={() => setQuantity((q) => q + 1)}
                />
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {!inCart && (
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            )}
            <button
              type="button"
              onClick={handleBuyNow}
              className={`flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                inCart
                  ? "bg-gray-900 text-white hover:bg-green-700"
                  : "border border-gray-300 bg-white text-gray-900 hover:border-gray-900"
              }`}
            >
              {inCart ? "Go to checkout" : "Buy this Item"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductInteraction;