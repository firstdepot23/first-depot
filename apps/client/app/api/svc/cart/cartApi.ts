import { CartItemsType } from "@repo/types";

// Goes through this site's own server (app/api/svc/[service]/[...path]) rather
// than straight to the cart service's *.onrender.com address, so it works for
// visitors whose network can't resolve that hostname.
const CART_URL = "/api/svc/cart/cart";

// The cart service (and the product service behind it) sleep on Render's free
// tier, so the first request after a quiet period can take a minute. Give it
// time, and retry a few times before telling the user it failed.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_500;
const REQUEST_TIMEOUT_MS = 90_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 4xx errors (e.g. 401) won't fix themselves, so don't retry those.
const isRetryableStatus = (status: number) =>
  status >= 500 || status === 408 || status === 429;

export const fetchServerCart = async (
  token: string,
): Promise<CartItemsType> => {
  let lastError: Error = new Error("Failed to fetch cart");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response | null = null;

    try {
      res = await fetch(CART_URL, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // Network failure, CORS block, or timeout.
      lastError =
        error instanceof Error ? error : new Error("Network error");
    }

    if (res) {
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.items) ? data.items : [];
      }

      lastError = new Error(`Failed to fetch cart (${res.status})`);
      if (!isRetryableStatus(res.status)) throw lastError;
    }

    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }

  throw lastError;
};

export const saveServerCart = async (
  token: string,
  cart: CartItemsType,
): Promise<void> => {
  const res = await fetch(CART_URL, {
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