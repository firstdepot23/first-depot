import type { Product } from "@repo/product-db";
import z from "zod";

export type CartItemType = Product & {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

export type CartItemsType = CartItemType[];

export const shippingFormSchema = z.object({
  name: z.string().min(1, "Name is required!"),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
    .min(1, "Email is required!"),
  phone: z
    .string()
    .min(7, "Phone number must be between 7 and 10 digits!")
    .max(10, "Phone number must be between 7 and 10 digits!")
    .regex(/^\d+$/, "Phone number must contain only numbers!"),
  address: z.string().min(1, "Address is required!"),
  city: z.string().min(1, "City is required!"),
});

export type ShippingFormInputs = z.infer<typeof shippingFormSchema>;

export type CartStoreStateType = {
  cart: CartItemsType;
  // True once the signed-in user's cart has been fetched from the
  // server (or set to empty on sign-out). The cart has no local
  // persistence anymore, so this only exists to avoid flashing an
  // empty cart for a moment while the first fetch is in flight - it's
  // not guarding against a hydration mismatch, since the cart now
  // starts as [] identically on server and client every time.
  isLoaded: boolean;
  // Set when loading the cart from the server failed (so the cart page can
  // show an error + "Try again" instead of loading forever). Null otherwise.
  loadError: string | null;
  // Bumped by requestReload() to make CartSync fetch the cart again.
  reloadKey: number;
};

export type CartStoreActionsType = {
  addToCart: (product: CartItemType) => void;
  removeFromCart: (product: CartItemType) => void;
  // Sets the exact quantity of one cart line (same id + size + color).
  // A quantity of 0 or less removes the line.
  updateQuantity: (
    item: Pick<CartItemType, "id" | "selectedSize" | "selectedColor">,
    quantity: number,
  ) => void;
  // Swaps the entire cart at once - used when loading from the server on
  // sign-in. Not for normal add/remove/update flows, which should go
  // through the actions above so the server stays in sync one change at
  // a time via CartSync's debounced save.
  replaceCart: (items: CartItemsType) => void;
  clearCart: () => void;
  setLoadError: (message: string | null) => void;
  // Clears any load error and asks CartSync to fetch the cart again.
  requestReload: () => void;
};