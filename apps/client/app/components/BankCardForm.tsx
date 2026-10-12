"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import useCartStore from "../stores/storeCart";

type Status = "idle" | "loading" | "ready" | "failed";

// Goes through this site's own server (app/api/svc/[service]/[...path]) rather
// than straight to the payment service's *.onrender.com address, so it works
// for visitors whose network can't resolve that hostname.
const PAYMENT_API = "/api/svc/payment";

// Card details are entered on Pesapal's secure hosted page inside the iframe
// below - this component never sees or sends a card number or CVV.
const BankCardForm = () => {
  const { cart } = useCartStore();
  const { getToken } = useAuth();

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  const handleStart = async () => {
    setError(null);
    setStatus("loading");

    try {
      const token = await getToken();
      const res = await fetch(`${PAYMENT_API}/bank-card/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.redirectUrl) {
        throw new Error("Payment service did not return a payment page URL");
      }

      setIframeUrl(data.redirectUrl);
      setStatus("ready");
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-md border border-gray-200 p-3 sm:ml-7 sm:w-auto sm:p-4">
      {iframeUrl ? (
        <iframe
          src={iframeUrl}
          title="Pesapal secure card payment"
          className="h-[620px] w-full rounded-md border border-gray-200"
        />
      ) : (
        <>
          <p className="text-xs text-gray-500">
            You&apos;ll enter your Visa or Mastercard details on Pesapal&apos;s
            secure payment page. Your card details are never stored on our site.
          </p>

          {error && <p className="break-words text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleStart}
            disabled={status === "loading"}
            className="w-full rounded-md bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === "loading"
              ? "Preparing secure payment..."
              : "Continue to card payment"}
          </button>
        </>
      )}
    </div>
  );
};
export default BankCardForm;
