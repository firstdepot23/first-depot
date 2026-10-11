"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QuantityStepper from "./QuantityStepper";
import useCartStore from "../stores/storeCart";
import { formatUGX } from "../lib/checkout";

const CartItemsList = () => {
  const cart = useCartStore((state) => state.cart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  if (cart.length === 0) {
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
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="font-semibold">Cart ({totalItems})</h2>
        <Link
          href="/products"
          className="text-xs text-gray-500 underline hover:text-black"
        >
          Continue shopping
        </Link>
      </div>

      {/* CART ITEMS */}
      <ul className="flex flex-col divide-y divide-gray-200">
        {cart.map((item) => {
          const imageSrc =
            (item.images as Record<string, string>)?.[item.selectedColor] || "";
          const productHref = `/products/${item.id}?size=${encodeURIComponent(
            item.selectedSize,
          )}&color=${encodeURIComponent(item.selectedColor)}`;

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
                    <p className="text-xs text-gray-500">
                      Size: {item.selectedSize.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Color: {item.selectedColor}
                    </p>
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

      {/* TOTAL BELOW THE LIST */}
      <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
        <p className="text-sm text-gray-500">
          Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
        </p>
        <p className="text-lg font-semibold">{formatUGX(subtotal)}</p>
      </div>
    </div>
  );
};

export default CartItemsList;
