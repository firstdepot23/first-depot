"use client";

import { useEffect, useRef } from "react";
import useCartStore from "../stores/storeCart";
import { groupCart, useCheckoutCart } from "../lib/segmentCart";

const POLL_MS = 5_000;
const MAX_WATCH_MS = 10 * 60 * 1000;

// While the customer is on the payment step, keep asking CartSync to check
// whether their payment went through. When it did, CartSync removes the paid
// items from the cart (and saves that), so the cart ends up at zero. If the
// payment fails or is still pending, nothing is removed.
//
// It also checks the moment the customer comes back to this tab, e.g. after
// approving a mobile money prompt in another app.
const PaymentWatcher = () => {
  const requestReconcile = useCartStore((state) => state.requestReconcile);
  // Watch only the cart being paid for. The other carts stay full after this
  // one is paid, so "the whole cart is empty" is no longer the signal to stop.
  const { segment } = useCheckoutCart();
  const segmentRef = useRef(segment);
  segmentRef.current = segment;

  useEffect(() => {
    const startedAt = Date.now();

    const check = () => {
      if (document.visibilityState !== "visible") return;
      requestReconcile();
    };

    const timer = setInterval(() => {
      const cartIsEmpty =
        groupCart(useCartStore.getState().cart)[segmentRef.current].length ===
        0;
      if (cartIsEmpty || Date.now() - startedAt > MAX_WATCH_MS) {
        clearInterval(timer);
        return;
      }
      check();
    }, POLL_MS);

    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [requestReconcile]);

  return null;
};

export default PaymentWatcher;
