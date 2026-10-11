"use client";

import { DELIVERY_CITY_INFO, getDeliveryFee } from "@repo/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useCartStore from "../stores/storeCart";
import useCheckoutStore from "../stores/storeCheckout";
import { formatUGX, getActiveStep } from "../lib/checkout";
import { startLoader } from "./NavigationProgress";

const CartSummary = ({ ready }: { ready: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const step = getActiveStep(pathname);

  const cart = useCartStore((state) => state.cart);
  const deliveryMethod = useCheckoutStore((state) => state.deliveryMethod);
  const deliveryCity = useCheckoutStore((state) => state.deliveryCity);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  // The delivery fee only counts once the customer reaches the shipping step.
  const showDelivery = step >= 2;
  const deliveryFee = getDeliveryFee(deliveryMethod, deliveryCity);
  const total = subtotal + (showDelivery ? deliveryFee : 0);

  const go = (href: string) => {
    startLoader();
    router.push(href);
  };

  const deliveryText = !showDelivery
    ? "Chosen at next step"
    : deliveryMethod === "pickup"
      ? "Free (pickup)"
      : `${formatUGX(deliveryFee)}${
          deliveryCity === "other"
            ? ""
            : ` · ${DELIVERY_CITY_INFO[deliveryCity].label}`
        }`;

  return (
    <div className="flex h-max w-full min-w-0 flex-col gap-6 rounded-lg border border-gray-100 p-4 shadow-lg sm:gap-8 sm:p-8 lg:w-5/12">
      <h2 className="font-semibold">Cart Details</h2>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-4 text-sm">
          <p className="text-gray-500">Subtotal</p>
          <p className="font-medium">{ready ? formatUGX(subtotal) : "-"}</p>
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <p className="text-gray-500">Discount(10%)</p>
          <p className="font-medium">UGX 0</p>
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <p className="shrink-0 text-gray-500">Delivery</p>
          <p className="text-right font-medium">{ready ? deliveryText : "-"}</p>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between gap-4">
          <p className="font-semibold text-gray-800">Total</p>
          <p className="font-medium">{ready ? formatUGX(total) : "-"}</p>
        </div>
      </div>

      {step === 1 && (
        <button
          type="button"
          disabled={!ready || cart.length === 0}
          onClick={() => go("/cart/shipping")}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-800 p-2.5 text-white transition-all duration-300 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
          <ArrowRight className="h-3 w-3" />
        </button>
      )}

      {step > 1 && (
        <button
          type="button"
          onClick={() => go(step === 2 ? "/cart" : "/cart/shipping")}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg p-2.5 text-gray-800 ring-1 ring-gray-300 transition-all duration-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
      )}
    </div>
  );
};

export default CartSummary;
