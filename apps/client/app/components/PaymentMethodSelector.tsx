"use client";

import { ShippingFormInputs } from "@repo/types";
import { useState } from "react";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import StripePaymentForm from "./StripePaymentForm";
import MobileMoneyForm from "./MobileMoneyForm";
import BankCardForm from "./BankCardForm";
import useCartStore from "../stores/storeCart";

type PaymentMethod = "mobile_money" | "bank_card" | "stripe";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3">
        <span className="text-sm text-gray-500">Total to pay</span>
        <span className="text-lg font-semibold">
          UGX {total.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {/* MOBILE MONEY */}
        <button
          type="button"
          onClick={() => setMethod("mobile_money")}
          className={`flex items-center gap-3 rounded-md border p-4 text-left transition-colors ${
            method === "mobile_money"
              ? "border-black ring-1 ring-black"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
              method === "mobile_money" ? "border-black" : "border-gray-300"
            }`}
          >
            {method === "mobile_money" && (
              <span className="h-2 w-2 rounded-full bg-black" />
            )}
          </span>
          <Smartphone className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Mobile Money</p>
            <p className="text-xs text-gray-500">
              MTN Mobile Money, Airtel Money
            </p>
          </div>
        </button>

        {method === "mobile_money" && <MobileMoneyForm />}

        {/* BANK CARD - your own Visa/Mastercard gateway, not Stripe */}
        <button
          type="button"
          onClick={() => setMethod("bank_card")}
          className={`flex items-center gap-3 rounded-md border p-4 text-left transition-colors ${
            method === "bank_card"
              ? "border-black ring-1 ring-black"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
              method === "bank_card" ? "border-black" : "border-gray-300"
            }`}
          >
            {method === "bank_card" && (
              <span className="h-2 w-2 rounded-full bg-black" />
            )}
          </span>
          <CreditCard className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Bank Card</p>
            <p className="text-xs text-gray-500">Visa, Mastercard</p>
          </div>
        </button>

        {method === "bank_card" && <BankCardForm />}

        {/* STRIPE */}
        <button
          type="button"
          onClick={() => setMethod("stripe")}
          className={`flex items-center gap-3 rounded-md border p-4 text-left transition-colors ${
            method === "stripe"
              ? "border-black ring-1 ring-black"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
              method === "stripe" ? "border-black" : "border-gray-300"
            }`}
          >
            {method === "stripe" && (
              <span className="h-2 w-2 rounded-full bg-black" />
            )}
          </span>
          <Wallet className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Pay with Stripe</p>
            <p className="text-xs text-gray-500">
              International cards via Stripe
            </p>
          </div>
        </button>

        {method === "stripe" && (
          <div className="ml-7">
            <StripePaymentForm shippingForm={shippingForm} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
