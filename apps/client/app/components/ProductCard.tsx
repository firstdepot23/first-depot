"use client";

import { ProductType } from "@repo/types";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth, useClerk } from "@clerk/nextjs";
import useCartStore, { useCartItemQuantity } from "../stores/storeCart";
import ColorSelect from "./ColorSelect";
import QuantityStepper from "./QuantityStepper";

/**
 * One row = one product, spanning the full width of the list (see the
 * Item Table / cart-row references this was built from) instead of a
 * boxed grid card. This is what keeps things compact on mobile too: a
 * fixed-size thumbnail next to text that wraps, rather than a big square
 * image stacked on top of everything else.
 */
const ProductCard = ({ product }: { product: ProductType }) => {
  const [productTypes, setProductTypes] = useState({
    size: product.sizes[0]!,
    color: product.colors[0]!,
  });

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { addToCart, updateQuantity } = useCartStore();

  // How many of the currently selected size + color are already in the cart.
  const cartQuantity = useCartItemQuantity(
    product.id,
    productTypes.size,
    productTypes.color,
  );

  const cartVariant = {
    id: product.id,
    selectedSize: productTypes.size,
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
    // The cart lives in the account's database record now, so there's
    // nowhere to put an item for someone who isn't signed in yet -
    // prompt sign-in instead of silently dropping it.
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    addToCart({
      ...product,
      quantity: 1,
      selectedSize: productTypes.size,
      selectedColor: productTypes.color,
    });
    toast.success("Product added to cart");
  };

  return (
    <div className="flex items-center gap-3 sm:gap-5 py-3 sm:py-4 border-b border-gray-100 last:border-0">
      {/* THUMBNAIL - fixed, modest size so it never dominates the row */}
      <Link href={`/products/${product.id}`} className="shrink-0">
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 rounded-md overflow-hidden">
          <Image
            src={
              (product.images as Record<string, string>)?.[
                productTypes.color
              ] || ""
            }
            alt={product.name}
            fill
            className="object-contain p-1.5 sm:p-2"
          />
        </div>
      </Link>

      {/* DETAILS - wraps under itself on mobile instead of overflowing */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-medium text-sm leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 hidden sm:block">
            {product.shortDescription}
          </p>

          {/* SIZE / COLOR - compact inline controls, not their own block */}
          <div className="flex items-center gap-2.5 mt-1.5 text-xs">
            <select
              value={productTypes.size}
              className="ring-1 ring-gray-200 rounded px-1.5 py-0.5 text-xs bg-white"
              onChange={(e) =>
                handleProductType({ type: "size", value: e.target.value })
              }
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  {size.toUpperCase()}
                </option>
              ))}
            </select>

            <div className="flex items-center">
              <ColorSelect
                colors={product.colors}
                value={productTypes.color}
                onChange={(value) =>
                  handleProductType({ type: "color", value })
                }
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* PRICE + CTA - right-aligned column on desktop, own row on mobile */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-40 shrink-0">
          <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
            UGX {product.price.toLocaleString()}
          </p>

          {isSignedIn && cartQuantity > 0 ? (
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
              className="ring-1 ring-gray-200 rounded-md p-2 sm:px-3 sm:py-1.5 text-sm cursor-pointer hover:text-white hover:bg-black transition-all duration-200 flex items-center gap-2 shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
