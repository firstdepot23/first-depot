"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import useCartStore from "../stores/storeCart";
import { fetchServerCart, saveServerCart } from "../lib/cartApi";

const SAVE_DEBOUNCE_MS = 600;

/**
 * Keeps the cart in sync with MongoDB - the only place it lives now.
 * Mount this once near the root of the app, inside <ClerkProvider>
 * (it needs useAuth) - e.g. in app/layout.tsx.
 *
 * - On sign-in: fetches the account's cart from the server and loads
 *   it into the store. No merge step - since the cart only ever exists
 *   in the database, the server's copy is the only copy, so loading it
 *   is a plain replace, not a merge. That also makes this safe to run
 *   more than once with the same result (e.g. across reloads).
 * - While signed in: every local cart change is pushed to the server,
 *   debounced so rapid +/- clicks don't fire a request each.
 * - On sign-out: clears the local store.
 *
 * Renders nothing - it's a background sync, not UI.
 */
const CartSync = () => {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  const cart = useCartStore((state) => state.cart);
  // Whether the store's cart actually reflects the server yet (false
  // until the first successful replaceCart/clearCart). The push effect
  // below must never run before this is true - see the comment there.
  const cartLoaded = useCartStore((state) => state.isLoaded);
  const replaceCart = useCartStore((state) => state.replaceCart);
  const clearCart = useCartStore((state) => state.clearCart);

  // Tracks which user's cart we've already fetched, so sign-in only
  // fetches once per session instead of on every render.
  const lastFetchedUserId = useRef<string | null>(null);
  // Set right after replaceCart() during the sign-in load, so the
  // "push on change" effect below doesn't immediately re-save what was
  // just loaded from the server.
  const skipNextPush = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load-on-sign-in / clear-on-sign-out.
  useEffect(() => {
    if (!authLoaded) return;

    const run = async () => {
      if (isSignedIn && userId && lastFetchedUserId.current !== userId) {
        lastFetchedUserId.current = userId;
        try {
          const token = await getToken();
          if (!token) return;

          const serverCart = await fetchServerCart(token);
          skipNextPush.current = true;
          replaceCart(serverCart);
        } catch (error) {
          console.error("Cart fetch failed:", error);
        }
      }

      if (!isSignedIn && lastFetchedUserId.current !== null) {
        lastFetchedUserId.current = null;
        clearCart();
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn, userId]);

  // Push local changes to the server while signed in.
  //
  // cartLoaded is the critical guard here. Without it, this effect fires
  // the instant authLoaded/isSignedIn become true - the SAME render the
  // load effect above starts its (async) fetch. At that moment `cart`
  // is still [] (the store's initial value, nothing fetched yet), so
  // this would schedule a save of an EMPTY cart. Normally that stale
  // timeout gets cancelled when the real fetch finishes and `cart`
  // changes (the cleanup below clears it) - but if the fetch takes
  // longer than SAVE_DEBOUNCE_MS (slow network, several items to
  // hydrate against product-service), the stale empty-cart save fires
  // FIRST and overwrites the real cart in MongoDB with nothing. That's
  // not just a display glitch - it actually erases the saved cart.
  // Requiring cartLoaded means this effect can't run at all until a
  // real load has already landed, so there's no empty cart left to
  // accidentally push.
  useEffect(() => {
    if (!authLoaded || !isSignedIn || !cartLoaded) return;

    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await saveServerCart(token, cart);
      } catch (error) {
        console.error("Cart save failed:", error);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, authLoaded, isSignedIn, cartLoaded]);

  return null;
};

export default CartSync;
