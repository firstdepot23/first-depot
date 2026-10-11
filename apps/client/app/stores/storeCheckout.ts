import {
  DeliveryMethod,
  DeliveryCity,
  ShippingFormInputs,
} from "@repo/types";
import { create } from "zustand";

type CheckoutState = {
  // The delivery details the customer submitted on the shipping step.
  // null until then (or until they are restored from the server).
  shipping: ShippingFormInputs | null;
  // The CURRENT choice, updated live while the form is open so the cart
  // summary can show the delivery fee before the form is submitted.
  deliveryMethod: DeliveryMethod;
  deliveryCity: DeliveryCity;
  setShipping: (shipping: ShippingFormInputs) => void;
  setDelivery: (method: DeliveryMethod, city: DeliveryCity) => void;
  reset: () => void;
};

// In memory only (like the cart). The same details are also saved on the
// server, which is where they are restored from after a page refresh.
const useCheckoutStore = create<CheckoutState>()((set) => ({
  shipping: null,
  deliveryMethod: "pickup",
  deliveryCity: "lira",
  setShipping: (shipping) =>
    set({
      shipping,
      deliveryMethod: shipping.deliveryMethod,
      deliveryCity: shipping.deliveryCity,
    }),
  setDelivery: (deliveryMethod, deliveryCity) =>
    set({ deliveryMethod, deliveryCity }),
  reset: () =>
    set({ shipping: null, deliveryMethod: "pickup", deliveryCity: "lira" }),
}));

export default useCheckoutStore;
