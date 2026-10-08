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

const ProductInteraction = ({ product }: { product: ProductType }) => {
  const router = useRouter();
  const {
    size: selectedSize,
    color: selectedColor,
    setSize,
    setColor,
  } = useProductSelection();
  const [quantity, setQuantity] = useState(1);

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { addToCart, updateQuantity } = useCartStore();

  // How many of this size + color are already in the cart.
  const cartQuantity = useCartItemQuantity(
    product.id,
    selectedSize,
    selectedColor,
  );
  const inCart = !!isSignedIn && cartQuantity > 0;

  const cartVariant = {
    id: product.id,
    selectedSize,
    selectedColor,
  };

  const addCurrentSelection = () =>
    addToCart({
      ...product,
      quantity,
      selectedColor,
      selectedSize,
    });

  const handleAddToCart = () => {
    // The cart lives in the account's database record, so there's nowhere to
    // put an item for someone who isn't signed in yet: prompt sign-in.
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    addCurrentSelection();
    setQuantity(1);
    toast.success("Product added to cart");
  };

  // "Buy this item": make sure it is in the cart, then go straight to it.
  const handleBuyNow = () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (cartQuantity === 0) addCurrentSelection();
    startLoader();
    router.push("/cart");
  };

  return (
    <div className="flex flex-col gap-7">
      {/* SIZE */}
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
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSize(size)}
                className={`h-11 min-w-12 max-w-full cursor-pointer truncate rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                  selected
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-900"
                }`}
              >
                {size.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* COLOR */}
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

      {/* QUANTITY */}
      <div>
        <span className="text-sm font-medium text-gray-900">Quantity</span>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          {inCart ? (
            <>
              <QuantityStepper
                quantity={cartQuantity}
                // Minus at 1 removes the item, returning to "Add to Cart".
                onDecrease={() => updateQuantity(cartVariant, cartQuantity - 1)}
                onIncrease={() => updateQuantity(cartVariant, cartQuantity + 1)}
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800 ring-1 ring-green-900/10">
                <Check className="h-3.5 w-3.5" />
                {cartQuantity} in your cart
              </span>
              <Link
                href="/cart"
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
    </div>
  );
};

export default ProductInteraction;
