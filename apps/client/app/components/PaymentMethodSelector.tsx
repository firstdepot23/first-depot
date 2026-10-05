"use client";

import { ShippingFormInputs } from "@repo/types";
import { useState } from "react";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import StripePaymentForm from "./StripePaymentForm";
import MobileMoneyForm from "./MobileMoneyForm";
import BankCardForm from "./BankCardForm";
import useCartStore from "../stores/storeCart";

type PaymentMethod = "mobile_money" | "bank_card" | "stripe";

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
  {
    id: "stripe",
    title: "Pay with Stripe",
    subtitle: "International cards via Stripe",
    Icon: Wallet,
  },
];

// Three separate payment rails: Mobile Money and Bank Card go through
// your own gateways (both scaffolded, not yet configured), Stripe stays
// on the existing working flow under its own explicit option.
const PaymentMethodSelector = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const { cart } = useCartStore();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderForm = (id: PaymentMethod) => {
    if (method !== id) return null;
    if (id === "mobile_money") return <MobileMoneyForm />;
    if (id === "bank_card") return <BankCardForm />;
    return (
      <div className="w-full min-w-0 sm:ml-7 sm:w-auto">
        <StripePaymentForm shippingForm={shippingForm} />
      </div>
    );
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-3 sm:px-4">
        <span className="text-sm text-gray-500">Total to pay</span>
        <span className="text-base font-semibold sm:text-lg">
          UGX {total.toLocaleString()}
        </span>
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
