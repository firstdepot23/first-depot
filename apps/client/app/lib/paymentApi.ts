import type {
  DeliveryMethod,
  DeliveryCity,
  ShippingFormInputs,
} from "@repo/types";

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;

// The payment service sleeps on Render's free tier too, so allow a slow start.
const REQUEST_TIMEOUT_MS = 60_000;

const request = async <T>(
  path: string,
  token: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> => {
  if (!PAYMENT_SERVICE_URL) {
    throw new Error("NEXT_PUBLIC_PAYMENT_SERVICE_URL is not set");
  }

  const res = await fetch(`${PAYMENT_SERVICE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined && { "Content-Type": "application/json" }),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    // The payment service answers problems with { error: "..." }.
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }

  return res.json();
};

// ---------------------------------------------------------------------------
// Delivery details (shipping step)
// ---------------------------------------------------------------------------

export type SavedCheckout = {
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  deliveryMethod: DeliveryMethod;
  deliveryCity: DeliveryCity;
  deliveryFee: number;
};

export const toShippingForm = (saved: SavedCheckout): ShippingFormInputs => ({
  ...saved.shipping,
  deliveryMethod: saved.deliveryMethod,
  deliveryCity: saved.deliveryCity,
});

export const fetchCheckoutDetails = async (
  token: string,
): Promise<SavedCheckout | null> => {
  const data = await request<{ details: SavedCheckout | null }>(
    "/checkout/details",
    token,
  );
  return data.details;
};

export const saveCheckoutDetails = async (
  token: string,
  form: ShippingFormInputs,
): Promise<SavedCheckout> => {
  const { deliveryMethod, deliveryCity, ...shipping } = form;
  const data = await request<{ details: SavedCheckout }>(
    "/checkout/details",
    token,
    { method: "PUT", body: { shipping, deliveryMethod, deliveryCity } },
  );
  return data.details;
};

// ---------------------------------------------------------------------------
// Emptying the cart after a successful payment
// ---------------------------------------------------------------------------

export type PaidOrder = {
  merchantReference: string;
  lines: { productId: string; selectedSize: string; selectedColor: string }[];
};

/** Orders that are COMPLETED but whose items are still in the cart. */
export const fetchPaidOrders = async (token: string): Promise<PaidOrder[]> => {
  const data = await request<{ orders: PaidOrder[] }>(
    "/payments/paid-lines",
    token,
  );
  return Array.isArray(data.orders) ? data.orders : [];
};

/** Tell the server the cart no longer has these orders' items. */
export const ackCartCleared = async (
  token: string,
  references: string[],
): Promise<void> => {
  await request("/payments/cart-cleared", token, {
    method: "POST",
    body: { references },
  });
};
