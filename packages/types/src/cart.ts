import type { Product } from "@repo/product-db";
import z from "zod";

export type CartItemType = Product & {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

export type CartItemsType = CartItemType[];

// ---------------------------------------------------------------------------
// Delivery
//
// The customer picks ONE of two ways to get their order:
//   - "pickup":   collect from our station, free
//   - "delivery": delivered to their address, fee depends on the CITY
//
// Fees are per city, based on distance from our dispatch point in Lira
// (parcel / courier scale). Heavy loads such as cement and iron sheets can
// cost more; we contact the customer before dispatch if that applies.
//
// The payment service has its own copy of the fees
// (apps/payment-service/src/utils/delivery.ts) because it is what actually
// charges the customer. KEEP THE TWO IN SYNC when you change a fee.
// ---------------------------------------------------------------------------
export const DELIVERY_METHODS = ["pickup", "delivery"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

// Order here = order in the city dropdown. "other" must stay last.
export const DELIVERY_CITIES = [
  "lira",
  "arua",
  "entebbe",
  "fort_portal",
  "gulu",
  "hoima",
  "jinja",
  "kabale",
  "kampala",
  "masaka",
  "mbale",
  "mbarara",
  "soroti",
  "other",
] as const;
export type DeliveryCity = (typeof DELIVERY_CITIES)[number];

export const DELIVERY_CITY_INFO: Record<
  DeliveryCity,
  { label: string; fee: number; eta: string }
> = {
  lira: { label: "Lira City", fee: 5_000, eta: "Same day or next day" },
  arua: { label: "Arua", fee: 15_000, eta: "2 to 3 working days" },
  entebbe: { label: "Entebbe", fee: 15_000, eta: "1 to 2 working days" },
  fort_portal: {
    label: "Fort Portal",
    fee: 25_000,
    eta: "3 to 5 working days",
  },
  gulu: { label: "Gulu", fee: 10_000, eta: "1 to 2 working days" },
  hoima: { label: "Hoima", fee: 15_000, eta: "2 to 3 working days" },
  jinja: { label: "Jinja", fee: 15_000, eta: "2 to 3 working days" },
  kabale: { label: "Kabale", fee: 25_000, eta: "3 to 5 working days" },
  kampala: { label: "Kampala", fee: 15_000, eta: "1 to 2 working days" },
  masaka: { label: "Masaka", fee: 20_000, eta: "2 to 4 working days" },
  mbale: { label: "Mbale", fee: 15_000, eta: "2 to 3 working days" },
  mbarara: { label: "Mbarara", fee: 20_000, eta: "2 to 4 working days" },
  soroti: { label: "Soroti", fee: 10_000, eta: "1 to 2 working days" },
  other: {
    label: "Other town in Uganda",
    fee: 25_000,
    eta: "2 to 5 working days",
  },
};

// Where customers collect free pickup orders. Edit to your real station.
export const PICKUP_STATION = {
  address: "First Depot station",
  city: "Lira City",
};

export const getDeliveryFee = (method: DeliveryMethod, city: DeliveryCity) =>
  method === "delivery" ? DELIVERY_CITY_INFO[city].fee : 0;

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
  // For pickup, address and city are filled in with the station's by the form.
  // For delivery, `city` is the chosen city (or the typed town for "other").
  address: z.string().min(1, "Address is required!"),
  city: z.string().min(1, "City is required!"),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  deliveryCity: z.enum(DELIVERY_CITIES),
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
  // Bumped by requestReconcile() to make CartSync remove items that were
  // already paid for (see CartSync).
  reconcileKey: number;
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
  // Asks CartSync to check for paid orders and drop their items from the cart.
  requestReconcile: () => void;
};
