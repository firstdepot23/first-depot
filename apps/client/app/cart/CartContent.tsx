"use client";

import ShippingForm from "../components/ShippingForm";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import QuantityStepper from "../components/QuantityStepper";
import useCartStore, { useCartLoaded } from "../stores/storeCart";
import { ShippingFormInputs } from "@repo/types";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const steps = [
  {
    id: 1,
    title: "Shopping Cart",
  },
  {
    id: 2,
    title: "Shipping Address",
  },
  {
    id: 3,
    title: "Payment Method",
  },
];

const formatUGX = (amount: number) => `UGX ${amount.toLocaleString("en-US")}`;

const CartContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shippingForm, setShippingForm] = useState<ShippingFormInputs>();

  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const cartLoaded = useCartLoaded();
  // "Ready" covers both: Clerk knows who's signed in, AND (if they are
  // signed in) their cart has actually been fetched from the server.
  const ready = authLoaded && (!isSignedIn || cartLoaded);

  const activeStep = parseInt(searchParams.get("step") || "1");

  const { cart, removeFromCart, updateQuantity } = useCartStore();

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const goToStep = (step: number) => {
    router.push(`/cart?step=${step}`, { scroll: false });
  };

  // Steps can only be opened once the earlier ones are complete.
  const canOpenStep = (step: number) => {
    if (step === 1) return true;
    if (cart.length === 0) return false;
    if (step === 2) return true;
    return Boolean(shippingForm);
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center mt-12">
      {/* TITLE */}
      <h1 className="text-2xl font-medium">Your Shopping Cart</h1>

      {authLoaded && !isSignedIn ? (
        // The cart lives in the account's database record - there's
        // nothing to show without being signed in.
        <div className="w-full max-w-md shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-gray-500">
            Sign in to view your cart and continue shopping.
          </p>
          <button
            type="button"
            onClick={() => openSignIn()}
            className="bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
          >
            Sign in
          </button>
        </div>
      ) : (
        <>
          {/* STEPS - click a step to jump to it */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {steps.map((step) => {
              const isActive = step.id === activeStep;
              const enabled = canOpenStep(step.id);
              return (
                <button
                  type="button"
                  key={step.id}
                  disabled={!enabled}
                  onClick={() => goToStep(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-2 border-b-2 pb-4 transition-colors ${
                    isActive ? "border-gray-800" : "border-gray-200"
                  } ${
                    enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full text-white p-4 flex items-center justify-center ${
                      isActive ? "bg-gray-800" : "bg-gray-400"
                    }`}
                  >
                    {step.id}
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      isActive ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </button>
              );
            })}
          </div>
          {/* STEPS & DETAILS */}
          <div className="w-full flex flex-col lg:flex-row gap-16">
            {/* STEPS */}
            <div className="w-full lg:w-7/12 shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col gap-8 h-max">
              {!ready ? (
                <p className="text-sm text-gray-500">Loading your cart...</p>
              ) : activeStep === 1 ? (
                cart.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-gray-500">Your cart is empty.</p>
                    <Link
                      href="/products"
                      className="bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Browse products
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
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
                          (item.images as Record<string, string>)?.[
                            item.selectedColor
                          ] || "";
                        const productHref = `/products/${item.id}?size=${encodeURIComponent(
                          item.selectedSize,
                        )}&color=${encodeURIComponent(item.selectedColor)}`;

                        return (
                          // SINGLE CART ITEM
                          <li
                            className="flex gap-4 py-5"
                            key={
                              item.id + item.selectedSize + item.selectedColor
                            }
                          >
                            {/* IMAGE - links to the product page */}
                            <Link
                              href={productHref}
                              className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-gray-50 rounded-lg overflow-hidden"
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

                            <div className="flex flex-1 flex-col justify-between gap-4 min-w-0">
                              {/* NAME, VARIANT, PRICE */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <Link
                                    href={productHref}
                                    className="text-sm font-medium hover:underline line-clamp-2"
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
                                <div className="text-right shrink-0">
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

                              {/* REMOVE + QUANTITY */}
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item)}
                                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                                <QuantityStepper
                                  quantity={item.quantity}
                                  disableDecrease={item.quantity <= 1}
                                  onDecrease={() =>
                                    updateQuantity(item, item.quantity - 1)
                                  }
                                  onIncrease={() =>
                                    updateQuantity(item, item.quantity + 1)
                                  }
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* TOTAL BELOW THE LIST */}
                    <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Subtotal ({totalItems}{" "}
                        {totalItems === 1 ? "item" : "items"})
                      </p>
                      <p className="text-lg font-semibold">
                        {formatUGX(subtotal)}
                      </p>
                    </div>
                  </div>
                )
              ) : activeStep === 2 ? (
                <ShippingForm setShippingForm={setShippingForm} />
              ) : activeStep === 3 && shippingForm ? (
                <PaymentMethodSelector shippingForm={shippingForm} />
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-gray-500">
                    Please fill in the shipping form to continue.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="underline text-sm text-gray-800 cursor-pointer"
                  >
                    Go to shipping address
                  </button>
                </div>
              )}
            </div>
            {/* DETAILS */}
            <div className="w-full lg:w-5/12 shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col gap-8 h-max">
              <h2 className="font-semibold">Cart Details</h2>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Subtotal</p>
                  <p className="font-medium">
                    {ready ? formatUGX(subtotal) : "-"}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Discount(10%)</p>
                  <p className="font-medium">UGX 0</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Shipping Fee</p>
                  <p className="font-medium">UGX 0</p>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between">
                  <p className="text-gray-800 font-semibold">Total</p>
                  <p className="font-medium">
                    {ready ? formatUGX(subtotal) : "-"}
                  </p>
                </div>
              </div>
              {activeStep === 1 && (
                <button
                  type="button"
                  disabled={!ready || cart.length === 0}
                  onClick={() => goToStep(2)}
                  className="w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => goToStep(activeStep - 1)}
                  className="w-full ring-1 ring-gray-300 hover:bg-gray-50 transition-all duration-300 text-gray-800 p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartContent;
