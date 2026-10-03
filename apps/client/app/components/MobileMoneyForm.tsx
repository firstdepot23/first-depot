"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import useCartStore from "../stores/storeCart";

type Status = "idle" | "submitting" | "failed";

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_SERVICE_URL;

/**
 * Pesapal's mobile money flow is redirect-based, not a direct USSD push
 * we trigger ourselves: /mobile-money/initiate creates a Pesapal order
 * and hands back a redirect_url to Pesapal's own hosted payment page,
 * where the customer picks MTN or Airtel Money and approves the prompt
 * on their phone. We just send the browser there. Pesapal calls our IPN
 * webhook when the payment resolves, and the customer lands back on
 * /return with the result (see page.tsx and webhooks.route.ts).
 *
 * That's why this component no longer polls a status endpoint itself -
 * there's nothing to poll until the customer comes back from Pesapal.
 */
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
          // Optional - overrides the phone number Clerk has on file.
          // Pesapal also lets the customer change it on their own page,
          // so this is a convenience, not a hard requirement.
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
    <div className="ml-7 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Enter Phone Number</label>
        <div className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm">
          <span className="text-gray-400 mr-2">+256</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="7XXXXXXXX"
            className="flex-1 outline-none"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        You&apos;ll choose MTN or Airtel Money and approve the payment on
        Pesapal&apos;s secure page.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handlePay}
        disabled={status === "submitting"}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "submitting"
          ? "Redirecting to Pesapal..."
          : "Pay with Mobile Money"}
      </button>
    </div>
  );
};

export default MobileMoneyForm;
