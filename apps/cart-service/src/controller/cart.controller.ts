import { Response } from "express";
import { Cart, CartItemDoc } from "@repo/cart-db";
import { AuthedRequest } from "../middleware/requireAuth";


const PRODUCT_SERVICE_URL = (
  process.env.PRODUCT_SERVICE_URL ??
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL ??
  ""
).replace(/\/+$/, "");


const hydrateCartItems = async (items: CartItemDoc[]) => {
  if (!PRODUCT_SERVICE_URL) {
    throw new Error(
      "PRODUCT_SERVICE_URL is not set (the product service's https:// address)",
    );
  }

  const hydrated = await Promise.all(
    items.map(async (item) => {
      try {
        const res = await fetch(
          `${PRODUCT_SERVICE_URL}/products/${item.productId}`,
          // Don't let one slow or sleeping product service hang the cart.
          { signal: AbortSignal.timeout(10000) },
        );
        if (!res.ok) {
          console.error(
            `Product ${item.productId} lookup returned ${res.status}`,
          );
          return null;
        }

        const product = await res.json();
        return {
          ...product,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        };
      } catch (error) {
        console.error(
          `Failed to hydrate product ${item.productId}:`,
          error,
        );
        return null;
      }
    }),
  );

  return hydrated.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
};

export const getCart = async (req: AuthedRequest, res: Response) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    const items = cart ? await hydrateCartItems(cart.items) : [];
    return res.status(200).json({ items });
  } catch (error) {
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

    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId },
      { items: normalized },
      { upsert: true, new: true },
    );

    return res.status(200).json({ items: await hydrateCartItems(cart.items) });
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