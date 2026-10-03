"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartItemsType, ShippingFormInputs } from "@repo/types";
import CheckoutForm from "./CheckoutForm";
import useCartStore from "../stores/storeCart";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable",
  );
}

const stripe = loadStripe(stripePublishableKey);

const fetchClientSecret = async (cart: CartItemsType, token: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRIPE_PAYMENT_SERVICE_URL}/sessions/create-checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({
        cart,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Failed to create checkout session (${response.status}): ${errorBody}`,
    );
  }

  const json = await response.json();

  if (!json.checkoutSessionClientSecret) {
    throw new Error(
      "Checkout session response is missing checkoutSessionClientSecret",
    );
  }

  return json.checkoutSessionClientSecret as string;
};

const StripePaymentForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const { cart } = useCartStore();
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [clientSecretPromise, setClientSecretPromise] =
    useState<Promise<string> | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then((t) => {
      if (t) {
        setToken(t);
      } else {
        setAuthError(true);
      }
    });
  }, [getToken]);

  useEffect(() => {
    if (token && cart.length > 0 && !clientSecretPromise) {
      const promise = fetchClientSecret(cart, token);
      promise.catch((err) => setSessionError(err.message));
      setClientSecretPromise(promise);
    }
  }, [token, cart, clientSecretPromise]);

  if (authError) {
    return (
      <div className="">
        Unable to verify your session. Please sign in again.
      </div>
    );
  }

  if (sessionError) {
    return <div className="">Couldn&apos;t start checkout: {sessionError}</div>;
  }

  if (!clientSecretPromise) {
    return <div className="">Loading...</div>;
  }

  return (
    <CheckoutElementsProvider
      stripe={stripe}
      options={{ clientSecret: clientSecretPromise }}
    >
      <CheckoutForm shippingForm={shippingForm} />
    </CheckoutElementsProvider>
  );
};

export default StripePaymentForm;
