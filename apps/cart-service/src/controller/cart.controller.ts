import { Response } from "express";
import { Cart, CartItemDoc } from "@repo/cart-db";
import { AuthedRequest } from "../middleware/requireAuth";

const PRODUCT_SERVICE_URL = (
  process.env.PRODUCT_SERVICE_URL ??
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL ??
  ""
).replace(/\/+$/, "");

if (!PRODUCT_SERVICE_URL) {
  console.warn(
    "PRODUCT_SERVICE_URL is not set - GET /cart cannot load product details until it is (use the product service's https:// address).",
  );
}

// Render's free tier puts the product service to sleep; waking it can take
// ~30-60s. So each lookup gets a generous timeout and a couple of retries.
const PRODUCT_TIMEOUT_MS = 20_000;
const PRODUCT_ATTEMPTS = 3;
const PRODUCT_RETRY_DELAY_MS = 1_000;
const CACHE_TTL_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Thrown when product details could not be loaded (as opposed to a product
// that genuinely no longer exists). The cart must NOT be treated as empty in
// this case, or the client would load a partial/empty cart and later save it
// over the real one in MongoDB.
class ProductServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductServiceUnavailableError";
  }
}

type ProductJson = Record<string, unknown>;

type ProductLookup =
  | { status: "ok"; product: ProductJson }
  | { status: "missing" } // 404 - the product was deleted
  | { status: "error" }; // network error / timeout / 5xx after all retries

// Small in-memory cache: avoids hammering the product service on every cart
// load, and lets us still answer if it is briefly down (stale copy is used).
const productCache = new Map<
  number,
  { product: ProductJson; fetchedAt: number }
>();

const lookupProduct = async (productId: number): Promise<ProductLookup> => {
  const cached = productCache.get(productId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { status: "ok", product: cached.product };
  }

  for (let attempt = 1; attempt <= PRODUCT_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}`, {
        signal: AbortSignal.timeout(PRODUCT_TIMEOUT_MS),
      });

      if (res.ok) {
        const product = (await res.json()) as ProductJson;
        productCache.set(productId, { product, fetchedAt: Date.now() });
        return { status: "ok", product };
      }

      if (res.status === 404) {
        productCache.delete(productId);
        return { status: "missing" };
      }

      console.error(
        `Product ${productId} lookup returned ${res.status} (attempt ${attempt}/${PRODUCT_ATTEMPTS})`,
      );
    } catch (error) {
      console.error(
        `Product ${productId} lookup failed (attempt ${attempt}/${PRODUCT_ATTEMPTS}):`,
        error,
      );
    }

    if (attempt < PRODUCT_ATTEMPTS) await sleep(PRODUCT_RETRY_DELAY_MS);
  }

  // Every attempt failed: fall back to a stale cached copy if we have one.
  if (cached) return { status: "ok", product: cached.product };
  return { status: "error" };
};

const hydrateCartItems = async (items: CartItemDoc[]) => {
  if (!PRODUCT_SERVICE_URL) {
    throw new ProductServiceUnavailableError(
      "PRODUCT_SERVICE_URL is not set (the product service's https:// address)",
    );
  }

  // Look each product up once, even if it appears in several sizes/colors.
  const productIds = [...new Set(items.map((item) => item.productId))];
  const lookups = new Map<number, ProductLookup>();
  await Promise.all(
    productIds.map(async (id) => {
      lookups.set(id, await lookupProduct(id));
    }),
  );

  if ([...lookups.values()].some((lookup) => lookup.status === "error")) {
    throw new ProductServiceUnavailableError(
      "Could not load product details from the product service",
    );
  }

  // Products that were deleted (404) are dropped; everything else is kept.
  return items.flatMap((item) => {
    const lookup = lookups.get(item.productId);
    if (!lookup || lookup.status !== "ok") return [];
    return [
      {
        ...lookup.product,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      },
    ];
  });
};

export const getCart = async (req: AuthedRequest, res: Response) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    const items = cart ? await hydrateCartItems(cart.items) : [];
    return res.status(200).json({ items });
  } catch (error) {
    if (error instanceof ProductServiceUnavailableError) {
      console.error("getCart: product details unavailable:", error.message);
      return res.status(503).json({
        message: "Product details are temporarily unavailable. Please retry.",
      });
    }

    console.error("getCart failed:", error);
    return res.status(500).json({ message: "Failed to fetch cart" });
  }
};

type IncomingItem = {
  id: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
};

export const saveCart = async (req: AuthedRequest, res: Response) => {
  try {
    const body = req.body as { items?: IncomingItem[] };

    if (!Array.isArray(body.items)) {
      return res.status(400).json({ message: "items must be an array" });
    }

    const normalized: CartItemDoc[] = body.items
      .filter(
        (i) =>
          i &&
          typeof i.id === "number" &&
          typeof i.quantity === "number" &&
          i.quantity > 0 &&
          typeof i.selectedSize === "string" &&
          typeof i.selectedColor === "string",
      )
      .map((i) => ({
        productId: i.id,
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
        quantity: i.quantity,
      }));

    // `returnDocument: "after"` replaces the deprecated `new: true`.
    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId },
      { items: normalized },
      { upsert: true, returnDocument: "after" },
    );

    // Saving no longer calls the product service. It isn't needed to store
    // the cart, and a sleeping product service used to make this request
    // fail even though the cart had been saved.
    return res
      .status(200)
      .json({ saved: cart?.items.length ?? normalized.length });
  } catch (error) {
    console.error("saveCart failed:", error);
    return res.status(500).json({ message: "Failed to save cart" });
  }
};

export const clearCart = async (req: AuthedRequest, res: Response) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.userId },
      { items: [] },
      { upsert: true },
    );
    return res.status(200).json({ items: [] });
  } catch (error) {
    console.error("clearCart failed:", error);
    return res.status(500).json({ message: "Failed to clear cart" });
  }
};