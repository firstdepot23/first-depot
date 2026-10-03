import { CartItemsType } from "@repo/types";

const CART_SERVICE_URL = process.env.NEXT_PUBLIC_CART_SERVICE_URL;

export const fetchServerCart = async (
  token: string,
): Promise<CartItemsType> => {
  if (!CART_SERVICE_URL) {
    throw new Error("NEXT_PUBLIC_CART_SERVICE_URL is not set");
  }

  const res = await fetch(`${CART_SERVICE_URL}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch cart (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
};

export const saveServerCart = async (
  token: string,
  cart: CartItemsType,
): Promise<void> => {
  if (!CART_SERVICE_URL) {
    throw new Error("NEXT_PUBLIC_CART_SERVICE_URL is not set");
  }

  const res = await fetch(`${CART_SERVICE_URL}/cart`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items: cart }),
  });

  if (!res.ok) {
    throw new Error(`Failed to save cart (${res.status})`);
  }
};