"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import useCartStore from "../stores/storeCart";

type Status = "idle" | "submitting" | "failed";

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;

const MobileMoneyForm = () => {
  const { cart } = useCartStore();
  const { getToken } = useAuth();

  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!PAYMENT_SERVICE_URL) {
      setError("Payment service is not configured. Please try again later.");
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const token = await getToken();
      const res = await fetch(`${PAYMENT_SERVICE_URL}/mobile-money/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cart,

          phone: phone.trim()
            ? `+256${phone.trim().replace(/^0+/, "")}`
            : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.redirectUrl) {
        throw new Error("Payment service did not return a redirect URL");
      }

      window.location.href = data.redirectUrl;
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-md border border-gray-200 p-3 sm:ml-7 sm:w-auto sm:p-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="momoPhone"
          className="text-xs font-medium text-gray-500"
        >
          Enter Phone Number
        </label>
        <div className="flex w-full min-w-0 items-center rounded-md border border-gray-300 px-3 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
          <span className="mr-2 shrink-0 text-base text-gray-400 sm:text-sm">
            +256
          </span>
          <input
            id="momoPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="7XXXXXXXX"
            inputMode="tel"
            autoComplete="tel-national"
            className="min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        You&apos;ll choose MTN or Airtel Money and approve the payment on
        Pesapal&apos;s secure page.
      </p>

      {error && <p className="break-words text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handlePay}
        disabled={status === "submitting"}
        className="w-full rounded-md bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "submitting"
          ? "Redirecting to Pesapal..."
          : "Pay with Mobile Money"}
      </button>
    </div>
  );
};

export default MobileMoneyForm;
