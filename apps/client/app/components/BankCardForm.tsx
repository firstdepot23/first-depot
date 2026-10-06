"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import useCartStore from "../stores/storeCart";

type Status =
  "idle" | "tokenizing" | "submitting" | "pending" | "successful" | "failed";

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;

const inputClass =
  "w-full min-w-0 rounded-md border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-black focus:ring-1 focus:ring-black sm:text-sm";

const tokenizeCard = async (details: {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}): Promise<string> => {
  throw new Error(
    "Card gateway is not configured yet. Wire up your provider's client-side tokenization in BankCardForm.tsx (see the comment above tokenizeCard) before enabling this option.",
  );
};

const BankCardForm = () => {
  const { cart } = useCartStore();
  const { getToken } = useAuth();

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!cardHolder || !cardNumber || !expiry || !cvv) {
      setError("Fill in all card details");
      return;
    }

    if (!PAYMENT_SERVICE_URL) {
      setError("Payment service is not configured. Please try again later.");
      return;
    }

    setError(null);
    setStatus("tokenizing");

    try {
      const cardToken = await tokenizeCard({
        cardHolder,
        cardNumber,
        expiry,
        cvv,
      });

      setStatus("submitting");
      const authToken = await getToken();
      const res = await fetch(`${PAYMENT_SERVICE_URL}/bank-card/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ cart, cardToken, cardHolder }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      setStatus("pending");
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-md border border-gray-200 p-3 sm:ml-7 sm:w-auto sm:p-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cardHolder"
          className="text-xs font-medium text-gray-500"
        >
          Cardholder Name
        </label>
        <input
          id="cardHolder"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="cc-name"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cardNumber"
          className="text-xs font-medium text-gray-500"
        >
          Card Number
        </label>
        <input
          id="cardNumber"
          value={cardNumber}
          onChange={(e) =>
            setCardNumber(
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 16)
                .replace(/(.{4})/g, "$1 ")
                .trim(),
            )
          }
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          autoComplete="cc-number"
          className={inputClass}
        />
      </div>

      {/* grid-cols-2 + min-w-0 keeps Expiry and CVV side by side inside the
          screen width; no horizontal scrolling. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="expiry" className="text-xs font-medium text-gray-500">
            Expiry (MM/YY)
          </label>
          <input
            id="expiry"
            value={expiry}
            onChange={(e) =>
              setExpiry(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4)
                  .replace(/(\d{2})(\d{0,2})/, (_, a, b) =>
                    b ? `${a}/${b}` : a,
                  ),
              )
            }
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
            className={inputClass}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="cvv" className="text-xs font-medium text-gray-500">
            CVV
          </label>
          <input
            id="cvv"
            value={cvv}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="break-words text-sm text-red-600">{error}</p>}

      {status === "pending" && (
        <p className="text-sm text-amber-600">Processing your payment...</p>
      )}

      {status === "successful" && (
        <p className="text-sm text-green-600">Payment successful!</p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={
          status === "tokenizing" ||
          status === "submitting" ||
          status === "pending"
        }
        className="w-full rounded-md bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "tokenizing"
          ? "Securing card details..."
          : status === "submitting" || status === "pending"
            ? "Processing..."
            : "Pay with Card"}
      </button>
    </div>
  );
};

export default BankCardForm;
