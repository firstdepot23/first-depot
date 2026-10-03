"use client";

import { ShippingFormInputs } from "@repo/types";
import {
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { useState } from "react";

const CheckoutForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const checkoutResult = useCheckoutElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (checkoutResult.type !== "success") return;
    const { checkout } = checkoutResult;

    setLoading(true);
    await checkout.updateEmail(shippingForm.email);
    await checkout.updateShippingAddress({
      name: "shipping_address",
      address: {
        line1: shippingForm.address,
        city: shippingForm.city,
        country: "UG",
      },
    });

    const res = await checkout.confirm();
    if (res.type === "error") {
      setError(res.error.message);
    }
    setLoading(false);
  };

  if (checkoutResult.type === "error") {
    return (
      <div className="">
        Couldn&apos;t load checkout: {checkoutResult.error.message}
      </div>
    );
  }

  return (
    <form>
      <PaymentElement
        options={{ layout: "accordion" }}
        onLoadError={(event) =>
          setError(event.error.message ?? "Failed to load payment form")
        }
      />
      <button
        disabled={loading || checkoutResult.type !== "success"}
        onClick={handleClick}
      >
        {loading ? "Loading..." : "Pay"}
      </button>
      {error && <div className="">{error}</div>}
    </form>
  );
};

export default CheckoutForm;
