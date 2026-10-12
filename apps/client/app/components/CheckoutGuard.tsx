"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useCartStore from "../stores/storeCart";
import useCheckoutStore from "../stores/storeCheckout";
import {
  fetchCheckoutDetails,
  toShippingForm,
} from "../api/svc/payment/paymentApi";
import { startLoader } from "./NavigationProgress";

// Each step is its own page, so someone can land on /cart/shipping or
// /cart/payment directly (a bookmark, a refresh). This sends them back to the
// step they're missing, and restores their saved delivery details when they
// refresh on the payment step.
//
// It checks ONCE, when the page opens. It must not keep watching: when a
// payment succeeds the cart empties, and that must not bounce the customer
// away from the payment step.
const CheckoutGuard = ({
  requires,
  children,
}: {
  requires: "cart" | "shipping";
  children: ReactNode;
}) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const setShipping = useCheckoutStore((state) => state.setShipping);
  const [allowed, setAllowed] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const redirect = (href: string) => {
      startLoader();
      router.replace(href);
    };

    const run = async () => {
      if (useCartStore.getState().cart.length === 0) {
        redirect("/cart");
        return;
      }

      if (requires === "shipping" && !useCheckoutStore.getState().shipping) {
        try {
          const token = await getToken();
          const saved = token ? await fetchCheckoutDetails(token) : null;
          if (saved) {
            setShipping(toShippingForm(saved));
            setAllowed(true);
            return;
          }
        } catch (error) {
          console.error("Could not restore delivery details:", error);
        }
        redirect("/cart/shipping");
        return;
      }

      setAllowed(true);
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!allowed) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return <>{children}</>;
};

export default CheckoutGuard;
