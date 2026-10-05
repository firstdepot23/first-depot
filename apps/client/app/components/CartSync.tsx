"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import useCartStore from "../stores/storeCart";
import { fetchServerCart, saveServerCart } from "../lib/cartApi";

const SAVE_DEBOUNCE_MS = 600;

const CartSync = () => {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  const cart = useCartStore((state) => state.cart);
  // Whether the store's cart actually reflects the server yet. The push
  // effect below must never run before this is true - see the comment there.
  const cartLoaded = useCartStore((state) => state.isLoaded);
  // Bumped by the "Try again" button to make the load effect run again.
  const reloadKey = useCartStore((state) => state.reloadKey);
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

  useEffect(() => {
    currentUserId.current = isSignedIn && userId ? userId : null;
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
