"use client";

import { useEffect } from "react";

// Pesapal sends the customer here after they pay (or give up). Set
// PESAPAL_CALLBACK_URL on the payment service to
//   https://first-depot.com/payment/callback
//
// For CARD payments this page opens INSIDE the payment iframe, so it first
// breaks out to the full browser window, then shows the Orders page. Orders
// asks Pesapal for the real result, so this page doesn't need to know whether
// the payment worked - it only moves the customer on.
//
// Breaking out is allowed because this page is on the same site as the page
// that holds the iframe.
const ORDERS_URL = "/orders";

const PaymentCallbackPage = () => {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.replace(ORDERS_URL);
        return;
      }
    } catch {
      // Not allowed to touch the outer window: fall through and navigate here.
    }
    window.location.replace(ORDERS_URL);
  }, []);

  return (
    <div className="flex justify-center py-16">
      <p className="text-sm text-gray-500">Checking your payment...</p>
    </div>
  );
};

export default PaymentCallbackPage;
