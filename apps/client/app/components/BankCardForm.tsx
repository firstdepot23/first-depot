"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import useCartStore from "../stores/storeCart";

type Status =
  "idle" | "tokenizing" | "submitting" | "pending" | "successful" | "failed";

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_SERVICE_URL;

/**
 * *** DO NOT replace this with "just fetch(/bank-card/initiate) with the
 * raw card fields" - read this before wiring up a real gateway. ***
 *
 * Sending a card number/CVV to your own backend (even just passing it
 * through, even briefly) puts your whole system in PCI-DSS SAQ D scope -
 * the strictest tier, requiring an annual on-site audit and much tighter
 * infrastructure requirements.
 *
 * The way around that: whichever Visa/Mastercard-accepting gateway you
 * build this against (DPO Group, Network International, Pesapal, and
 * Flutterwave all accept cards in Uganda) will ship a client-side SDK
 * with hosted card fields or a drop-in tokenize() call - the exact same
 * pattern Stripe's own PaymentElement already uses elsewhere in this
 * app. That SDK turns the card into an opaque token *in the browser*;
 * only that token is sent to your backend, never the PAN/CVV.
 *
 * Replace this function's body with that gateway's tokenize call once
 * you've picked one and added their SDK/script.
 */
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
      // The raw card fields never leave the browser as-is - they only
      // ever feed into tokenizeCard(), which (once configured) hands
      // back a token from the gateway's own SDK.
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
    <div className="ml-7 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Cardholder Name</label>
        <input
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          placeholder="Jane Doe"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Card Number</label>
        <input
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
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-gray-500">Expiry (MM/YY)</label>
          <input
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
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-gray-500">CVV</label>
          <input
            value={cvv}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="123"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
