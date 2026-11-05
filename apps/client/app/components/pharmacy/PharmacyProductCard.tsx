"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { photosForColor, type ProductType } from "@repo/types";
import { FileUp, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import useCartStore, { useCartItemQuantity } from "../../stores/storeCart";
import { isPrescriptionOnly, unavailableReason } from "../../lib/productRules";
import QuantityStepper from "../QuantityStepper";

/**
 * One tile in the pharmacy grid: photo, name, strength/form, price and one
 * action. Pharmacy products have a single size and no colors, so there is
 * nothing to choose: the action is simply Add (or Upload prescription).
 */
const PharmacyProductCard = ({ product }: { product: ProductType }) => {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { addToCart, updateQuantity } = useCartStore();

  const size = product.sizes[0] ?? "";
  const cartQuantity = useCartItemQuantity(product.id, size, "");
  const cartVariant = { id: product.id, selectedSize: size, selectedColor: "" };

  const cover = photosForColor(product, "")[0];
  const blocked = unavailableReason(product);
  const rx = isPrescriptionOnly(product);
  const detail = [product.dosageStrength, product.formulation]
    .filter(Boolean)
    .join(", ");

  const handleAdd = () => {
    if (blocked) return;
    // The cart lives in the account's record, so signing in comes first.
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    addToCart({
      ...product,
      quantity: 1,
      selectedSize: size,
      selectedColor: "",
    });
    toast.success("Added to your Pharmacy cart");
  };

  return (
    <article className="group flex w-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-lg hover:shadow-gray-900/5">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-green-50"
        aria-label={product.name}
      >
        {cover && (
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 220px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        )}
        {rx && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-900/10">
            Rx
          </span>
        )}
      </Link>

      <div className="mt-3 flex min-w-0 flex-1 flex-col">
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 [overflow-wrap:anywhere] hover:text-green-700">
            {product.name}
          </h3>
        </Link>
        {detail && (
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{detail}</p>
        )}
        <p className="mt-2 text-gray-900">
          <span className="mr-1 text-xs font-medium text-gray-500">UGX</span>
          <span className="text-base font-semibold tracking-tight">
            {product.price.toLocaleString()}
          </span>
        </p>

        <div className="mt-3 flex-1" />

        {/* ONE ACTION */}
        {blocked === "prescription" || rx ? (
          <Link
            href={`/pharmacy/upload?product=${product.id}`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-green-600 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <FileUp className="h-4 w-4" />
            Upload prescription
          </Link>
        ) : blocked ? (
          <span className="flex h-10 w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
            {blocked === "expired" ? "Unavailable" : "Out of stock"}
          </span>
        ) : isSignedIn && cartQuantity > 0 ? (
          <div className="flex justify-center">
            <QuantityStepper
              size="sm"
              quantity={cartQuantity}
              // Minus at 1 removes the item, returning to "Add".
              onDecrease={() => updateQuantity(cartVariant, cartQuantity - 1)}
              onIncrease={() => updateQuantity(cartVariant, cartQuantity + 1)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-green-600 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>
    </article>
  );
};

export default PharmacyProductCard;
