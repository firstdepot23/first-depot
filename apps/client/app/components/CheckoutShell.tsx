"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import type { ReactNode } from "react";
import useCartStore, { useCartLoaded } from "../stores/storeCart";
import CartSummary from "./CartSummary";
import CheckoutSteps from "./CheckoutSteps";

const CheckoutShell = ({ children }: { children: ReactNode }) => {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const cartLoaded = useCartLoaded();
  const loadError = useCartStore((state) => state.loadError);
  const requestReload = useCartStore((state) => state.requestReload);

  // "Ready" covers both: Clerk knows who's signed in, AND (if they are
  // signed in) their cart has actually been fetched from the server.
  const ready = authLoaded && (!isSignedIn || cartLoaded);

  return (
    <div className="mt-6 flex w-full flex-col items-center justify-center gap-6 sm:mt-12 sm:gap-8">
      <h1 className="text-xl font-medium sm:text-2xl">Your Shopping Cart</h1>

      {authLoaded && !isSignedIn ? (
        // The cart lives in the account's database record - there's
        // nothing to show without being signed in.
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-gray-100 p-6 text-center shadow-lg sm:p-8">
          <p className="text-sm text-gray-500">
            Sign in to view your cart and continue shopping.
          </p>
          <button
            type="button"
            onClick={() => openSignIn()}
            className="cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition-all duration-300 hover:bg-gray-900"
          >
            Sign in
          </button>
        </div>
      ) : (
        <>
          <CheckoutSteps />

          <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-16">
            {/* THE CURRENT STEP */}
            <div className="flex h-max w-full min-w-0 flex-col gap-6 rounded-lg border border-gray-100 p-4 shadow-lg sm:p-8 lg:w-7/12">
              {!ready ? (
                loadError ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-gray-700">{loadError}</p>
                    <button
                      type="button"
                      onClick={() => requestReload()}
                      className="cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition-all duration-300 hover:bg-gray-900"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-gray-500">
                      Loading your cart...
                    </p>
                    <p className="text-xs text-gray-400">
                      This can take a few seconds if the server is waking up.
                    </p>
                  </div>
                )
              ) : (
                children
              )}
            </div>

            {/* ORDER SUMMARY */}
            <CartSummary ready={ready} />
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutShell;
