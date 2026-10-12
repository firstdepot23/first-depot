"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import useCartStore from "../stores/storeCart";
import useCheckoutStore from "../stores/storeCheckout";
import { fetchServerCart, saveServerCart } from "../api/svc/cart/cartApi";
import { ackCartCleared, fetchPaidOrders } from "../api/svc/payment/paymentApi";

const SAVE_DEBOUNCE_MS = 600;

const lineKey = (id: string | number, size: string, color: string) =>
  `${id}|${size}|${color}`;

const CartSync = () => {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  const cart = useCartStore((state) => state.cart);
  // Whether the store's cart actually reflects the server yet. The push
  // effect below must never run before this is true - see the comment there.
  const cartLoaded = useCartStore((state) => state.isLoaded);
  // Bumped by the "Try again" button to make the load effect run again.
  const reloadKey = useCartStore((state) => state.reloadKey);
  // Bumped when a payment may have just completed (payment step, orders page).
  const reconcileKey = useCartStore((state) => state.reconcileKey);
  const replaceCart = useCartStore((state) => state.replaceCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const setLoadError = useCartStore((state) => state.setLoadError);

  // The user whose cart has been SUCCESSFULLY loaded.
  const loadedForUserId = useRef<string | null>(null);
  // The user whose cart is being fetched right now (prevents double fetches,
  // e.g. from React Strict Mode running effects twice in development).
  const loadingForUserId = useRef<string | null>(null);
  // Who is signed in right now, so a slow response for a previous account
  // can be ignored.
  const currentUserId = useRef<string | null>(null);
  // Set right after replaceCart() during the load, so the "push on change"
  // effect below doesn't immediately re-save what was just loaded.
  const skipNextPush = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconcileRunning = useRef(false);

  useEffect(() => {
    currentUserId.current = isSignedIn && userId ? userId : null;
  });

  // Removes items from the cart that the customer has already PAID for, and
  // saves the result to the server BEFORE telling the payment service the
  // cart is clean - so a paid item can never come back from a stale server
  // cart. Orders that failed or are still pending are never touched.
  // Safe to run repeatedly.
  const reconcilePaidItems = async () => {
    if (reconcileRunning.current) return;
    const activeUser = currentUserId.current;
    if (!activeUser || loadedForUserId.current !== activeUser) return;

    reconcileRunning.current = true;
    try {
      const token = await getToken();
      if (!token) return;

      const paidOrders = await fetchPaidOrders(token);
      if (paidOrders.length === 0) return;
      if (currentUserId.current !== activeUser) return;

      const paidKeys = new Set(
        paidOrders.flatMap((order) =>
          order.lines.map((l) =>
            lineKey(l.productId, l.selectedSize, l.selectedColor),
          ),
        ),
      );

      const current = useCartStore.getState().cart;
      const remaining = current.filter(
        (item) =>
          !paidKeys.has(
            lineKey(item.id, item.selectedSize, item.selectedColor),
          ),
      );

      if (remaining.length !== current.length) {
        // The push effect would also save this; we save it ourselves below,
        // right now, so skip that one.
        skipNextPush.current = true;
        replaceCart(remaining);
      }

      // Always save before acknowledging (even if nothing changed locally),
      // so the server cart is guaranteed to match.
      await saveServerCart(token, remaining);
      await ackCartCleared(
        token,
        paidOrders.map((order) => order.merchantReference),
      );
    } catch (error) {
      // Not acknowledged, so it is simply tried again next time.
      console.error("Cart reconcile failed:", error);
    } finally {
      reconcileRunning.current = false;
    }
  };

  // Always points at the latest version of the function above.
  const reconcileRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    reconcileRef.current = reconcilePaidItems;
  });

  // Load-on-sign-in / clear-on-sign-out.
  useEffect(() => {
    if (!authLoaded) return;

    if (!isSignedIn || !userId) {
      setLoadError(null);
      if (
        loadedForUserId.current !== null ||
        loadingForUserId.current !== null
      ) {
        loadedForUserId.current = null;
        loadingForUserId.current = null;
        clearCart();
        // Don't leave one customer's delivery details for the next one.
        useCheckoutStore.getState().reset();
      }
      return;
    }

    if (
      loadedForUserId.current === userId ||
      loadingForUserId.current === userId
    ) {
      return;
    }

    loadingForUserId.current = userId;
    setLoadError(null);

    const load = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("No session token available yet");

        const serverCart = await fetchServerCart(token);

        // Signed out or switched account while we were waiting.
        if (currentUserId.current !== userId) return;

        loadedForUserId.current = userId;
        skipNextPush.current = true;
        replaceCart(serverCart);

        // In the background: drop anything that was paid for since last time
        // (e.g. a mobile money payment approved after the tab was closed).
        void reconcileRef.current();
      } catch (error) {
        console.error("Cart fetch failed:", error);
        if (currentUserId.current === userId) {
          setLoadError(
            "We couldn't load your cart right now. Your saved items are safe.",
          );
        }
      } finally {
        if (loadingForUserId.current === userId) {
          loadingForUserId.current = null;
        }
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn, userId, reloadKey]);

  // Somebody (the payment step, the orders page) says a payment may have
  // just completed.
  useEffect(() => {
    if (reconcileKey === 0) return;
    void reconcileRef.current();
  }, [reconcileKey]);

  // Push local changes to the server while signed in.
  //
  // cartLoaded is the critical guard here. Without it, this effect would
  // fire while `cart` is still the store's initial [] and could save an
  // EMPTY cart over the real one in MongoDB if the fetch is slow. Requiring
  // cartLoaded means nothing is pushed until a real load has landed - and
  // since a failed load never sets cartLoaded, a failed load can no longer
  // lead to the saved cart being overwritten either.
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
