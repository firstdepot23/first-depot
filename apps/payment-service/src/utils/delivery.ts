// What the payment service CHARGES for delivery.
//
// KEEP IN SYNC with DELIVERY_CITY_INFO / PICKUP_STATION in
// packages/types/src/cart.ts (that copy is what the shop displays). They are
// separate files so this service never needs to import runtime code from
// @repo/types.

export const DELIVERY_METHODS = ["pickup", "delivery"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

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
  { label: string; fee: number }
> = {
  lira: { label: "Lira City", fee: 5_000 },
  arua: { label: "Arua", fee: 15_000 },
  entebbe: { label: "Entebbe", fee: 15_000 },
  fort_portal: { label: "Fort Portal", fee: 25_000 },
  gulu: { label: "Gulu", fee: 10_000 },
  hoima: { label: "Hoima", fee: 15_000 },
  jinja: { label: "Jinja", fee: 15_000 },
  kabale: { label: "Kabale", fee: 25_000 },
  kampala: { label: "Kampala", fee: 15_000 },
  masaka: { label: "Masaka", fee: 20_000 },
  mbale: { label: "Mbale", fee: 15_000 },
  mbarara: { label: "Mbarara", fee: 20_000 },
  soroti: { label: "Soroti", fee: 10_000 },
  other: { label: "Other town in Uganda", fee: 25_000 },
};

export const PICKUP_STATION = {
  address: "First Depot station",
  city: "Lira City",
};

export const getDeliveryFee = (method: DeliveryMethod, city: DeliveryCity) =>
  method === "delivery" ? DELIVERY_CITY_INFO[city].fee : 0;

export const asDeliveryMethod = (value: unknown): DeliveryMethod =>
  value === "delivery" ? "delivery" : "pickup";

export const asDeliveryCity = (value: unknown): DeliveryCity =>
  DELIVERY_CITIES.includes(value as DeliveryCity)
    ? (value as DeliveryCity)
    : "lira";
