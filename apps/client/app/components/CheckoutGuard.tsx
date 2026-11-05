"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useCartStore from "../stores/storeCart";
import useCheckoutStore from "../stores/storeCheckout";
import {
  fetchCheckoutDetails,
  toShippingForm,
} from "../api/svc/payment/paymentApi";
import { parseSegment, SEGMENT_SLUGS } from "../data/segments";
import { blockedFor } from "../lib/productChoices";
import { groupCart, pickSegment, withSegment } from "../lib/segmentCart";
import { startLoader } from "./NavigationProgress";

// Each step is its own page, so someone can land on /cart/shipping or
// /cart/payment directly (a bookmark, a refresh). This sends them back to the
// step they're missing, and restores their saved delivery details when they
// refresh on the payment step.
//
// There are four carts (hardware, grocery, fast food, pharmacy). The step pages work on
// ONE of them, named in the URL (?segment=...). Delivery details are the same
// for every cart, so they are restored once and reused.
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      const groups = groupCart(useCartStore.getState().cart);
      const fromUrl = parseSegment(searchParams?.get("segment"));
      const filled = SEGMENT_SLUGS.filter((s) => groups[s].length > 0);

      // No ?segment= and more than one cart has items: don't guess. Guessing
      // could send someone to pay for the wrong cart. /cart lets them pick.
      if (!fromUrl && filled.length > 1) {
        redirect("/cart");
        return;
      }

      const segment = pickSegment(groups, fromUrl);

      // This cart is empty: back to /cart, which opens a cart that has items
      // (or says everything is empty).
      if (groups[segment].length === 0) {
        redirect("/cart");
        return;
      }

      // Prescription-only, out of stock or expired lines: the cart page asks
      // for them to be removed first. (Typing the URL must not skip that.)
      if (
        groups[segment].some(
          (item) => blockedFor(item, item.selectedSize) !== null,
        )
      ) {
        redirect(withSegment("/cart", segment));
        return;
      }

      // An old link with no ?segment=: pin the cart we picked into the URL,
      // so it can't switch to another cart once this one is paid and empties.
      if (!fromUrl) {
        router.replace(withSegment(pathname, segment), { scroll: false });
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
        redirect(withSegment("/cart/shipping", segment));
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
