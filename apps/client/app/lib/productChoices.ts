import type { ProductType } from "@repo/types";
import { unavailableReason } from "./productRules";

/*
 * Everything the shop needs to know about a product's PACKS (grocery: 500 g,
 * 1 Kg, 25 Kg, each with its own price) and CHOICES (fast food: accompaniment,
 * drink, add-ons, some with an extra price). Plain functions, no React, so the
 * product page, the product list and the tests all use the same rules.
 *
 * Money rule: unit price = price of the chosen pack (or the product's own
 * price) + the extra price of every chosen option.
 */

export type Pack = { id?: number; label: string; price: number; stock: number };

// Option ids the shopper ticked / picked, per group id.
export type Choices = Record<number, number[]>;

const same = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/\s+/g, " ") ===
  b.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The packs of a product. Products saved before pack sizes existed have no
 * pack rows, only `sizes` and one `price`, so each size becomes a pack at that
 * price: they keep working exactly as before.
 */
export const packsOf = (product: ProductType): Pack[] => {
  const rows = product.variants ?? [];
  if (rows.length > 0) {
    return rows.map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price,
      stock: v.stock,
    }));
  }
  return product.sizes.map((label) => ({
    label,
    price: product.price,
    stock: product.stock ?? 0,
  }));
};

/** True when the product has real pack rows (so each size has its own price). */
export const hasPackPrices = (product: ProductType) =>
  (product.variants?.length ?? 0) > 0;

export const packFor = (product: ProductType, size: string) =>
  packsOf(product).find((p) => same(p.label, size));

/** Option groups that have something to choose from. */
export const groupsOf = (product: ProductType) =>
  (product.optionGroups ?? []).filter((g) => g.options.length > 0);

/** True when the shopper has to answer something before it can be ordered. */
export const hasRequiredChoices = (product: ProductType) =>
  groupsOf(product).some((g) => g.required);

/** The options currently picked, with the group each belongs to. */
export const selectedOptions = (product: ProductType, choices: Choices) =>
  groupsOf(product).flatMap((group) => {
    const ids = choices[group.id] ?? [];
    // A "pick one" group only ever counts the most recent pick.
    const wanted = group.selection === "SINGLE" ? ids.slice(-1) : ids;
    return group.options
      .filter((o) => o.available && wanted.includes(o.id))
      .map((option) => ({ group, option }));
  });

/** Names of required groups that have no pick yet. */
export const missingGroups = (product: ProductType, choices: Choices) =>
  groupsOf(product)
    .filter(
      (g) =>
        g.required &&
        !selectedOptions(product, choices).some((s) => s.group.id === g.id),
    )
    .map((g) => g.name);

/** Price of ONE item for this pack + these options. */
export const unitPrice = (
  product: ProductType,
  size: string,
  choices: Choices,
) => {
  const base = packFor(product, size)?.price ?? product.price;
  const extras = selectedOptions(product, choices).reduce(
    (sum, s) => sum + s.option.extraPrice,
    0,
  );
  return base + extras;
};

/** "Chips, Passion, Add mayonnaise" (empty when nothing is picked). */
export const choiceSummary = (product: ProductType, choices: Choices) =>
  selectedOptions(product, choices)
    .map((s) => s.option.name)
    .join(", ");

/**
 * What goes into the cart line's `selectedSize`. The cart tells lines apart by
 * product + size + color, so:
 *  - a pack product uses its pack label (each pack is its own line);
 *  - a product with choices uses the picked names, so "Fish fingers with chips"
 *    and "Fish fingers with rice" are separate lines and read well in the cart.
 */
export const cartSizeFor = (
  product: ProductType,
  size: string,
  choices: Choices,
) => (groupsOf(product).length > 0 ? choiceSummary(product, choices) : size);

/**
 * Why this product can't be ordered right now, or null. Stock is judged on the
 * pack that is selected (a sold-out 25 Kg doesn't block the 1 Kg); fast food is
 * made to order, so stock doesn't apply to it.
 */
export const blockedFor = (product: ProductType, size: string) => {
  if (product.segment === "FASTFOOD") return null;
  const pack = hasPackPrices(product) ? packFor(product, size) : undefined;
  return unavailableReason(pack ? { ...product, stock: pack.stock } : product);
};