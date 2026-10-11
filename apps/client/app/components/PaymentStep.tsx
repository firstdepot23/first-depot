"use client";

import { DELIVERY_CITY_INFO } from "@repo/types";
import { MapPin, Store } from "lucide-react";
import Link from "next/link";
import useCheckoutStore from "../stores/storeCheckout";
import { formatUGX } from "../lib/checkout";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentWatcher from "./PaymentWatcher";

const PaymentStep = () => {
  const shipping = useCheckoutStore((state) => state.shipping);
  if (!shipping) return null;

  const isPickup = shipping.deliveryMethod === "pickup";
  const Icon = isPickup ? Store : MapPin;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* WHERE IT'S GOING */}
      <div className="flex items-start gap-3 rounded-md border border-gray-200 p-3 text-sm sm:p-4">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {isPickup ? "Pickup from our station" : "Delivery"}
          </p>
          <p className="break-words text-xs text-gray-500">
            {shipping.name} · {shipping.phone}
          </p>
          <p className="break-words text-xs text-gray-500">
            {shipping.address}, {shipping.city}
            {!isPickup &&
              ` · ${formatUGX(DELIVERY_CITY_INFO[shipping.deliveryCity].fee)}`}
          </p>
        </div>
        <Link
          href="/cart/shipping"
          className="shrink-0 text-xs text-gray-500 underline hover:text-black"
        >
          Change
        </Link>
      </div>

      <PaymentMethodSelector />
      <PaymentWatcher />
    </div>
  );
};

export default PaymentStep;
