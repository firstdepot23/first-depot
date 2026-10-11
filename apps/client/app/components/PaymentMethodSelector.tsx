"use client";

import { getDeliveryFee } from "@repo/types";
import { useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import MobileMoneyForm from "./MobileMoneyForm";
import BankCardForm from "./BankCardForm";
import useCartStore from "../stores/storeCart";
import useCheckoutStore from "../stores/storeCheckout";

type PaymentMethod = "mobile_money" | "bank_card";

const OPTIONS: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  Icon: typeof Smartphone;
}[] = [
  {
    id: "mobile_money",
    title: "Mobile Money",
    subtitle: "MTN Mobile Money, Airtel Money",
    Icon: Smartphone,
  },
  {
    id: "bank_card",
    title: "Bank Card",
    subtitle: "Visa, Mastercard",
    Icon: CreditCard,
  },
];

// The delivery details are saved on the server when the shipping step is
// submitted, and the payment service adds the delivery fee itself when the
// payment starts. The fee shown here is the same number, so the "Total to
// pay" matches what is charged.
const PaymentMethodSelector = () => {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const cart = useCartStore((state) => state.cart);
  const deliveryMethod = useCheckoutStore((state) => state.deliveryMethod);
  const deliveryCity = useCheckoutStore((state) => state.deliveryCity);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = getDeliveryFee(deliveryMethod, deliveryCity);
  const total = subtotal + deliveryFee;

  const renderForm = (id: PaymentMethod) => {
    if (method !== id) return null;
    if (id === "mobile_money") return <MobileMoneyForm />;
    return <BankCardForm />;
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-md bg-gray-50 px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>Subtotal</span>
          <span>UGX {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>{deliveryMethod === "pickup" ? "Pickup" : "Delivery"}</span>
          <span>
            {deliveryFee === 0 ? "Free" : `UGX ${deliveryFee.toLocaleString()}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-2">
          <span className="text-sm text-gray-500">Total to pay</span>
          <span className="text-base font-semibold sm:text-lg">
            UGX {total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {OPTIONS.map(({ id, title, subtitle, Icon }) => {
          const selected = method === id;
          return (
            <div key={id} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMethod(id)}
                aria-pressed={selected}
                className={`flex w-full min-w-0 items-center gap-3 rounded-md border p-3 text-left transition-colors sm:p-4 ${
                  selected
                    ? "border-black ring-1 ring-black"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-black" : "border-gray-300"
                  }`}
                >
                  {selected && (
                    <span className="h-2 w-2 rounded-full bg-black" />
                  )}
                </span>
                <Icon className="h-5 w-5 shrink-0 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="break-words text-xs text-gray-500">
                    {subtitle}
                  </p>
                </div>
              </button>

              {renderForm(id)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
