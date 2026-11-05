"use client";

import { photosForColor, type ProductType } from "@repo/types";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth, useClerk } from "@clerk/nextjs";
import useCartStore, { useCartItemQuantity } from "../stores/storeCart";
import ColorSelect from "./ColorSelect";
import QuantityStepper from "./QuantityStepper";
import UnavailableNotice from "./UnavailableNotice";
import { fromApiSegment, SEGMENT_META } from "../data/segments";
import { isPrescriptionOnly } from "../lib/productRules";
import {
  blockedFor,
  cartSizeFor,
  hasPackPrices,
  hasRequiredChoices,
  packFor,
  unitPrice,
} from "../lib/productChoices";

/**
 * One row per product, ruled like the blog listing: a soft mint thumbnail,
 * a confident title that turns green on hover, and the price + action in a
 * column on the right (own line under the details on phones).
 */
const ProductCard = ({ product }: { product: ProductType }) => {
  const [productTypes, setProductTypes] = useState({
    size: product.sizes[0] ?? "",
    // Grocery / pharmacy products have no colors: "" selects their default photo.
    color: product.colors[0] ?? "",
  });

  const hasColors = product.colors.length > 0;
  const cover = photosForColor(product, productTypes.color)[0];
  // Stock is judged on the selected pack; fast food is made to order.
  const blocked = blockedFor(product, productTypes.size);
  const showPackPrices = hasPackPrices(product);
  // Price of the selected pack (grocery packs each have their own price).
  const price = unitPrice(product, productTypes.size, {});
  // Meals with a required choice ("Choose an accompaniment") can't be added
  // from the list: the shopper picks on the product page.
  const needsChoices = hasRequiredChoices(product);
  const cartSize = cartSizeFor(product, productTypes.size, {});
  // e.g. "Paracetamol, 500mg, Tablet" under the name of a medicine.
  const medicineLine =
    product.segment === "PHARMACY"
      ? [product.activeIngredient, product.dosageStrength, product.formulation]
          .filter(Boolean)
          .join(", ")
      : "";

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { addToCart, updateQuantity } = useCartStore();

  // How many of the currently selected size + color are already in the cart.
  const cartQuantity = useCartItemQuantity(
    product.id,
    cartSize,
    productTypes.color,
  );

  const cartVariant = {
    id: product.id,
    selectedSize: cartSize,
    selectedColor: productTypes.color,
  };

  const handleProductType = ({
    type,
    value,
  }: {
    type: "size" | "color";
    value: string;
  }) => {
    setProductTypes((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleAddToCart = () => {
    if (blocked) return;
    // The cart lives in the account's database record now, so there's
    // nowhere to put an item for someone who isn't signed in yet -
    // prompt sign-in instead of silently dropping it.
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    addToCart({
      ...product,
      // The line is priced at the selected pack, not the "from" price.
      price,
      quantity: 1,
      selectedSize: cartSize,
      selectedColor: productTypes.color,
    });
    toast.success(
      `Added to your ${SEGMENT_META[fromApiSegment(product.segment)].label} cart`,
    );
  };

  return (
    // Phones: a two-column grid (thumbnail | details) with the price + action
    // on their own full-width row underneath, so nothing can push past the
    // screen edge. sm and up: the original single row.
    <article className="group grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-4 border-t border-gray-200 py-5 last:border-b sm:flex sm:items-center sm:gap-6 sm:py-7 md:px-8">
      {/* THUMBNAIL */}
      <Link href={`/products/${product.id}`} className="shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-green-50 shadow-lg shadow-gray-900/5 ring-1 ring-green-900/5 sm:h-28 sm:w-28">
          {cover && (
            <Image
              src={cover}
              alt={product.name}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none sm:p-3"
            />
          )}
        </div>
      </Link>

      {/* DETAILS */}
      <div className="min-w-0 sm:flex-1">
        {isPrescriptionOnly(product) && (
          <p className="mb-1.5 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-900/10">
            Prescription required
          </p>
        )}
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-gray-900 transition-colors [overflow-wrap:anywhere] hover:text-green-700 sm:text-lg">
            {product.name}
          </h3>
        </Link>
        {medicineLine && (
          <p className="mt-1 line-clamp-1 text-sm text-gray-600 [overflow-wrap:anywhere]">
            {medicineLine}
          </p>
        )}
        <p className="mt-1 hidden line-clamp-2 text-sm leading-relaxed text-gray-500 [overflow-wrap:anywhere] sm:block">
          {product.shortDescription}
        </p>

        {/* SIZE / COLOR: wraps onto a new line instead of running off-screen */}
        <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {product.sizes.length === 0 ? null : product.sizes.length > 1 ? (
            <select
              value={productTypes.size}
              aria-label="Size"
              className="max-w-[10rem] cursor-pointer truncate rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 outline-none transition-colors hover:border-gray-400 focus-visible:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/30"
              onChange={(e) =>
                handleProductType({ type: "size", value: e.target.value })
              }
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  {size.toUpperCase()}
                  {showPackPrices
                    ? ` · UGX ${(packFor(product, size)?.price ?? product.price).toLocaleString()}`
                    : ""}
                </option>
              ))}
            </select>
          ) : (
            <span className="max-w-[10rem] truncate rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {productTypes.size.toUpperCase()}
            </span>
          )}

          {hasColors && (
            <ColorSelect
              colors={product.colors}
              value={productTypes.color}
              onChange={(value) => handleProductType({ type: "color", value })}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* PRICE + ACTION: full-width row on phones, right-hand column on sm+ */}
      <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 sm:w-44 sm:shrink-0 sm:flex-col sm:items-end">
        <p className="min-w-0 text-gray-900">
          <span className="mr-1 text-xs font-medium text-gray-500">UGX</span>
          <span className="text-lg font-semibold tracking-tight sm:text-xl">
            {price.toLocaleString()}
          </span>
        </p>

        {blocked ? (
          <UnavailableNotice reason={blocked} compact />
        ) : needsChoices ? (
          <Link
            href={`/products/${product.id}`}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Choose options
          </Link>
        ) : isSignedIn && cartQuantity > 0 ? (
          <QuantityStepper
            size="sm"
            quantity={cartQuantity}
            // Minus at 1 removes the item, returning to "Add to Cart".
            onDecrease={() => updateQuantity(cartVariant, cartQuantity - 1)}
            onIncrease={() => updateQuantity(cartVariant, cartQuantity + 1)}
          />
        ) : (
          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
};

export default ProductCard;