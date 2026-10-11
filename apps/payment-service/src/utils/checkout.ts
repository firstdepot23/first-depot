import { CheckoutDetails } from "@repo/order-db";
import {
  asDeliveryCity,
  asDeliveryMethod,
  DELIVERY_CITIES,
  DELIVERY_CITY_INFO,
  DELIVERY_METHODS,
  getDeliveryFee,
  PICKUP_STATION,
  type DeliveryCity,
  type DeliveryMethod,
} from "./delivery";

/** A problem with what the customer sent. Routes answer these with HTTP 400. */
export class CheckoutError extends Error {}

export type Shipping = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

export type CheckoutInput = {
  shipping: Shipping;
  deliveryMethod: DeliveryMethod;
  deliveryCity: DeliveryCity;
};

export type SavedCheckout = CheckoutInput & { deliveryFee: number };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Validates the body of PUT /checkout/details. Never trusts the browser. */
export const parseCheckoutInput = (body: unknown): CheckoutInput => {
  if (!isObject(body) || !isObject(body.shipping)) {
    throw new CheckoutError("Delivery details are missing.");
  }

  const deliveryMethod = body.deliveryMethod;
  if (!DELIVERY_METHODS.includes(deliveryMethod as DeliveryMethod)) {
    throw new CheckoutError("Choose pickup or delivery.");
  }
  const method = deliveryMethod as DeliveryMethod;

  const s = body.shipping;
  const name = text(s.name);
  const email = text(s.email);
  const phone = text(s.phone);

  if (!name) throw new CheckoutError("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutError("Enter a valid email address.");
  }
  if (!/^\d{7,10}$/.test(phone)) {
    throw new CheckoutError("Phone number must be 7 to 10 digits.");
  }

  if (method === "pickup") {
    // Pickup always means the station, whatever the browser sent.
    return {
      shipping: {
        name,
        email,
        phone,
        address: PICKUP_STATION.address,
        city: PICKUP_STATION.city,
      },
      deliveryMethod: "pickup",
      deliveryCity: asDeliveryCity(body.deliveryCity),
    };
  }

  const address = text(s.address);
  if (!address) throw new CheckoutError("Address is required for delivery.");

  if (!DELIVERY_CITIES.includes(body.deliveryCity as DeliveryCity)) {
    throw new CheckoutError("Choose a delivery city.");
  }
  const deliveryCity = body.deliveryCity as DeliveryCity;

  // For a listed city, the city name comes from OUR list (never from the
  // browser). Only "other town" uses what the customer typed.
  const city =
    deliveryCity === "other"
      ? text(s.city)
      : DELIVERY_CITY_INFO[deliveryCity].label;
  if (!city) throw new CheckoutError("Enter the town you want it delivered to.");

  return {
    shipping: { name, email, phone, address, city },
    deliveryMethod: "delivery",
    deliveryCity,
  };
};

export const saveCheckoutDetails = async (
  userId: string,
  input: CheckoutInput,
): Promise<SavedCheckout> => {
  await CheckoutDetails.findOneAndUpdate(
    { userId },
    {
      $set: {
        shipping: input.shipping,
        deliveryMethod: input.deliveryMethod,
        deliveryCity: input.deliveryCity,
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return {
    ...input,
    deliveryFee: getDeliveryFee(input.deliveryMethod, input.deliveryCity),
  };
};

export const getCheckoutDetails = async (
  userId: string,
): Promise<SavedCheckout | null> => {
  const doc = await CheckoutDetails.findOne({ userId });
  if (!doc?.shipping) return null;
  const shipping = doc.shipping;

  const deliveryMethod = asDeliveryMethod(doc.deliveryMethod);
  const deliveryCity = asDeliveryCity(doc.deliveryCity);

  return {
    shipping: {
      name: shipping.name,
      email: shipping.email,
      phone: shipping.phone,
      address: shipping.address,
      city: shipping.city,
    },
    deliveryMethod,
    deliveryCity,
    deliveryFee: getDeliveryFee(deliveryMethod, deliveryCity),
  };
};

type CartItemLike = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

/**
 * Everything the payment needs, worked out on the server: the saved delivery
 * details, the delivery fee, and the total to charge.
 */
export const prepareCheckout = async (
  userId: string,
  cart: CartItemLike[],
) => {
  const validCart = cart.every(
    (item) =>
      Number.isFinite(item.price) &&
      item.price >= 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0,
  );
  if (!validCart) throw new CheckoutError("Your cart has an invalid item.");

  const details = await getCheckoutDetails(userId);
  if (!details) {
    throw new CheckoutError(
      "Add your delivery details before paying (go back to the shipping step).",
    );
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return {
    ...details,
    subtotal,
    amount: subtotal + details.deliveryFee,
  };
};
